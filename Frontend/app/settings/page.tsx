"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ChevronLeft, Plus, Trash2, Check,
  Shield, FileText, User, Loader2
} from "lucide-react";
import {
  listPrompts, createPrompt,
  activatePrompt, deletePrompt,
  requestPasswordReset
} from "@/lib/api";
import type { SystemPrompt } from "@/lib/types";
import Link from "next/link";

type Tab = "prompts" | "account" | "security";

export default function SettingsPage() {
  const { user, clearAuth } = useAuth();
  const router  = useRouter();
  const [tab,      setTab]      = useState<Tab>("prompts");
  const [prompts,  setPrompts]  = useState<SystemPrompt[]>([]);
  const [newName,  setNewName]  = useState("");
  const [newPrompt,setNewPrompt]= useState("");
  const [adding,   setAdding]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [resetSent,setResetSent]= useState(false);
  const [msg,      setMsg]      = useState("");

  useEffect(() => {
    listPrompts().then(r => setPrompts(r.prompts)).catch(() => {});
  }, []);

  const handleAdd = async () => {
    if (!newName.trim() || !newPrompt.trim()) return;
    setLoading(true);
    try {
      await createPrompt(newName, newPrompt);
      const r = await listPrompts();
      setPrompts(r.prompts);
      setNewName(""); setNewPrompt(""); setAdding(false);
    } finally { setLoading(false); }
  };

  const handleActivate = async (id: string) => {
    await activatePrompt(id);
    setPrompts(p => p.map(pr => ({ ...pr, is_active: pr.id === id })));
  };

  const handleDelete = async (id: string) => {
    await deletePrompt(id);
    setPrompts(p => p.filter(pr => pr.id !== id));
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      await requestPasswordReset(user.email);
      setResetSent(true);
      setMsg("Password reset link sent to your email.");
    } catch { setMsg("Failed to send reset email."); }
    finally { setLoading(false); }
  };

  const TABS = [
    { id: "prompts",  label: "System Prompts", icon: FileText },
    { id: "account",  label: "Account",        icon: User     },
    { id: "security", label: "Security",        icon: Shield   },
  ] as const;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard"
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
            <ChevronLeft size={16} />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-semibold" style={{ color: "var(--text)" }}>
              Settings
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
              Manage your account and preferences
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-6"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: tab === t.id ? "var(--bg)"   : "transparent",
                color:      tab === t.id ? "var(--text)"  : "var(--text-3)",
                boxShadow:  tab === t.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
              }}>
              <t.icon size={13} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Prompts Tab ── */}
        {tab === "prompts" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-sm" style={{ color: "var(--text)" }}>System Prompts</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                  Customize how AllDocs answers your questions
                </p>
              </div>
              <button onClick={() => setAdding(p => !p)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "var(--accent)", color: "#fff" }}>
                <Plus size={12} /> New
              </button>
            </div>

            {/* Add form */}
            {adding && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 rounded-xl space-y-3"
                style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                <input value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="Prompt name"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text)" }} />
                <textarea value={newPrompt} onChange={e => setNewPrompt(e.target.value)}
                  placeholder="You are a helpful assistant. Answer only from the context provided..."
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none font-mono"
                  style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text)" }} />
                <p className="text-xs" style={{ color: "var(--text-3)" }}>
                  Include <code className="font-mono px-1" style={{ background: "var(--bg-3)" }}>{"{context}"}</code> where you want retrieved content injected.
                </p>
                <div className="flex gap-2">
                  <button onClick={handleAdd} disabled={loading}
                    className="px-4 py-1.5 rounded-lg text-xs font-medium disabled:opacity-60"
                    style={{ background: "var(--accent)", color: "#fff" }}>
                    {loading ? "Saving..." : "Save prompt"}
                  </button>
                  <button onClick={() => setAdding(false)}
                    className="px-4 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: "var(--bg-3)", color: "var(--text-2)" }}>
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            {/* Prompt list */}
            <div className="space-y-3">
              {prompts.length === 0 && (
                <p className="text-sm text-center py-8" style={{ color: "var(--text-3)" }}>
                  No prompts yet — create one to customize AllDocs
                </p>
              )}
              {prompts.map(p => (
                <div key={p.id} className="p-4 rounded-xl"
                  style={{
                    background: p.is_active ? "var(--accent-soft)" : "var(--bg-2)",
                    border:     p.is_active ? "1px solid var(--accent-2)40" : "1px solid var(--border)"
                  }}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{p.name}</p>
                      {p.is_active && (
                        <span className="text-xs" style={{ color: "var(--accent)" }}>● Active</span>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {!p.is_active && (
                        <button onClick={() => handleActivate(p.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                          <Check size={11} /> Activate
                        </button>
                      )}
                      <button onClick={() => handleDelete(p.id)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg"
                        style={{ color: "#EF4444", background: "#FEE2E220" }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs font-mono line-clamp-2" style={{ color: "var(--text-2)" }}>
                    {p.prompt}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Account Tab ── */}
        {tab === "account" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-4">
            <div className="p-4 rounded-xl"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold"
                  style={{ background: "var(--accent)", color: "#fff" }}>
                  {user?.display_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                    {user?.display_name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>{user?.email}</p>
                </div>
              </div>
              <div className="text-xs px-3 py-2 rounded-lg"
                style={{ background: "var(--bg-3)", color: "var(--text-2)" }}>
                Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
              </div>
            </div>

            <div className="p-4 rounded-xl"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
              <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
                Delete account
              </h3>
              <p className="text-xs mb-3" style={{ color: "var(--text-2)" }}>
                Permanently delete your account, all chats, files, and data.
              </p>
              <button className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "#FEE2E2", color: "#DC2626" }}>
                Delete my account
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Security Tab ── */}
        {tab === "security" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-4">
            <div className="p-4 rounded-xl"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
              <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
                Change password
              </h3>
              <p className="text-xs mb-3" style={{ color: "var(--text-2)" }}>
                We'll send a reset link to <strong>{user?.email}</strong>
              </p>
              {msg && (
                <p className="text-xs mb-3 px-3 py-2 rounded-lg"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  {msg}
                </p>
              )}
              <button onClick={handleResetPassword} disabled={loading || resetSent}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-60"
                style={{ background: "var(--accent)", color: "#fff" }}>
                {loading && <Loader2 size={11} className="animate-spin" />}
                {resetSent ? "Email sent" : "Send reset email"}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
