"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Zap, Shield, Layers } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const features = [
  { icon: FileText, title: "Any Document",  desc: "PDF, DOCX, PPTX, CSV, XLSX, TXT and more — all in one place." },
  { icon: Zap,      title: "Instant Intel", desc: "Hybrid search + AI reranking delivers precise answers in seconds." },
  { icon: Shield,   title: "Your Data",     desc: "Documents are yours. Isolated per user, never shared." },
  { icon: Layers,   title: "Smart Memory",  desc: "Chat history, query cache, and context — all preserved." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-2">
          <span className="font-display text-xl font-semibold" style={{ color: "var(--text)" }}>
            All<span style={{ color: "var(--accent)" }}>Docs</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/auth/login"
            className="text-sm font-medium px-4 py-2 rounded-lg transition-all"
            style={{ color: "var(--text-2)" }}>
            Sign in
          </Link>
          <Link href="/auth/signup"
            className="text-sm font-medium px-4 py-2 rounded-lg transition-all"
            style={{ background: "var(--accent)", color: "#fff" }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-8"
          style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent-2)20" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
          Powered by NeuroBuzz AI
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-5xl md:text-7xl lg:text-8xl font-semibold leading-[1.05] mb-6 text-balance"
          style={{ color: "var(--text)" }}>
          Every document,
          <br />
          <em className="italic" style={{ color: "var(--accent)" }}>answered.</em>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed"
          style={{ color: "var(--text-2)" }}>
          Upload any document. Ask anything. AllDocs uses hybrid AI retrieval
          to find the most relevant answers from your files — instantly.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 items-center">
          <Link href="/auth/signup"
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: "var(--accent)", color: "#fff" }}>
            Start for free <ArrowRight size={16} />
          </Link>
          <Link href="/auth/login"
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all"
            style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}>
            Sign in
          </Link>
        </motion.div>

        {/* Abstract visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative mt-20 w-full max-w-3xl mx-auto rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}>
          <div className="p-8 md:p-12">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--accent-soft)" }}>
                <FileText size={16} style={{ color: "var(--accent)" }} />
              </div>
              <div className="flex-1">
                <div className="h-3 w-32 rounded-full mb-2" style={{ background: "var(--bg-3)" }} />
                <div className="h-2 w-48 rounded-full" style={{ background: "var(--bg-3)" }} />
              </div>
            </div>
            <div className="space-y-2 mb-6">
              {[100, 85, 92, 70].map((w, i) => (
                <div key={i} className="h-2 rounded-full" style={{ background: "var(--bg-3)", width: `${w}%` }} />
              ))}
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-2)30" }}>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--accent)" }}>You asked:</p>
              <p className="text-sm" style={{ color: "var(--text)" }}>
                "What are the key findings in the Q3 report?"
              </p>
            </div>
            <div className="mt-4 rounded-xl p-4" style={{ background: "var(--bg-3)" }}>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text-2)" }}>AllDocs:</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
                Based on the Q3 report, revenue increased 24% YoY driven by enterprise segment growth...
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 md:px-12 pb-20">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
              className="p-6 rounded-2xl"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                style={{ background: "var(--accent-soft)" }}>
                <f.icon size={18} style={{ color: "var(--accent)" }} />
              </div>
              <h3 className="font-display font-semibold mb-1" style={{ color: "var(--text)" }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-6 flex items-center justify-between"
        style={{ borderTop: "1px solid var(--border)" }}>
        <span className="text-xs" style={{ color: "var(--text-3)" }}>
          © 2025 AllDocs · Powered by <span style={{ color: "var(--accent)" }}>NeuroBuzz</span>
        </span>
        <span className="text-xs" style={{ color: "var(--text-3)" }}>
          Built for intelligence.
        </span>
      </footer>
    </div>
  );
}
