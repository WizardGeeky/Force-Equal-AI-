import { generateJsonContent } from "../gemini";
import { PlannerOutput } from "./planner";
import { InsightOutput } from "./insight";

export interface ExecutionOutput {
  problemBreakdown: string;
  stakeholders: string;
  solutionApproach: string;
  actionPlan: string;
  estimatedTimeline: string;
  budgetEstimate: string;
  infrastructureRequirements: string;
  endToEndPlan: string;
}

export async function runExecutionAgent(
  plannerOutput: PlannerOutput,
  insightOutput: InsightOutput
): Promise<ExecutionOutput> {
  const prompt = `
    You are a Senior Execution Agent.
    Synthesize the following planning and insight data into a comprehensive executive report.
    
    IMPORTANT: Each section must be detailed, professional, and contain UNIQUE actionable steps. Avoid generic advice. Be very specific to the problem. Provide high-density, professional content.
    
    REPORT TONE:
    - If the requirements were impossible, maintain a professional, advisory tone explaining the strategic shift.
    
    EDGE CASE HANDLING:
    - If the input is AMBIGUOUS (e.g., "Make it better"), make reasonable assumptions and flag them.
    - If the input is IMPOSSIBLE (e.g., "Free high profit without users"), identify the contradiction and suggest a realistic alternative.
    - If the input is in a NON-ENGLISH or MIXED language, maintain structural integrity while responding in English for the report.
    - If the input is GARBAGE, provide a polite fallback or the best possible interpretation.

    PLANNER DATA:
    ${JSON.stringify(plannerOutput, null, 2)}
    
    INSIGHT DATA:
    ${JSON.stringify(insightOutput, null, 2)}
    
    Return ONLY a JSON object with this exact structure:
    {
      "problemBreakdown": "A detailed and specific breakdown of the problem.",
      "stakeholders": "A detailed list of unique stakeholders and their roles.",
      "solutionApproach": "A high-level but specific strategy for the solution.",
      "actionPlan": "A professional, step-by-step numbered execution plan with specific dates or milestones.",
      "estimatedTimeline": "A detailed breakdown of the time required (e.g., days, weeks, months) per phase.",
      "budgetEstimate": "A professional estimate of the costs, including resources, tools, and labor.",
      "infrastructureRequirements": "Detailed technical stack, hosting, security, and hardware/software needs.",
      "endToEndPlan": "A high-level production-ready roadmap from inception to deployment and maintenance."
    }
  `;

  return await generateJsonContent<ExecutionOutput>(prompt, 3, [
    "problemBreakdown", "stakeholders", "solutionApproach", "actionPlan", 
    "estimatedTimeline", "budgetEstimate", "infrastructureRequirements", "endToEndPlan"
  ]);
}
