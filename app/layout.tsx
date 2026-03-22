import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://force-equal-ai.vercel.app"),
  title: "PlanAI - Strategic AI Planning Agent",
  description: "Turn your ideas into professional execution plans with multi-agent AI. Developed by Eswar.",
  keywords: ["AI Planner", "Project Planning", "Execution Plan", "AI Agent", "Gemini AI", "Eswar"],
  authors: [{ name: "Eswar", url: "https://eswarb.vercel.app" }],
  openGraph: {
    title: "PlanAI - Strategic AI Planning Agent",
    description: "Turn your ideas into professional execution plans with multi-agent AI.",
    url: "https://force-equal-ai.vercel.app",
    siteName: "PlanAI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://force-equal-ai.vercel.app",
  },
  category: "technology",
  twitter: {
    card: "summary_large_image",
    title: "PlanAI - Strategic AI Planning Agent",
    description: "Turn your ideas into professional execution plans with multi-agent AI.",
    creator: "@eswar",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("light", "font-sans", geist.variable)}>
      <body className={`${inter.className} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "PlanAI",
              "operatingSystem": "All",
              "applicationCategory": "BusinessApplication",
              "description": "Turn your ideas into professional execution plans with multi-agent AI.",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Person",
                "name": "Eswar",
                "url": "https://eswarb.vercel.app"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "PlanAI",
              "url": "https://force-equal-ai.vercel.app",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://force-equal-ai.vercel.app/?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        {children}
      </body>
    </html>
  );
}
