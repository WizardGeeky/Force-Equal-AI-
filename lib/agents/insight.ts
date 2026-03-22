import { generateJsonContent } from "../gemini";
import { PlannerOutput } from "./planner";

export interface InsightOutput {
  enrichedBreakdown: string[];
  risks: string[];
  insights: string[];
}

export async function runInsightAgent(plannerOutput: PlannerOutput): Promise<InsightOutput> {
  const prompt = `
    You are a Strategic Insight Agent.
    
    Analyze the following planning data and enrich it with deep strategic risks and unique insights.
    
    IMPORTANT: Think outside the box. Identify non-obvious risks and provide high-value, original insights specific to this scenario. Avoid generic templates.
    
    EDGE CASE HANDLING:
    - If the planner data contains contradictions or impossible assumptions, flag them in the risks.

    PLANNER DATA:
    ${JSON.stringify(plannerOutput, null, 2)}
    
    Return ONLY a JSON object with this exact structure:
    {
      "enrichedBreakdown": ["enriched specific point 1", "enriched specific point 2", ...],
      "risks": ["unique risk 1", "unique risk 2", ...],
      "insights": ["original strategic insight 1", "original strategic insight 2", ...]
    }
  `;

  return await generateJsonContent<InsightOutput>(prompt, 3, ["enrichedBreakdown", "risks", "insights"]);
}
