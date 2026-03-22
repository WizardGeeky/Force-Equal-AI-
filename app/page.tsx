"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Layout, FileDown, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/lib/gemini";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";

export default function LandingPage() {
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Flow States
  const [flowStatus, setFlowStatus] = useState<"IDLE" | "CHATTING" | "READY">("IDLE");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startAnalysis = async (initialPrompt: string) => {
    setLoading(true);
    setFlowStatus("CHATTING");
    const initialMessage: ChatMessage = { role: "user", content: initialPrompt };
    setMessages([initialMessage]);
    
    await chatWithExpert(initialPrompt, [initialMessage]);
  };

  const chatWithExpert = async (originalPrompt: string, history: ChatMessage[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem: originalPrompt, history }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      if (data.status === "CLARIFY") {
        setMessages(prev => [...prev, { role: "assistant", content: data.questions[0] }]);
      } else {
        // The backend returned the full report, meaning it was READY
        setMessages(prev => [...prev, { role: "assistant", content: "Expert Observation: Complete. I have all the details needed to build your professional planning report." }]);
        setFlowStatus("READY");
        
        // Cache the generated report to prevent redundant API calls
        localStorage.setItem("ai_planner_current_report", JSON.stringify(data));
        localStorage.setItem("ai_planner_current_problem", originalPrompt);
      }
    } catch (err: any) {
      setError(err.message || "Failed to communicate with the expert.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentInput.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: currentInput };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setCurrentInput("");
    
    await chatWithExpert(problem, newHistory);
  };

  const handleInitialGenerate = () => {
    const trimmed = problem.trim();
    if (!trimmed) return setError("Describe your idea first.");
    startAnalysis(trimmed);
  };

  const handleFinalRedirect = () => {
    sessionStorage.setItem("ai_planner_problem", problem);
    // Combine chat history into a rich context for the report
    const fullContext = messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join("\n\n");
    sessionStorage.setItem("ai_planner_chat_history", fullContext);
    router.push("/report");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (flowStatus === "IDLE") handleInitialGenerate();
      else if (flowStatus === "CHATTING" && !loading) handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen relative w-full overflow-y-auto overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900 z-0 bg-[#F8F9FB] text-slate-900">
      {/* Subtle Radial Gradient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(215,220,255,0.4)_0%,transparent_50%)] pointer-events-none" />
      
      {/* Premium Floating Navbar */}
      <header className="fixed top-4 md:top-6 w-[calc(100%-2rem)] md:w-full z-50 px-5 md:px-6 py-3.5 md:py-4 flex items-center justify-between max-w-5xl mx-auto left-4 md:left-0 right-4 md:right-0 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 md:w-9 md:h-9 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-zinc-950 font-bold shadow-md">
            <Sparkles size={16} />
          </div>
          <span className="font-extrabold text-lg md:text-xl tracking-tight text-slate-900 dark:text-white">PlanAI<span className="text-indigo-500">.</span></span>
        </div>
        <button 
          onClick={() => {
            if (flowStatus === "IDLE") {
              const el = document.querySelector('textarea');
              if (el) el.focus();
            } else {
              setFlowStatus("IDLE");
              setProblem("");
            }
          }}
          className="text-xs md:text-sm font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 md:px-5 py-2 md:py-2.5 rounded-xl hover:scale-105 transition-all shadow-md"
        >
          {flowStatus === "IDLE" ? "Start Planning" : "New Project"}
        </button>
      </header>

      {/* Hero Section */}
      <div className={cn("max-w-7xl w-full mx-auto px-4 md:px-6 flex flex-col items-center text-center relative z-10", flowStatus === "IDLE" ? "pt-32 pb-20 flex-1 min-h-dvh" : "pt-28 md:pt-32 pb-6 md:pb-8 h-dvh overflow-hidden w-full")}>
        <AnimatePresence mode="wait">
          {flowStatus === "IDLE" && (
            <motion.div
               key="hero-text"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20, height: 0 }}
               transition={{ duration: 0.5, ease: "easeOut" }}
               className="space-y-6 flex flex-col items-center overflow-hidden"
            >
              {/* Reference Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200/60 shadow-sm text-slate-500 text-sm font-medium mt-6 md:mt-0">
                <Sparkles size={14} className="text-orange-400" />
                AI-powered planning engine
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-[#101828] leading-[1.1] tracking-tight max-w-5xl">
                Turn Ideas into<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]">Execution</span>{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] to-[#D97706]">Plans</span>{" "}
                with AI
              </h1>

              <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                Describe your project or idea. Our AI agent breaks it down into actionable plans, stakeholders, timelines, and risks — ready to export.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Card - Redesigned per Reference */}
        <motion.div
           layout
           initial={{ opacity: 0, scale: 0.98, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           transition={{ duration: 0.6, delay: 0.2 }}
           className={cn("w-full relative z-20 flex flex-col items-center", flowStatus === "IDLE" ? "max-w-4xl mt-12" : "max-w-4xl mt-0 flex-1 h-full")}
        >
          <div className={cn("relative bg-white border border-slate-200 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col transition-all duration-700 w-full", flowStatus === "IDLE" ? "rounded-[32px] h-[280px]" : "rounded-[24px] h-full mx-auto")}>
            {flowStatus === "IDLE" ? (
              <div className="flex-1 p-6 md:p-10 flex flex-col h-full relative">
                <textarea
                  value={problem}
                  onChange={(e) => {
                    setProblem(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your project idea... e.g., 'Build a mobile app for local food delivery'"
                  className={cn(
                    "flex-1 bg-transparent text-slate-900 border-none outline-none focus:ring-0 resize-none placeholder:text-slate-300 text-xl font-medium leading-relaxed w-full h-full",
                    error && "placeholder:text-red-300"
                  )}
                />
                
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0 }}
                      className="absolute bottom-24 left-10 text-red-600 text-sm font-bold uppercase tracking-widest bg-red-100/80 backdrop-blur-md px-6 py-3 rounded-2xl w-fit shadow-lg border border-red-200/50"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-100 mt-auto">
                  <div className="flex items-center gap-3.5 text-zinc-500">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_20px_rgba(16,185,129,1)]" />
                    <span className="text-[11px] font-black uppercase tracking-[0.25em]">System Online</span>
                  </div>
                  <ShimmerButton
                    onClick={handleInitialGenerate}
                    background="#059669"
                    shimmerColor="rgba(255,255,255,0.4)"
                    className="w-full md:w-auto text-lg font-extrabold shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all hover:scale-105 group"
                  >
                    <span className="flex items-center gap-3 text-white">
                      Initialize Swarm
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </ShimmerButton>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Chat History */}
                <div 
                   ref={scrollRef}
                   className="flex-1 overflow-y-auto p-4 md:p-12 space-y-6 md:space-y-8 scroll-smooth"
                >
                  {messages.map((m, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex flex-col max-w-[85%] gap-2",
                        m.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                      )}
                    >
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">
                        {m.role === "assistant" ? "PlanAI Engine" : "You"}
                      </span>
                      <div className={cn(
                        "p-5 md:p-6 rounded-[24px] font-medium text-base shadow-sm border",
                        m.role === "user" 
                          ? "bg-slate-900 text-white border-slate-800 rounded-br-sm" 
                          : "bg-white text-slate-800 border-slate-100 rounded-bl-sm"
                      )}>
                        {m.content}
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="flex gap-3 items-center text-indigo-600 font-bold text-sm bg-white border border-indigo-50 shadow-sm w-fit px-6 py-4 rounded-3xl"
                    >
                      <Loader2 className="animate-spin" size={18} />
                      Processing Strategy...
                    </motion.div>
                  )}
                  {error && (
                    <div className="p-6 bg-red-50 text-red-600 rounded-3xl text-center font-bold text-sm">
                      {error}
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100">
                  {flowStatus === "READY" ? (
                    <ShimmerButton
                      onClick={handleFinalRedirect}
                      background="linear-gradient(to right, #8B5CF6, #7C3AED)"
                      shimmerColor="rgba(255,255,255,0.5)"
                      className="w-full h-16 text-xl rounded-2xl"
                    >
                      Finalize Executive Report
                    </ShimmerButton>
                  ) : (
                    <div className="flex items-center gap-4 relative">
                      <textarea
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your response..."
                        disabled={loading}
                        className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 pr-20 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-100 outline-none resize-none h-16 text-lg shadow-sm"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={loading || !currentInput.trim()}
                        className="absolute right-2 top-2 bottom-2 w-12 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 transition-all shadow-md"
                      >
                        <ArrowRight size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Minimal Footer */}
        <AnimatePresence>
          {flowStatus === "IDLE" && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mt-16 mb-8 text-slate-400 text-xs font-semibold tracking-wide"
            >
              Secure AI Session • Professional Environment
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
