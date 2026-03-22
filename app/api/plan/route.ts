import { NextResponse } from "next/server";
import { orchestratePlanning } from "@/lib/orchestrator";
import { analyzeProjectPrompt } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { problem, answers, history } = await req.json();

    if (!problem) {
      return NextResponse.json({ error: "Problem is required" }, { status: 400 });
    }

    // Step 1: Expert Observation & Feasibility Check
    // If history is provided, we are in a multi-turn chat
    const analysis = await analyzeProjectPrompt(problem, history);
    
    if (analysis.status === "INVALID") {
      return NextResponse.json({ error: analysis.reason }, { status: 400 });
    }

    if (analysis.status === "CLARIFY") {
      return NextResponse.json({ 
        status: "CLARIFY", 
        questions: analysis.questions,
        reason: analysis.reason
      });
    }

    // Step 2: Orchestration (Only if READY)
    const report = await orchestratePlanning(problem, answers);
    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Error in /api/plan:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate plan" },
      { status: 500 }
    );
  }
}
