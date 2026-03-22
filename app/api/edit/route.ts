import { NextResponse } from "next/server";
import { generateContent } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { section, content, instruction } = await req.json();

    if (!section || !content || !instruction) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Existing instruction length validation
    if (instruction.length > 2000) {
      return NextResponse.json(
        { error: "Instruction is too long (max 2000 characters)" },
        { status: 400 }
      );
    }

    const prompt = `
      You are an expert editor. 
      Rewrite the following section of a technical report based on the user's instructions.
      
      SECTION TITLE: ${section}
      CURRENT CONTENT: 
      "${content}"
      
      INSTRUCTION: 
      "${instruction}"
      
      Maintain the same level of detail unless asked otherwise. 
      Return ONLY the revised content as plain text. Do not wrap in JSON.
    `;

    const revisedContent = await generateContent(prompt, { 
      responseMimeType: "text/plain",
      temperature: 0.7 
    });

    if (!revisedContent || revisedContent.trim().length === 0) {
      return NextResponse.json(
        { error: "AI failed to generate content. Please try a different instruction." },
        { status: 500 }
      );
    }

    return NextResponse.json({ revisedContent });
  } catch (error: any) {
    console.error("Error in /api/edit:", error);
    return NextResponse.json(
      { error: error.message || "Failed to edit section" },
      { status: 500 }
    );
  }
}
