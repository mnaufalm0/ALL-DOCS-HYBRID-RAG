"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Cookies from "js-cookie";
import type { User } from "@/lib/types";

interface AuthCtx {
  user:    User | null;
  token:   string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  loading: boolean;
}

const Ctx = createContext<AuthCtx>({
  user: null, token: null,
  setAuth: () => {}, clearAuth: () => {}, loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = Cookies.get("token");
    const u = localStorage.getItem("user");
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
    }
    setLoading(false);
  }, []);

  const setAuth = (u: User, t: string) => {
    Cookies.set("token", t, { expires: 1, sameSite: "lax" });
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
    setToken(t);
  };

  const clearAuth = () => {
    Cookies.remove("token");
    localStorage.removeItem("user");
    localStorage.removeItem("chats");
    setUser(null);
    setToken(null);
  };

  return (
    <Ctx.Provider value={{ user, token, setAuth, clearAuth, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
