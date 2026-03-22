# Force Equal AI - Strategic Planning Platform 🚀

**Force Equal AI (PlanAI)** is an advanced, multi-agent AI framework built on Next.js. It transforms high-level user ideas into structured, professional execution plans. It features a conversational "Expert Observation" agent layer that asks clarifying questions before orchestrating a swarm of specialized AI agents (Planner, Insight, Execution) to generate actionable deliverables.

## ✨ Features
- **Multi-Turn Chat Interface:** An initial interactive chat assesses the feasibility of the idea, asks clarifying questions, and gathers critical context before execution.
- **Agentic Swarm Workflow:** Bypasses basic "single-prompt" AI generation. Instead, a pipeline of specialized agents process, analyze, and enrich the data sequentially.
- **Pixel-Perfect UI:** Built with Tailwind CSS v4, Framer Motion, Aceternity UI, and Magic UI for a stunning, premium, and highly responsive user experience.
- **Robust Export System:** Native DOCX generation using XML parsing, and visually-perfect PDF exports that preserve the aesthetic web styling utilizing client-side canvas rendering.
- **Section-Level Editing:** Specialized editing agents allow refinement of specific sections within the generated report without regenerating the entire document.

## 🛠️ Tech Stack
- **Framework:** Next.js (App Router), React 19
- **Styling:** Tailwind CSS v4, global CSS keyframes
- **UI Components:** Shadcn UI, Aceternity UI, Magic UI, Framer Motion
- **AI Integration:** Google Generative AI (`@google/generative-ai`)
- **Document Export:** `docx`, `jspdf`, `html-to-image`, `html2pdf.js`

## 🏗️ Architecture
The application maintains a strict separation of concerns, isolating AI logic from the frontend rendering hierarchy:

```plaintext
force-equal-ai/
├── app/                      
│   ├── api/                  # Backend API routes
│   │   ├── plan/             # Entry point for Swarm Orchestrator and Chat
│   │   ├── edit/             # Section-level AI refinement logic
│   │   └── export/           # PDF and DOCX specialized generation routes
│   ├── report/               # Execution dashboard and visualization pages
│   └── page.tsx              # Landing page with interactive Chat UI
├── components/               # Pure React UI Components
│   ├── magicui/              # Magic UI components (e.g., Shimmer Button)
│   └── ui/                   # Shadcn and Aceternity components
└── lib/                      
    ├── agents/               # AI Swarm Agent Implementations
    │   ├── planner.ts        # Deconstructs raw ideas into problem/stakeholders
    │   ├── insight.ts        # Evaluates risks and generates unique insights
    │   └── execution.ts      # Synthesizes action plans, timelines, and budgets
    ├── gemini.ts             # Google GenAI bindings, Prompt Injection Guards, Expert agent
    └── orchestrator.ts       # Orchestrates the sequential multi-agent pipeline
```

## 🤖 How the Agents Work (End-to-End Workflow)
The platform bypasses standard generation by orchestrating a swarm of agents that build upon each other's outputs:

1. **Expert Observation Agent (Chat):** Activated via `/api/plan`. Uses `analyzeProjectPrompt()` to validate the user's idea. If the idea is ambiguous, it responds with clarifying questions (`CLARIFY` status). If valid, it proceeds (`READY` status).
2. **Planner Agent:** Taking the enriched problem and the user's answers, it processes the vision and outputs a detailed `problemBreakdown` alongside a list of key `stakeholders`.
3. **Insight Agent:** Analyzes the Planner's output to calculate hidden dependencies, identifying `risks`, and generating deep strategic `insights` that are not immediately obvious.
4. **Execution Agent:** Takes outputs from both the Planner and Insight agents to synthesize a comprehensive executive report. This includes `solutionApproach`, `actionPlan`, `estimatedTimeline`, `budgetEstimate`, `infrastructureRequirements`, and a production-ready `endToEndPlan`.
5. **Editing Agent:** Post-generation, users can target individual sections of the report. This agent rewrites targeted isolated text blocks based on new refinement prompts provided by the user.

## 🧠 Principal Engineering Perspective

For rigorous, enterprise-grade deployments, Force Equal AI implements numerous advanced architectural patterns to ensure high availability, security, and extensibility:

### 1. Swarm Fault Tolerance & Edge Case Recovery
- **Non-Deterministic Safeguards:** GenAI outputs are inherently unpredictable. The orchestrator enforces strict JSON parsing boundaries. If an agent (e.g., Planner) produces malformed JSON, the pipeline includes retry mechanisms and structural integrity fallbacks.
- **Contradiction Resolution:** The Insight and Execution agents are prompt-engineered to handle impossible or contradictory user constraints (e.g., "build a massive platform for free in two days") by explicitly calculating realistic alternative timelines and flagging the contradiction, rather than hallucinating impossible results.

### 2. Security & Prompt Injection Defense
- **Early-Stage Sanitization:** Found in `lib/gemini.ts`, `promptInjectionGuard` acts as a deterministic middleware layer. It intercepts known adversarial patterns (e.g., "ignore all previous instructions") and regex-matches malicious payloads before any expensive LLM token execution occurs.
- **Role-Based Execution Isolation:** Agents do not share context freely. The Planner only receives the sanitized problem. The Execution agent only receives the strictly parsed JSON outputs of the Planner and Insight modules. This prevents prompt-leaking across the swarm.

### 3. State Management & Multi-Turn Latency
- **Optimistic UI & Hydration:** During the conversational phase, the Next.js frontend employs optimistic state updates to provide $<200$ms perceived latency, masking the $1-3$ second LLM inference time.
- **Stateless Orchestration:** The backend (`/api/plan`) is entirely stateless. Conversation history is managed client-side and passed iteratively in the payload, allowing the Next.js API route to be deployed on Edge networks without relying on persistent server memory or Redis caching.

### 4. Extensibility: Adding New Agents
The linear pipeline (`orchestrator.ts`) is designed for O/C (Open/Closed) compliance. To add a new agent (e.g., a "Financial Analysis Agent"):
1. Create `financial.ts` inheriting the base `generateJsonContent` utility.
2. Define the exact TypeScript interface (`FinancialOutput`).
3. Inject it into `orchestratePlanning` between the Insight and Execution phases and pass the output to downstream consumers.

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- Google Gemini API Key

### Installation

```bash
# 1. Clone the repository and install dependencies
npm install

# 2. Add your Google Gemini API key to your environment variables
echo "GEMINI_API_KEY=your_key_here" > .env

# 3. Start the Next.js Turbo Dev Server
npm run dev
```
