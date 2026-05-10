"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X } from "lucide-react";

interface Props {
  open:     boolean;
  chatName: string;
  onClose:  () => void;
  onConfirm: () => void;
}

export default function DeleteModal({ open, chatName, onClose, onConfirm }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={onClose}>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>

            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "#FEE2E2" }}>
                <Trash2 size={18} color="#DC2626" />
              </div>
              <button onClick={onClose} className="p-1 rounded-lg"
                style={{ color: "var(--text-3)" }}>
                <X size={16} />
              </button>
            </div>

            <h3 className="font-display text-lg font-semibold mb-2" style={{ color: "var(--text)" }}>
              Delete chat?
            </h3>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--text-2)" }}>
              <strong className="font-medium" style={{ color: "var(--text)" }}>{chatName}</strong> and all
              its messages, uploaded files, and cache will be permanently deleted. This cannot be undone.
            </p>

            <div className="flex gap-3">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                Cancel
              </button>
              <button onClick={onConfirm}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "#DC2626", color: "#fff" }}>
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
