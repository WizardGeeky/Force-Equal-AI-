import { generateJsonContent } from "../gemini";

export interface PlannerOutput {
  problemBreakdown: string[];
  stakeholders: string[];
}

export async function runPlannerAgent(problem: string): Promise<PlannerOutput> {
  const prompt = `
    You are a Strategic Planner Agent. 
    Analyze the following problem and break it down into key components and identify main stakeholders.
    
    IMPORTANT: Provide unique, specific, and creative insights tailored EXACTLY to the problem. Avoid generic templates.
    
    EDGE CASE HANDLING:
    - If the input is AMBIGUOUS (e.g., "Make it better"), make reasonable assumptions and flag them.
    - If the input is IMPOSSIBLE (e.g., "Free high profit without users"), identify the contradiction and suggest a realistic alternative.
    - If the input is in a NON-ENGLISH or MIXED language, maintain structural integrity while responding in English for the report.
    - If the input is GARBAGE, provide a polite fallback or the best possible interpretation.

    PROBLEM:
    "${problem}"
    
    Return ONLY a JSON object with this exact structure:
    {
      "problemBreakdown": ["specific segment 1", "specific segment 2", ...],
      "stakeholders": ["unique stakeholder 1", "unique stakeholder 2", ...]
    }
  `;

  return await generateJsonContent<PlannerOutput>(prompt, 3, ["problemBreakdown", "stakeholders"]);
}
