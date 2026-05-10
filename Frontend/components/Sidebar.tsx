"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, ChevronLeft, Trash2,
  FileText, Settings, LogOut, Edit2, Check, X
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { logout, deleteFile } from "@/lib/api";
import DeleteModal from "./DeleteModal";
import ThemeToggle from "./ThemeToggle";

interface Chat {
  id:        string;
  name:      string;
  file_id:   string;
  filename:  string;
  created_at: string;
}

interface Props {
  open:    boolean;
  onToggle: () => void;
}

export default function Sidebar({ open, onToggle }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuth();

  const [chats,      setChats]      = useState<Chat[]>([]);
  const [search,     setSearch]     = useState("");
  const [deleteChat, setDeleteChat] = useState<Chat | null>(null);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [editName,   setEditName]   = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("chats");
    if (saved) setChats(JSON.parse(saved));

    // Listen for new chats
    const handler = () => {
      const s = localStorage.getItem("chats");
      if (s) setChats(JSON.parse(s));
    };
    window.addEventListener("chats-updated", handler);
    return () => window.removeEventListener("chats-updated", handler);
  }, []);

  const filtered = chats.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.filename.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteChat) return;
    try {
      await deleteFile(deleteChat.file_id);
    } catch {}
    // Remove from localStorage
    const updated = chats.filter(c => c.id !== deleteChat.id);
    setChats(updated);
    localStorage.setItem("chats", JSON.stringify(updated));
    localStorage.removeItem(`chat_messages_${deleteChat.id}`);
    window.dispatchEvent(new Event("chats-updated"));
    setDeleteChat(null);
    if (pathname.includes(deleteChat.id)) router.push("/dashboard");
  };

  const saveRename = (id: string) => {
    const updated = chats.map(c => c.id === id ? { ...c, name: editName } : c);
    setChats(updated);
    localStorage.setItem("chats", JSON.stringify(updated));
    setEditId(null);
  };

  const handleLogout = async () => {
    try { await logout(); } catch {}
    clearAuth();
    router.push("/auth/login");
  };

  return (
    <>
      {/* Overlay on mobile */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 lg:hidden"
            style={{ background: "rgba(0,0,0,0.3)" }}
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 bottom-0 z-30 flex flex-col"
        style={{
          width: "280px",
          background: "var(--bg-2)",
          borderRight: "1px solid var(--border)"
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <Link href="/dashboard"
            className="font-display text-lg font-semibold" style={{ color: "var(--text)" }}>
            All<span style={{ color: "var(--accent)" }}>Docs</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={onToggle}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "var(--bg-3)", color: "var(--text-2)" }}>
              <ChevronLeft size={15} />
            </button>
          </div>
        </div>

        {/* New Chat */}
        <div className="px-3 py-3">
          <Link href="/dashboard"
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: "var(--accent)", color: "#fff" }}>
            <Plus size={16} />
            New Chat
          </Link>
        </div>

        {/* Search */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "var(--bg-3)", border: "1px solid var(--border)" }}>
            <Search size={13} style={{ color: "var(--text-3)" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search chats..."
              className="flex-1 bg-transparent outline-none text-xs"
              style={{ color: "var(--text)" }}
            />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-3">
          {filtered.length === 0 && (
            <p className="text-xs text-center py-8" style={{ color: "var(--text-3)" }}>
              {search ? "No chats found" : "No chats yet"}
            </p>
          )}

          {filtered.map(chat => {
            const isActive = pathname.includes(chat.id);
            const isEditing = editId === chat.id;

            return (
              <div key={chat.id}
                className="group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                style={{
                  background: isActive ? "var(--accent-soft)" : "transparent",
                  border:     isActive ? "1px solid var(--accent-2)30" : "1px solid transparent"
                }}
                onClick={() => !isEditing && router.push(`/dashboard/chat/${chat.id}`)}>

                <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: isActive ? "var(--accent-soft)" : "var(--bg-3)" }}>
                  <FileText size={11} style={{ color: isActive ? "var(--accent)" : "var(--text-3)" }} />
                </div>

                {isEditing ? (
                  <input
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") saveRename(chat.id); if (e.key === "Escape") setEditId(null); }}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 bg-transparent outline-none text-xs font-medium"
                    style={{ color: "var(--text)" }}
                  />
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: isActive ? "var(--accent)" : "var(--text)" }}>
                      {chat.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>
                      {chat.filename}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {isEditing ? (
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => saveRename(chat.id)}
                      className="w-5 h-5 flex items-center justify-center rounded"
                      style={{ color: "var(--accent)" }}>
                      <Check size={11} />
                    </button>
                    <button onClick={() => setEditId(null)}
                      className="w-5 h-5 flex items-center justify-center rounded"
                      style={{ color: "var(--text-3)" }}>
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <div className="hidden group-hover:flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setEditId(chat.id); setEditName(chat.name); }}
                      className="w-5 h-5 flex items-center justify-center rounded opacity-60 hover:opacity-100"
                      style={{ color: "var(--text-2)" }}>
                      <Edit2 size={11} />
                    </button>
                    <button onClick={() => setDeleteChat(chat)}
                      className="w-5 h-5 flex items-center justify-center rounded opacity-60 hover:opacity-100"
                      style={{ color: "#EF4444" }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* User footer */}
        <div className="px-3 py-4 space-y-1" style={{ borderTop: "1px solid var(--border)" }}>
          <Link href="/settings"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
            style={{ color: "var(--text-2)" }}>
            <Settings size={14} />
            Settings
          </Link>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm w-full transition-all"
            style={{ color: "var(--text-2)" }}>
            <LogOut size={14} />
            Sign out
          </button>

          {/* User info */}
          <div className="flex items-center gap-2 px-3 py-2 mt-1">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
              style={{ background: "var(--accent)", color: "#fff" }}>
              {user?.display_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>
                {user?.display_name || "User"}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </motion.aside>

      <DeleteModal
        open={!!deleteChat}
        chatName={deleteChat?.name || ""}
        onClose={() => setDeleteChat(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
