import { Navigate } from "react-router-dom";
import { useAuth } from "../auth";
import ResidentDashboard from "./ResidentDashboard";
import WorkerDashboard from "./WorkerDashboard";

export default function AppHome() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="app-shell px-4 pt-10 text-[var(--muted)]">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "worker") return <WorkerDashboard />;
  return <ResidentDashboard />;
}
