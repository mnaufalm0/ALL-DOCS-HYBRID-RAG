"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { emailLogin, googleAuth } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const router  = useRouter();
  const { setAuth } = useAuth();

  const [form,       setForm]       = useState({ email: "", password: "" });
  const [showPass,   setShowPass]   = useState(false);
  const [remember,   setRemember]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await emailLogin(form);
      setAuth(res.user, res.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid credentials");
    } finally { setLoading(false); }
  };

  const handleGoogle = () => {
    const clientId    = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=email%20profile`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>

      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12"
        style={{ background: "var(--bg-2)", borderRight: "1px solid var(--border)" }}>
        <div className="font-display text-xl font-semibold" style={{ color: "var(--text)" }}>
          All<span style={{ color: "var(--accent)" }}>Docs</span>
        </div>
        <div>
          <h2 className="font-display text-4xl font-semibold leading-snug mb-4"
            style={{ color: "var(--text)" }}>
            Intelligence from<br /><em className="italic" style={{ color: "var(--accent)" }}>your documents.</em>
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
            Hybrid AI retrieval across all your files — PDFs, reports, spreadsheets — in one place.
          </p>
        </div>
        <p className="text-xs" style={{ color: "var(--text-3)" }}>Powered by NeuroBuzz</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="absolute top-4 right-4"><ThemeToggle /></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm">

          <h1 className="font-display text-3xl font-semibold mb-1" style={{ color: "var(--text)" }}>
            Welcome back
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--text-2)" }}>
            Sign in to your account
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm"
              style={{ background: "#FEE2E2", color: "#DC2626", border: "1px solid #FCA5A5" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
                Email address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-3)" }} />
                <input
                  type="email" required value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "var(--bg-2)", border: "1px solid var(--border)",
                    color: "var(--text)"
                  }}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-3)" }} />
                <input
                  type={showPass ? "text" : "password"} required value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "var(--bg-2)", border: "1px solid var(--border)",
                    color: "var(--text)"
                  }}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-3)" }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="rounded" />
                <span className="text-xs" style={{ color: "var(--text-2)" }}>Remember me</span>
              </label>
              <Link href="/auth/forgot-password"
                className="text-xs" style={{ color: "var(--accent)" }}>
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
              style={{ background: "var(--accent)", color: "#fff" }}>
              {loading ? "Signing in..." : <><span>Sign in</span><ArrowRight size={15} /></>}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--text-3)" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          {/* Google */}
          <button onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs mt-6" style={{ color: "var(--text-3)" }}>
            No account?{" "}
            <Link href="/auth/signup" style={{ color: "var(--accent)" }}>
              Sign up free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
