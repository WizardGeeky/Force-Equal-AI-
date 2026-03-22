"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const ReportDashboard = dynamic(() => import("./ReportDashboard"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#fdfdfd] flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-12">
        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
        <div className="absolute inset-0 bg-indigo-600/10 blur-2xl animate-pulse" />
      </div>
      <h2 className="text-4xl font-black tracking-tight mb-4 text-gray-900">Loading Dashboard...</h2>
      <p className="text-gray-400 font-medium max-w-sm mx-auto">Please wait while we initialize your workspace.</p>
    </div>
  ),
});

export default function ReportPage() {
  return <ReportDashboard />;
}
