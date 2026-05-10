"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { googleAuth } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function GoogleCallback() {
  const router = useRouter();
  const { setAuth } = useAuth();

  useEffect(() => {
    // Extract token from URL hash (#access_token=...)
    const hash   = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token  = params.get("access_token");

    if (!token) { router.push("/auth/login"); return; }

    googleAuth(token)
      .then(res => { setAuth(res.user, res.token); router.push("/dashboard"); })
      .catch(()  => router.push("/auth/login"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent mx-auto mb-4 animate-spin"
          style={{ borderColor: "var(--accent)" }} />
        <p className="text-sm" style={{ color: "var(--text-2)" }}>Completing sign in...</p>
      </div>
    </div>
  );
}
