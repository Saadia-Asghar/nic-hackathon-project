import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "./api";

const AuthContext = createContext(null);
const KEY = "hn_auth_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "null");
    } catch {
      return null;
    }
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      const token = getToken();
      if (!token) {
        setUser(null);
        localStorage.removeItem(KEY);
        setReady(true);
        return;
      }
      try {
        const { user: fresh } = await api.me();
        if (!cancelled) {
          setUser(fresh);
          localStorage.setItem(KEY, JSON.stringify(fresh));
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setToken(null);
          localStorage.removeItem(KEY);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      isResident: user?.role === "resident",
      isWorker: user?.role === "worker",
      async login(email, password) {
        const { user: next, token } = await api.login({ email, password });
        setToken(token);
        setUser(next);
        localStorage.setItem(KEY, JSON.stringify(next));
        return next;
      },
      async signup(payload) {
        const { user: next, token } = await api.signup(payload);
        setToken(token);
        setUser(next);
        localStorage.setItem(KEY, JSON.stringify(next));
        return next;
      },
      async refresh() {
        const { user: fresh } = await api.me();
        setUser(fresh);
        localStorage.setItem(KEY, JSON.stringify(fresh));
        return fresh;
      },
      logout() {
        setUser(null);
        setToken(null);
        localStorage.removeItem(KEY);
      },
    }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
