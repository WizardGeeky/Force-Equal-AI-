"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Edit3, Copy, Check, Loader2, AlertCircle, Users, Lightbulb, PlayCircle, Sparkles, Menu, X, Layout, FileDown, ArrowLeft,
  Clock, DollarSign, Server, Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Meteors } from "@/components/ui/meteors";
import { ShimmerButton } from "@/components/magicui/shimmer-button";

interface Section {
  id: string;
  title: string;
  content: string;
  icon: any;
  color: string;
}

const jsonToMarkdown = (data: any, depth = 0): string => {
  if (data === null || data === undefined) return '';
  if (typeof data === 'string') return data;
  if (typeof data === 'number' || typeof data === 'boolean') return String(data);
  
  const indent = '  '.repeat(depth);
  
  if (Array.isArray(data)) {
    return data.map(item => {
      if (typeof item !== 'object' || item === null) return `${indent}- ${item}`;
      return jsonToMarkdown(item, depth);
    }).join('\n');
  }
  
  if (typeof data === 'object') {
    return Object.entries(data).map(([key, value]) => {
      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      if (typeof value !== 'object' || value === null) {
        return `${indent}- **${formattedKey}:** ${value}`;
      }
      return `${indent}- **${formattedKey}:**\n${jsonToMarkdown(value, depth + 1)}`;
    }).join('\n');
  }
  return '';
};

const FormattedText = ({ text }: { text: any }) => {
  if (!text) return null;
  
  let stringText = typeof text === 'string' ? text : jsonToMarkdown(text);

  const lines = stringText.split('\n');
  
  return (
    <>
      {lines.map((line: string, lineIdx: number) => {
        const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
        const cleanLine = isBullet ? line.trim().slice(2) : line;
        const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
        
        const content = (
          <span key={lineIdx}>
            {parts.map((part: string, i: number) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-black dark:text-white">{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </span>
        );

        if (isBullet) {
          return (
            <div key={lineIdx} className="flex gap-4 mb-3 ml-2 md:ml-6 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2.5 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
              <div className="flex-1 text-zinc-700 dark:text-zinc-300">{content}</div>
            </div>
          );
        }

        return (
          <p key={lineIdx} className={cn(line.trim() === "" ? "h-4" : "mb-5 text-zinc-700 dark:text-zinc-300")}>
            {content}
          </p>
        );
      })}
    </>
  );
};

export default function ReportPage() {
  const router = useRouter();
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [activeSection, setActiveSection] = useState("problemBreakdown");
  const [isEditing, setIsEditing] = useState(false);
  const [editInstruction, setEditInstruction] = useState("");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [copying, setCopying] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedProblem = sessionStorage.getItem("ai_planner_problem");
    const cachedReport = localStorage.getItem("ai_planner_current_report");
    const cachedProblem = localStorage.getItem("ai_planner_current_problem");
    
    if (storedProblem && cachedProblem === storedProblem && cachedReport) {
      setReport(JSON.parse(cachedReport));
      setProblem(storedProblem);
      setLoading(false);
    } 
    else if (storedProblem) {
      const chatHistory = sessionStorage.getItem("ai_planner_chat_history");
      const enrichedProblem = chatHistory 
        ? `CONTEXTUAL CONVERSATION:\n${chatHistory}\n\nFINAL PROJECT TO PLAN: ${storedProblem}` 
        : storedProblem;
      
      setProblem(storedProblem);
      generateReport(enrichedProblem); 
    } 
    else if (cachedReport && cachedProblem) {
      setReport(JSON.parse(cachedReport));
      setProblem(cachedProblem);
      setLoading(false);
    } else {
      router.push("/");
    }
  }, []);

  useEffect(() => {
    if (report && problem) {
      localStorage.setItem("ai_planner_current_report", JSON.stringify(report));
      localStorage.setItem("ai_planner_current_problem", problem);
    }
  }, [report, problem]);

  const generateReport = async (p: string, answers?: any) => {
    setLoading(true);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem: p, answers }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReport(data);
      sessionStorage.removeItem("ai_planner_problem");
    } catch (error: any) {
      setReport({ error: error.message || "Failed to generate plan" });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editInstruction || !editingField || !report) return;
    setEditLoading(true);
    try {
      const res = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: editingField,
          content: report[editingField],
          instruction: editInstruction,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setReport({
        ...report,
        [editingField]: data.revisedContent,
      });
      setIsEditing(false);
      setEditInstruction("");
    } catch (error) {
      console.error(error);
    } finally {
      setEditLoading(false);
    }
  };

  const downloadDocx = async () => {
    setExporting("docx");
    try {
      const res = await fetch("/api/export/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Project Plan: ${problem}`,
          sections: [
            { title: "Problem Breakdown", content: report.problemBreakdown },
            { title: "Stakeholders", content: report.stakeholders },
            { title: "Solution Approach", content: report.solutionApproach },
            { title: "Action Plan", content: report.actionPlan },
            { title: "Estimated Timeline", content: report.estimatedTimeline },
            { title: "Budget Estimate", content: report.budgetEstimate },
            { title: "Infrastructure", content: report.infrastructureRequirements },
            { title: "Production Roadmap", content: report.endToEndPlan },
          ]
        }),
      });
      
      const blob = await res.blob();
      // @ts-ignore
      const fileSaver = (await import("file-saver")).default || await import("file-saver");
      fileSaver.saveAs(blob, "execution-plan.docx");
    } catch (error) {
      console.error(error);
    } finally {
      setExporting(null);
    }
  };

  const downloadPdf = async () => {
    const element = reportRef.current;
    if (!element) return;
    setExporting("pdf");
    
    // We use html-to-image because html2canvas crashes on Tailwind v4 lab() colors.
    // However, to prevent a 50MB file, we use toJpeg at 1x scale.
    setTimeout(async () => {
      try {
        const { toJpeg } = await import("html-to-image");
        const jsPDF = (await import("jspdf")).default;

        const dataUrl = await toJpeg(element, {
          quality: 0.8,
          pixelRatio: 1,
          backgroundColor: "#ffffff",
          style: {
            background: "#ffffff",
            color: "#000000",
            boxShadow: "none",
            filter: "none",
            transform: "scale(1)",
          }
        });

        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgProps = pdf.getImageProperties(dataUrl);
        const contentHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        let heightLeft = contentHeight;
        let position = 0;

        pdf.addImage(dataUrl, "JPEG", 0, position, pdfWidth, contentHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - contentHeight;
          pdf.addPage();
          pdf.addImage(dataUrl, "JPEG", 0, position, pdfWidth, contentHeight, undefined, 'FAST');
          heightLeft -= pdfHeight;
        }

        // Extremely low file size prevents Chrome from crashing and dropping the filename
        pdf.save("execution-plan.pdf");
      } catch (error) {
        console.error("PDF generation failed:", error);
        alert("PDF generation failed. The report might be too complex for this hardware.");
      } finally {
        setExporting(null);
      }
    }, 150);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col items-center justify-center p-8 overflow-hidden relative">
        <Meteors number={20} />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse delay-700" />

        <div className="relative z-10 flex flex-col items-center max-w-xl w-full">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-8 animate-bounce">
            <Layout className="text-white" size={28} />
          </div>
          <h1 className="text-3xl tracking-tight font-black text-black dark:text-white mb-4">
            Generating Executive Plan
          </h1>
          <p className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-2 text-lg">
            <Loader2 className="animate-spin" size={20} /> Swarm Agents Synchronizing...
          </p>
          <div className="w-full max-w-xs h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-10 overflow-hidden relative">
            <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 15, ease: "linear" }} className="h-full bg-indigo-500" />
          </div>
        </div>
      </div>
    );
  }

  if (!report || report.error) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl w-full bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl p-10 md:p-14 border border-zinc-200 dark:border-zinc-800">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-8 border border-red-200 dark:border-red-900">
             <AlertCircle className="text-red-500" size={32} />
          </div>
          <h2 className="text-2xl font-black text-black dark:text-white mb-6 tracking-tight">System Interruption</h2>
          <p className="text-zinc-600 dark:text-zinc-400 font-medium leading-[1.8] text-sm relative z-10 whitespace-pre-wrap mb-10">
            {report?.error || "We couldn't generate your plan. Please check your connection or try again later."}
          </p>
          <Link href="/" className="w-full h-14 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm flex items-center justify-center hover:scale-[1.02] transition-transform">
            Return Home
          </Link>
        </motion.div>
      </div>
    );
  }

  const sections: Section[] = [
    { id: "problemBreakdown", title: "Problem Breakdown", content: report.problemBreakdown, icon: Layout, color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400" },
    { id: "stakeholders", title: "Stakeholders", content: report.stakeholders, icon: Users, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400" },
    { id: "solutionApproach", title: "Solution Approach", content: report.solutionApproach, icon: Lightbulb, color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400" },
    { id: "actionPlan", title: "Action Plan", content: report.actionPlan, icon: PlayCircle, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" },
    { id: "estimatedTimeline", title: "Estimated Timeline", content: report.estimatedTimeline, icon: Clock, color: "text-rose-500 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400" },
    { id: "budgetEstimate", title: "Budget Estimate", content: report.budgetEstimate, icon: DollarSign, color: "text-green-500 bg-green-50 dark:bg-green-500/10 dark:text-green-400" },
    { id: "infrastructureRequirements", title: "Infrastructure", content: report.infrastructureRequirements, icon: Server, color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 dark:text-cyan-400" },
    { id: "endToEndPlan", title: "Production Roadmap", content: report.endToEndPlan, icon: Globe, color: "text-violet-500 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400" },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center font-bold text-white dark:text-black shadow-lg">
              <Sparkles size={16} />
            </div>
            <span className="font-extrabold text-xl tracking-tighter text-black dark:text-white">PlanAI<span className="text-indigo-500">.</span></span>
          </div>
        </div>
        <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500">
          <X size={20} />
        </button>
      </div>

      <nav className="flex flex-col gap-2 relative z-10">
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-3 mb-2">Navigation</p>
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              if (editLoading) return;
              setActiveSection(s.id);
              setIsMobileMenuOpen(false);
              const element = document.getElementById(s.id);
              if (element) {
                // Scroll specifically within the main container
                const mainContainer = document.querySelector('main');
                if (mainContainer) {
                  const yOffset = -100; // Account for any fixed headers
                  const y = element.getBoundingClientRect().top + mainContainer.scrollTop + yOffset;
                  mainContainer.scrollTo({ top: y, behavior: 'smooth' });
                } else {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }
            }}
            disabled={editLoading}
            className={cn(
              "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-sm font-extrabold group w-full text-left relative overflow-hidden",
              editLoading && "opacity-50 cursor-not-allowed",
              activeSection === s.id 
                ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xl shadow-black/10 dark:shadow-white/10 border border-black/5 dark:border-white/5" 
                : "text-zinc-500 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-900 border border-transparent hover:border-black/5 dark:hover:border-white/5 dark:text-zinc-400 dark:hover:text-white hover:shadow-sm"
            )}
          >
            {activeSection === s.id && <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent dark:from-black/10 pointer-events-none" />}
            <div className={cn("p-2 rounded-xl transition-colors border border-transparent relative z-10", activeSection === s.id ? "bg-white/20 dark:bg-black/10 border-white/10 dark:border-black/10 shadow-inner" : "bg-zinc-100 group-hover:bg-zinc-50 dark:bg-zinc-800/50 dark:group-hover:bg-zinc-800")}>
              <s.icon size={16} className={activeSection === s.id ? "" : s.color.split(' ')[0]} />
            </div>
            {s.title}
            {activeSection === s.id && (
              <motion.div layoutId="active-bar" className="ml-auto w-1.5 h-1.5 bg-indigo-500 rounded-full" />
            )}
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-3 pt-8 border-t border-zinc-200 dark:border-zinc-800 relative z-10">
        <ShimmerButton 
          onClick={downloadDocx}
          background="#09090b"
          shimmerColor="rgba(255,255,255,0.2)"
          className="w-full text-sm font-bold py-3.5 h-[52px] group"
        >
          <div className="flex items-center gap-3 w-full justify-center">
            <FileDown size={18} className="group-hover:-translate-y-0.5 transition-transform" />
            <span>Export DOCX</span>
          </div>
          {exporting === 'docx' && <Loader2 size={14} className="animate-spin ml-2" />}
        </ShimmerButton>

        <button 
           onClick={downloadPdf}
           disabled={!!exporting}
          className="w-full h-[52px] flex items-center justify-center gap-3 px-4 py-3.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-sm font-bold shadow-sm group text-black dark:text-white"
        >
          <FileText size={18} className="group-hover:-translate-y-0.5 transition-transform" />
          <span>Export PDF</span>
          {exporting === 'pdf' && <Loader2 size={14} className="animate-spin text-indigo-500" />}
        </button>

        <Link href="/" className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-sm font-bold text-zinc-500 mt-2">
          <ArrowLeft size={16} />
          <span>New Problem</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] text-zinc-900 dark:text-zinc-100 flex flex-col lg:flex-row relative selection:bg-indigo-500/30 selection:text-indigo-900 overflow-hidden font-sans">
      
      {/* Premium Ambient Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] bg-purple-500/10 dark:bg-purple-500/5 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
      </div>

      {/* Mobile Header */}
      <header className="lg:hidden print:hidden flex items-center justify-between px-6 py-4 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-b border-black/5 dark:border-white/5 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zinc-950 dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-zinc-950 font-bold shadow-md">
            <Sparkles size={14} />
          </div>
          <span className="font-black text-xl tracking-tight text-zinc-900 dark:text-white">PlanAI<span className="text-indigo-500">.</span></span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(prev => !prev)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
          <Menu size={20} className="text-zinc-600 dark:text-zinc-300" />
        </button>
      </header>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex print:hidden w-[340px] bg-white/60 dark:bg-zinc-950/60 backdrop-blur-3xl border-r border-black/5 dark:border-white/5 p-8 flex-col sticky top-0 h-screen z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[320px] bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl z-[60] lg:hidden p-8 shadow-2xl flex flex-col border-r border-black/5 dark:border-white/5"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto p-4 md:p-8 lg:p-12 relative flex flex-col items-center print:h-auto print:overflow-visible print:block print:p-0">
        <div className="max-w-[900px] w-full space-y-8 relative z-10 pb-24 print:max-w-none print:w-full print:pb-0 print:space-y-0">
          
          <div 
            ref={reportRef} 
            className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl rounded-[32px] md:rounded-[48px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-black/5 dark:border-white/5 p-8 md:p-14 lg:p-20 flex flex-col gap-20 relative overflow-visible ring-1 ring-black/5 dark:ring-white/5 print:bg-transparent print:border-none print:shadow-none print:ring-0 print:p-0 print:block"
          >
            {/* Top Badge/Header */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-indigo-50/80 dark:bg-indigo-500/10 border border-indigo-100/50 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-[0.15em] backdrop-blur-md shadow-sm">
                <Sparkles size={14} className="animate-pulse" />
                Strategic Execution Plan
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-black text-zinc-950 dark:text-white leading-[1.1] tracking-tight">
                {problem}
              </h2>
              <div className="h-[2px] bg-gradient-to-r from-zinc-200 via-zinc-100 to-transparent dark:from-zinc-800 dark:via-zinc-800/50 w-full rounded-full" />
            </div>

            {/* Sections */}
            <div className="space-y-24">
              {sections.map((s, idx) => (
                <motion.section 
                  initial={exporting === 'pdf' ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
                  key={s.id} id={s.id}
                  className={cn(
                    "relative group transition-all duration-700",
                    activeSection !== s.id && exporting !== 'pdf' && "opacity-40 blur-[1px] grayscale-[0.5] hover:opacity-100 hover:blur-0 hover:grayscale-0"
                  )}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-black/5 dark:border-white/5 pb-8 print:border-b-2 print:border-black/10">
                    <div className="flex items-center gap-5">
                      <div className={cn("w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:shadow-2xl group-hover:-rotate-3 print:shadow-none", s.color)}>
                        <s.icon size={28} className="drop-shadow-sm print:drop-shadow-none" />
                       </div>
                      <h3 className="text-3xl md:text-4xl font-extrabold text-zinc-950 dark:text-white tracking-tight print:text-black">{s.title}</h3>
                    </div>
                    
                    <div className="flex items-center gap-3 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 md:translate-y-2 md:group-hover:translate-y-0 print:hidden">
                      <button 
                        onClick={() => {
                          const val = typeof s.content === 'string' ? s.content : JSON.stringify(s.content);
                          navigator.clipboard.writeText(val);
                          setCopying(s.id);
                          setTimeout(() => setCopying(null), 2000);
                        }}
                        className="p-3.5 rounded-full bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/5 text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                      >
                        {copying === s.id ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                      </button>
                      <button 
                        onClick={() => {
                          setEditingField(s.id);
                          setIsEditing(true);
                        }}
                        className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-extrabold hover:scale-105 transition-all shadow-xl hover:shadow-2xl w-36 justify-center"
                      >
                        {editLoading && editingField === s.id ? <Loader2 size={16} className="animate-spin" /> : <><Edit3 size={16} /> Edit with AI</>}
                      </button>
                    </div>
                  </div>

                  <div className="prose max-w-none text-zinc-700 dark:text-zinc-300 mt-8">
                    <div className="text-[17px] md:text-[18px] leading-[1.85] tracking-[-0.01em]">
                      <FormattedText text={s.content} />
                    </div>
                  </div>
                </motion.section>
              ))}
            </div>

            <footer className="mt-20 pt-10 border-t border-zinc-200 dark:border-zinc-800 text-center text-zinc-400 text-[10px] font-black tracking-[0.2em] uppercase">
              PlanAI Enterprise Protocol • Confidential Output • 2026
            </footer>
          </div>
        </div>

        {/* Edit Modal */}
        <AnimatePresence>
          {isEditing && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditing(false)} className="absolute inset-0 bg-zinc-950/80 backdrop-blur-2xl" />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-xl bg-white/90 dark:bg-[#0A0A0A]/90 backdrop-blur-3xl border border-black/5 dark:border-white/5 rounded-[40px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
              >
                <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
                <div className="p-10 pb-6 relative z-10">
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                          <Sparkles size={24} className="drop-shadow-sm" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight">AI Master Editor</h3>
                          <p className="text-[11px] text-zinc-500 font-extrabold uppercase tracking-[0.2em] mt-1.5">Editing: {sections.find(s => s.id === editingField)?.title}</p>
                        </div>
                     </div>
                     <button onClick={() => setIsEditing(false)} className="p-2.5 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-full text-zinc-500 hover:text-zinc-900 hover:shadow-md dark:hover:text-white transition-all">
                       <X size={20} />
                     </button>
                  </div>
                  
                  <textarea
                    value={editInstruction}
                    onChange={(e) => setEditInstruction(e.target.value)}
                    placeholder="Tell the agent swarm how to improve this section... e.g., 'Make the tone more aggressive and concise'"
                    className="w-full h-36 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md border border-black/5 dark:border-white/5 rounded-[24px] focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 p-6 text-zinc-900 dark:text-white font-medium text-lg resize-none transition-all shadow-inner placeholder:text-zinc-400"
                  />

                  <div className="flex flex-wrap gap-2 mt-6">
                    {["Make concise", "Expand technical details", "Change to formal tone", "Add 3 bullet points"].map(chip => (
                      <button 
                        key={chip}
                        onClick={() => setEditInstruction(prev => prev ? prev + ', ' + chip : chip)}
                        className="px-4 py-2 rounded-full bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-950 hover:text-white dark:hover:bg-white dark:hover:text-zinc-950 hover:shadow-md transition-all drop-shadow-sm"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-8 pt-6 flex gap-4 relative z-10 bg-black/5 dark:bg-white/5 border-t border-black/5 dark:border-white/5 backdrop-blur-xl">
                  <button onClick={() => setIsEditing(false)} className="flex-1 h-14 rounded-2xl font-extrabold bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:shadow-md transition-all shadow-sm">
                    Cancel
                  </button>
                  <ShimmerButton 
                    onClick={handleEdit}
                    disabled={editLoading || !editInstruction}
                    background="#4f46e5"
                    shimmerColor="rgba(255,255,255,0.4)"
                    className="flex-2 h-14 rounded-2xl font-bold text-white shadow-xl shadow-indigo-600/30 disabled:opacity-50 text-sm w-48"
                  >
                    {editLoading ? <Loader2 className="animate-spin" size={20} /> : "Update with AI"}
                  </ShimmerButton>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
