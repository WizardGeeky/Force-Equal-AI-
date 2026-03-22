import { runPlannerAgent } from "./agents/planner";
import { runInsightAgent } from "./agents/insight";
import { runExecutionAgent, ExecutionOutput } from "./agents/execution";
import { promptInjectionGuard } from "./gemini";

export async function orchestratePlanning(problem: string, answers?: { question: string, answer: string }[]): Promise<ExecutionOutput> {
  // 1. Security Guard
  if (promptInjectionGuard(problem)) {
    throw new Error("Malicious input detected. Please provide a legitimate project description.");
  }

  // Combine problem with answers for better AI context
  let enrichedProblem = problem;
  if (answers && answers.length > 0) {
    enrichedProblem += "\n\nAdditional clarification provided by the user:\n";
    answers.forEach(a => {
      enrichedProblem += `Q: ${a.question}\nA: ${a.answer}\n`;
    });
  }

  console.log("Starting Planner Agent...");
  const plannerOutput = await runPlannerAgent(enrichedProblem);
  
  console.log("Starting Insight Agent...");
  const insightOutput = await runInsightAgent(plannerOutput);
  
  console.log("Starting Execution Agent...");
  const executionOutput = await runExecutionAgent(plannerOutput, insightOutput);
  
  return executionOutput;
}
