"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import UploadZone from "@/components/UploadZone";

type Step = "name" | "upload";

export default function DashboardPage() {
  const { user }  = useAuth();
  const router    = useRouter();
  const [step,     setStep]     = useState<Step>("name");
  const [chatName, setChatName] = useState("");

  const handleComplete = (fileId: string, filename: string) => {
    // Create chat record
    const chatId = `chat_${Date.now()}`;
    const chat   = {
      id:         chatId,
      name:       chatName || filename.replace(/\.[^.]+$/, ""),
      file_id:    fileId,
      filename:   filename,
      created_at: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem("chats") || "[]");
    localStorage.setItem("chats", JSON.stringify([chat, ...existing]));
    window.dispatchEvent(new Event("chats-updated"));

    router.push(`/dashboard/chat/${chatId}?filename=${encodeURIComponent(filename)}`);
  };

  return (
    <div className="h-full flex flex-col">

      {/* Step: Name the chat */}
      {step === "name" && (
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md text-center">

            {/* Greeting */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              <Sparkles size={12} />
              Welcome, {user?.display_name?.split(" ")[0] || "there"}
            </div>

            <h1 className="font-display text-3xl font-semibold mb-2" style={{ color: "var(--text)" }}>
              Start a new chat
            </h1>
            <p className="text-sm mb-8" style={{ color: "var(--text-2)" }}>
              Give your chat a name, then upload your document
            </p>

            <div className="relative mb-4">
              <FileText size={15} className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-3)" }} />
              <input
                type="text"
                value={chatName}
                onChange={e => setChatName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && chatName.trim() && setStep("upload")}
                placeholder="e.g. Q3 Financial Report"
                autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "var(--bg-2)",
                  border:     "1px solid var(--border)",
                  color:      "var(--text)"
                }}
              />
            </div>

            <button
              onClick={() => setStep("upload")}
              disabled={!chatName.trim()}
              className="flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
              style={{ background: "var(--accent)", color: "#fff" }}>
              Continue <ArrowRight size={15} />
            </button>

            <p className="text-xs mt-4" style={{ color: "var(--text-3)" }}>
              You can rename it anytime from the sidebar
            </p>
          </motion.div>
        </div>
      )}

      {/* Step: Upload */}
      {step === "upload" && (
        <UploadZone chatName={chatName} onComplete={handleComplete} />
      )}
    </div>
  );
}
