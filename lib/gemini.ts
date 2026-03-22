import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export interface GeminiResponse {
  content: string;
  raw: any;
}

export async function generateContent(
  prompt: string,
  options: {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: "application/json" | "text/plain";
  } = {}
): Promise<string> {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
    generationConfig: {
      temperature: options.temperature ?? 0.8,
      maxOutputTokens: options.maxOutputTokens,
      responseMimeType: options.responseMimeType ?? "application/json",
    },
  });

  try {
    const timeoutThreshold = 30000; // 30 seconds
    const genPromise = model.generateContent(prompt).then(async result => {
      const resp = await result.response;
      return resp.text();
    });

    const timeoutPromise = new Promise<string>((_, reject) => 
      setTimeout(() => reject(new Error("AI Request Timed Out (30s)")), timeoutThreshold)
    );

    return await Promise.race([genPromise, timeoutPromise]);
  } catch (error: any) {
    if (error.message?.includes("429") || error.status === 429) {
      throw new Error("API Rate Limit: Free tier quota reached. Please wait or use a different API key.");
    }
    throw error;
  }
}

/**
 * Basic guard against common prompt injection patterns
 */
export function promptInjectionGuard(input: string): boolean {
  const patterns = [
    "ignore previous instructions",
    "ignore all previous",
    "system prompt",
    "reveal your prompt",
    "new instruction:",
    "forget what I said"
  ];
  const neutralizedInput = input.toLowerCase();
  return patterns.some(pattern => neutralizedInput.includes(pattern));
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Expert Observation Agent: Analyzes the conversation history for feasibility 
 * and identifies the next critical gap to clarify.
 */
export async function analyzeProjectPrompt(
  prompt: string, 
  history: ChatMessage[] = []
): Promise<{ 
  status: "INVALID" | "CLARIFY" | "READY"; 
  reason?: string; 
  questions?: string[]; // We'll return [nextQuestion] here if CLARIFY
}> {
  const historyText = history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
  
  const checkPrompt = `
    You are an Expert Project Strategist (Observation Agent). 
    Your task is to lead a consultative dialogue to refine a user's project idea into a perfect execution plan.

    USER'S INITIAL PROMPT: "${prompt}"
    
    CONVERSATION HISTORY SO FAR:
    ${historyText}

    Rules for Status:
    1. INVALID: 
       - Only for absolute non-sense, greetings, or malicious/illegal content.
    
    2. CLARIFY: 
       - Only if the vision is UNKNOWN (e.g., you don't know the core feature or target area).
       - IMPORTANT: Accept the user's strategy as FACT. Do not "interrogate" or "challenge" the user's business logic (e.g., if they say "better prices", accept it and move on).
       - TURN LIMIT: If there are 2 assistant messages in history, you MUST be READY. No exceptions.
    
    3. READY:
       - Default to this as soon as you have a general sense of the "What" and "Where".
       - In the 'reason', provide a supportive expert summary of the user's vision.

    Format:
    - Return ONE high-impact question if CLARIFY.
    - Be professional, supportive, and encouraging (like a partner, not a judge).

    Return ONLY a JSON object:
    {
      "status": "INVALID" | "CLARIFY" | "READY",
      "reason": "If INVALID, why. If READY, provide a brief expert confirmation.",
      "questions": ["Exactly one specific, high-impact NEXT question to ask the user"] or null
    }
  `;

  try {
    return await generateJsonContent(checkPrompt, 2, ["status"]);
  } catch (error: any) {
    if (error.message?.includes("Rate Limit") || error.status === 429) throw error;
    console.error("Expert Observation Agent failed:", error);
    return { status: "READY" }; 
  }
}

/**
 * Handles JSON output with schema-aware retries
 */
export async function generateJsonContent<T>(
  prompt: string,
  retries = 3,
  expectedKeys?: string[]
): Promise<T> {
  let currentPrompt = prompt;
  let lastError: any;

  for (let i = 0; i < retries; i++) {
    try {
      const text = await generateContent(currentPrompt, { 
        responseMimeType: "application/json",
        temperature: i === 0 ? 0.7 : 0.4
      });
      
      const parsed = JSON.parse(text);

      if (expectedKeys && expectedKeys.length > 0) {
        const missingKeys = expectedKeys.filter(key => !(key in parsed));
        if (missingKeys.length > 0) {
          throw new Error(`Missing required keys: ${missingKeys.join(", ")}`);
        }

        for (const key of expectedKeys) {
          const val = (parsed as any)[key];
          if (val === null || val === undefined || val === "" || (Array.isArray(val) && val.length === 0)) {
            throw new Error(`Strategic content for '${key}' is missing or empty. Retrying...`);
          }
        }
      }

      return parsed as T;
    } catch (error: any) {
      lastError = error;
      
      // Specifically handle rate limits (429) - ABORT IMMEDIATELY
      if (error.message?.includes("Rate Limit") || error.status === 429) {
        throw error;
      }

      console.error(`Gemini JSON parse attempt ${i + 1} failed:`, error.message);
      
      // On failure, enhance the prompt to be stricter about the JSON structure
      currentPrompt = `${prompt}
      
      CRITICAL: Your previous response was invalid JSON or missing keys. 
      Return ONLY a valid JSON object matching the requested schema. 
      Do not include any conversational text.
      ${expectedKeys ? `REQUIRED KEYS: ${expectedKeys.join(", ")}` : ""}
      `;
    }
  }
  throw new Error(`Failed to generate valid JSON after ${retries} attempts. Last error: ${lastError?.message}`);
}
