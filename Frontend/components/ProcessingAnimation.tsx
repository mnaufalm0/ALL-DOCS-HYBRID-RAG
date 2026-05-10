"use client";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface Props {
  filename: string;
  progress: number;   // 0-100
  stage:    string;   // "Extracting" | "Chunking" | "Embedding" | "Storing"
}

const STAGES = ["Extracting text", "Chunking content", "Generating embeddings", "Storing vectors"];

export default function ProcessingAnimation({ filename, progress, stage }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas  = canvasRef.current;
    if (!canvas) return;
    const ctx     = canvas.getContext("2d")!;
    let   animId: number;
    let   t = 0;

    const isDark = document.documentElement.classList.contains("dark");
    const accent = isDark ? "#5B9BD5" : "#3D7EAA";

    const draw = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const { width: w, height: h } = canvas;

      ctx.clearRect(0, 0, w, h);
      t += 0.02;

      // Wave lines
      for (let line = 0; line < 5; line++) {
        ctx.beginPath();
        const amp   = 20 - line * 3;
        const freq  = 0.02 + line * 0.005;
        const phase = t + line * 0.8;
        const yBase = h / 2 + (line - 2) * 22;

        ctx.moveTo(0, yBase);
        for (let x = 0; x <= w; x += 2) {
          const y = yBase + Math.sin(x * freq + phase) * amp;
          ctx.lineTo(x, y);
        }

        const alpha = 0.15 + (line === 2 ? 0.5 : 0.1);
        ctx.strokeStyle = accent + Math.round(alpha * 255).toString(16).padStart(2, "0");
        ctx.lineWidth   = line === 2 ? 2.5 : 1;
        ctx.stroke();
      }

      // Floating dots
      for (let i = 0; i < 12; i++) {
        const x = (w * (i / 12) + t * 30) % w;
        const y = h / 2 + Math.sin(t * 2 + i) * 40;
        const r = 2 + Math.sin(t + i) * 1.5;

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = accent + "99";
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  const stageIndex = STAGES.findIndex(s => s === stage);

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-12 text-center">

      {/* Canvas */}
      <div className="relative w-full max-w-md h-40 rounded-2xl overflow-hidden mb-8"
        style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
        <canvas ref={canvasRef} className="w-full h-full" />

        {/* Pulsing center dot */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <div className="ring-pulse ring-pulse-2 absolute inset-0 rounded-full w-12 h-12 -translate-x-1/2 -translate-y-1/2"
              style={{ border: "2px solid var(--accent)", top: "50%", left: "50%" }} />
            <div className="ring-pulse ring-pulse-3 absolute inset-0 rounded-full w-12 h-12 -translate-x-1/2 -translate-y-1/2"
              style={{ border: "2px solid var(--accent)", top: "50%", left: "50%" }} />
            <div className="w-4 h-4 rounded-full" style={{ background: "var(--accent)" }} />
          </div>
        </div>
      </div>

      {/* File name */}
      <p className="text-xs font-mono mb-1 truncate max-w-xs" style={{ color: "var(--text-3)" }}>
        {filename}
      </p>

      {/* Stage label */}
      <motion.p key={stage}
        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
        className="font-display text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>
        {stage || "Processing..."}
      </motion.p>

      <p className="text-sm mb-6" style={{ color: "var(--text-2)" }}>
        Your document is being prepared for intelligence
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-xs h-1.5 rounded-full overflow-hidden"
        style={{ background: "var(--bg-3)" }}>
        <motion.div className="h-full rounded-full"
          style={{ background: "var(--accent)" }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }} />
      </div>

      <p className="text-xs mt-2 font-mono" style={{ color: "var(--text-3)" }}>
        {progress}%
      </p>

      {/* Stages */}
      <div className="flex gap-4 mt-8">
        {STAGES.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-2 h-2 rounded-full transition-all duration-500"
              style={{
                background: i <= stageIndex ? "var(--accent)" : "var(--border)",
                transform:  i === stageIndex ? "scale(1.5)" : "scale(1)"
              }} />
            <span className="text-xs hidden sm:block" style={{
              color: i <= stageIndex ? "var(--accent)" : "var(--text-3)"
            }}>{s.split(" ")[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
