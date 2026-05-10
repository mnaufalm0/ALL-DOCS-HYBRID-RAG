"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, FileText } from "lucide-react";
import { queryRAG } from "@/lib/api";
import ChatMessage from "./ChatMessage";
import type { Message } from "@/lib/types";

interface Props {
  chatId:   string;
  filename: string;
}

export default function ChatInterface({ chatId, filename }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  // Load messages from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`chat_messages_${chatId}`);
    if (saved) setMessages(JSON.parse(saved));
  }, [chatId]);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(messages));
    }
  }, [messages, chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");

    const userMsg: Message = {
      id:         Date.now().toString(),
      role:       "user",
      content:    q,
      created_at: new Date().toISOString(),
    };
    setMessages(p => [...p, userMsg]);
    setLoading(true);

    try {
      const res = await queryRAG(q);
      const aiMsg: Message = {
        id:         (Date.now() + 1).toString(),
        role:       "assistant",
        content:    res.answer,
        created_at: new Date().toISOString(),
        was_cached: res.source === "cache",
      };
      setMessages(p => [...p, aiMsg]);
    } catch {
      const errMsg: Message = {
        id:         (Date.now() + 1).toString(),
        role:       "assistant",
        content:    "Sorry, something went wrong. Please try again.",
        created_at: new Date().toISOString(),
      };
      setMessages(p => [...p, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "var(--accent-soft)" }}>
          <FileText size={14} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <p className="text-sm font-medium truncate max-w-[200px]" style={{ color: "var(--text)" }}>
            {filename}
          </p>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            {messages.length} messages
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--accent-soft)" }}>
              <FileText size={22} style={{ color: "var(--accent)" }} />
            </div>
            <p className="font-display text-lg font-semibold" style={{ color: "var(--text)" }}>
              Ready to answer
            </p>
            <p className="text-sm max-w-xs" style={{ color: "var(--text-2)" }}>
              Ask anything about <strong>{filename}</strong>
            </p>
            <div className="flex flex-col gap-2 mt-2 w-full max-w-xs">
              {["What is this document about?", "Summarize the key points", "What are the main findings?"].map(q => (
                <button key={q} onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="px-4 py-2.5 rounded-xl text-xs text-left transition-all"
                  style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map(msg => <ChatMessage key={msg.id} msg={msg} />)}
        </AnimatePresence>

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "var(--bg-3)" }}>
              <Loader2 size={14} className="animate-spin" style={{ color: "var(--text-2)" }} />
            </div>
            <div className="px-4 py-3 rounded-2xl" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
              <div className="flex gap-1 items-center h-5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: "var(--text-3)", animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex gap-2 items-end rounded-2xl px-4 py-3"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about your document..."
            className="flex-1 bg-transparent outline-none resize-none text-sm leading-relaxed"
            style={{ color: "var(--text)", maxHeight: "120px" }}
          />
          <button onClick={send} disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
            style={{ background: "var(--accent)", color: "#fff" }}>
            <Send size={14} />
          </button>
        </div>
        <p className="text-xs text-center mt-2" style={{ color: "var(--text-3)" }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
