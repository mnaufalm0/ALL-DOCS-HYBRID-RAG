"use client";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.9 }}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
      style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}
      aria-label="Toggle theme">
      {theme === "light"
        ? <Moon size={15} />
        : <Sun  size={15} />}
    </motion.button>
  );
}
