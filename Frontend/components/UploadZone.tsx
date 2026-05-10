"use client";
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, CheckCircle2, AlertCircle } from "lucide-react";
import { uploadFile } from "@/lib/api";
import ProcessingAnimation from "./ProcessingAnimation";

const ACCEPTED = [".pdf",".docx",".pptx",".txt",".csv",".xlsx",".md",".html",".rtf",".epub"];
const STAGES   = ["Extracting text", "Chunking content", "Generating embeddings", "Storing vectors"];

interface Props {
  chatName:    string;
  onComplete:  (fileId: string, filename: string) => void;
}

export default function UploadZone({ chatName, onComplete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag,     setDrag]     = useState(false);
  const [file,     setFile]     = useState<File | null>(null);
  const [status,   setStatus]   = useState<"idle"|"processing"|"done"|"error">("idle");
  const [progress, setProgress] = useState(0);
  const [stage,    setStage]    = useState(STAGES[0]);
  const [error,    setError]    = useState("");

  const simulateStages = (onDone: () => void) => {
    let i = 0;
    setStage(STAGES[0]);
    setProgress(5);
    const interval = setInterval(() => {
      i++;
      if (i < STAGES.length) {
        setStage(STAGES[i]);
        setProgress(20 + i * 25);
      } else {
        clearInterval(interval);
        setProgress(100);
        setTimeout(onDone, 400);
      }
    }, 1800);
  };

  const process = useCallback(async (f: File) => {
    setFile(f);
    setStatus("processing");
    setError("");
    try {
      let fileId = "";
      simulateStages(async () => {
        try {
          const res = await uploadFile(f, setProgress);
          fileId = res.file_id;
          setStatus("done");
          setTimeout(() => onComplete(fileId, f.name), 800);
        } catch (err: any) {
          setStatus("error");
          setError(err.response?.data?.detail || "Upload failed");
        }
      });
    } catch (err: any) {
      setStatus("error");
      setError(err.response?.data?.detail || "Upload failed");
    }
  }, [onComplete]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) process(f);
  };

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) process(f);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">

      <AnimatePresence mode="wait">

        {/* Idle — drop zone */}
        {status === "idle" && (
          <motion.div key="idle"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="w-full max-w-lg">

            <div className="text-center mb-6">
              <h2 className="font-display text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
                {chatName || "New Chat"}
              </h2>
              <p className="text-sm" style={{ color: "var(--text-2)" }}>
                Upload a document to start querying it
              </p>
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className="relative flex flex-col items-center justify-center gap-4 p-12 rounded-2xl cursor-pointer transition-all"
              style={{
                border: `2px dashed ${drag ? "var(--accent)" : "var(--border)"}`,
                background: drag ? "var(--accent-soft)" : "var(--bg-2)",
              }}>

              <motion.div animate={{ y: drag ? -4 : 0 }} transition={{ type: "spring" }}>
                <Upload size={36} style={{ color: drag ? "var(--accent)" : "var(--text-3)" }} />
              </motion.div>

              <div className="text-center">
                <p className="font-medium text-sm" style={{ color: "var(--text)" }}>
                  Drop your file here
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
                  or click to browse
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                {ACCEPTED.map(ext => (
                  <span key={ext} className="text-xs px-2 py-0.5 rounded-full font-mono"
                    style={{ background: "var(--bg-3)", color: "var(--text-3)" }}>
                    {ext}
                  </span>
                ))}
              </div>

              <p className="text-xs" style={{ color: "var(--text-3)" }}>Max 20MB</p>

              <input ref={inputRef} type="file" className="hidden"
                accept={ACCEPTED.join(",")} onChange={onSelect} />
            </div>
          </motion.div>
        )}

        {/* Processing */}
        {status === "processing" && file && (
          <motion.div key="processing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="w-full max-w-lg">
            <ProcessingAnimation filename={file.name} progress={progress} stage={stage} />
          </motion.div>
        )}

        {/* Done */}
        {status === "done" && (
          <motion.div key="done"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center">
            <CheckCircle2 size={48} className="mx-auto mb-4" style={{ color: "var(--accent)" }} />
            <p className="font-display text-xl font-semibold mb-1" style={{ color: "var(--text)" }}>
              Document ready
            </p>
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              Opening chat...
            </p>
          </motion.div>
        )}

        {/* Error */}
        {status === "error" && (
          <motion.div key="error"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center">
            <AlertCircle size={40} className="mx-auto mb-4" style={{ color: "#EF4444" }} />
            <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>Upload failed</p>
            <p className="text-sm mb-4" style={{ color: "var(--text-2)" }}>{error}</p>
            <button onClick={() => setStatus("idle")}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: "var(--accent)", color: "#fff" }}>
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
