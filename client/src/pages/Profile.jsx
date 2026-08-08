import { Navigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import { Shell, mohallaLabel } from "../components";

export default function Profile() {
  const { user, ready, logout, isWorker } = useAuth();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [agentLabel, setAgentLabel] = useState("…");

  useEffect(() => {
    api
      .agentStatus()
      .then((s) => setAgentLabel(s.geminiConfigured ? "Gemini + heuristic" : "Heuristic (demo)"))
      .catch(() => setAgentLabel("Heuristic"));
  }, []);

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;

  async function resetDemo() {
    setBusy(true);
    setMsg("");
    try {
      await api.resetDemo();
      setMsg("Demo reset. Log out and log in again with fatima@demo.com / demo123.");
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <div className="pt-4 flex flex-col items-center text-center mb-6">
        <div
          className="w-20 h-20 rounded-full grid place-items-center text-2xl font-extrabold text-[var(--navy)] mb-3"
          style={{ background: "var(--blue-soft)" }}
        >
          {user.name.slice(0, 1)}
        </div>
        <h1 className="font-display text-xl m-0">{user.name}</h1>
        <p className="text-sm text-[var(--muted)] mt-1 mb-0">{user.email}</p>
        <span className="pill mt-2 capitalize">{user.role}</span>
      </div>

      <div className="card p-4 space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted)]">Mohalla</span>
          <span className="font-semibold">{mohallaLabel(user.zoneId)}</span>
        </div>
        {isWorker && user.workerId && (
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted)]">Public profile</span>
            <Link to={`/workers/${user.workerId}`} className="font-semibold text-[var(--navy)]">
              View →
            </Link>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted)]">Auth</span>
          <span className="font-semibold">JWT secured</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted)]">Gap agent</span>
          <span className="font-semibold">{agentLabel}</span>
        </div>
      </div>

      <Link className="btn btn-ghost w-full mb-2" to="/discover">
        Discover workers
      </Link>
      <button type="button" className="btn btn-ghost w-full mb-2" disabled={busy} onClick={resetDemo}>
        {busy ? "Resetting…" : "Reset demo data"}
      </button>
      {msg && <p className="text-xs text-[var(--muted)] mb-3 text-center">{msg}</p>}
      <button
        type="button"
        className="btn btn-primary w-full"
        onClick={() => {
          logout();
          window.location.href = "/";
        }}
      >
        Log out
      </button>
    </Shell>
  );
}
