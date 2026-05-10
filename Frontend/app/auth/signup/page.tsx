"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import { emailSignup } from "@/lib/api";
import ThemeToggle from "@/components/ThemeToggle";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", display_name: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await emailSignup(form);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Signup failed");
    } finally { setLoading(false); }
  };

  const handleGoogle = () => {
    const clientId    = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=email%20profile`;
    window.location.href = url;
  };

  if (success) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8 rounded-2xl max-w-sm w-full mx-6"
        style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
        <CheckCircle size={40} className="mx-auto mb-4" style={{ color: "var(--accent)" }} />
        <h2 className="font-display text-2xl font-semibold mb-2" style={{ color: "var(--text)" }}>
          Check your email
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-2)" }}>
          We sent a verification link to <strong>{form.email}</strong>
        </p>
        <Link href="/auth/login"
          className="text-sm font-medium" style={{ color: "var(--accent)" }}>
          Back to sign in
        </Link>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12"
        style={{ background: "var(--bg-2)", borderRight: "1px solid var(--border)" }}>
        <div className="font-display text-xl font-semibold" style={{ color: "var(--text)" }}>
          All<span style={{ color: "var(--accent)" }}>Docs</span>
        </div>
        <div>
          <h2 className="font-display text-4xl font-semibold leading-snug mb-4" style={{ color: "var(--text)" }}>
            Start asking<br /><em className="italic" style={{ color: "var(--accent)" }}>better questions.</em>
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
            Join AllDocs and unlock AI-powered intelligence across all your documents.
          </p>
        </div>
        <p className="text-xs" style={{ color: "var(--text-3)" }}>Powered by NeuroBuzz</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="absolute top-4 right-4"><ThemeToggle /></div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-semibold mb-1" style={{ color: "var(--text)" }}>
            Create account
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--text-2)" }}>Free to get started</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm"
              style={{ background: "#FEE2E2", color: "#DC2626", border: "1px solid #FCA5A5" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
                Full name
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }} />
                <input type="text" required value={form.display_name}
                  onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                  placeholder="Muhammad Naufal" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
                Email address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }} />
                <input type="email" required value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                  placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }} />
                <input type={showPass ? "text" : "password"} required value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                  placeholder="Min. 8 characters" minLength={8} />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"
              style={{ background: "var(--accent)", color: "#fff" }}>
              {loading ? "Creating account..." : <><span>Create account</span><ArrowRight size={15} /></>}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--text-3)" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          <button onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs mt-6" style={{ color: "var(--text-3)" }}>
            Already have an account?{" "}
            <Link href="/auth/login" style={{ color: "var(--accent)" }}>Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
