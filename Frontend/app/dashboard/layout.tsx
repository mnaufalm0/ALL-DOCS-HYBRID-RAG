"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [user, loading]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--accent)" }} />
    </div>
  );

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>

      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(p => !p)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? "280px" : "0" }}>

        {/* Top bar — only shows toggle when sidebar closed */}
        {!sidebarOpen && (
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--border)" }}>
            <button onClick={() => setSidebarOpen(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
              <Menu size={16} />
            </button>
            <span className="font-display font-semibold text-sm" style={{ color: "var(--text)" }}>
              All<span style={{ color: "var(--accent)" }}>Docs</span>
            </span>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
