import { Link, Navigate, useLocation } from "react-router-dom";
import { Home, PlusCircle, Briefcase, LogOut, ChevronLeft, Map, Search, Bell } from "lucide-react";
import { useAuth } from "./auth";

export function Shell({ children, title, backTo, hideNav = false }) {
  const { user, isResident, isWorker, logout } = useAuth();
  const { pathname } = useLocation();

  let tabs = [];
  if (isResident) {
    tabs = [
      { to: "/app", label: "Home", icon: Home, match: (p) => p === "/app" },
      { to: "/discover", label: "Find", icon: Search, match: (p) => p.startsWith("/discover") },
      { to: "/map", label: "Map", icon: Map, match: (p) => p.startsWith("/map") },
      { to: "/needs/new", label: "Post", icon: PlusCircle, match: (p) => p.startsWith("/needs/new") },
    ];
  } else if (isWorker) {
    tabs = [
      { to: "/app", label: "Jobs", icon: Briefcase, match: (p) => p === "/app" || p.startsWith("/worker/") },
      { to: "/map", label: "Map", icon: Map, match: (p) => p.startsWith("/map") },
      { to: "/notifications", label: "Alerts", icon: Bell, match: (p) => p.startsWith("/notifications") },
    ];
  }

  return (
    <div className="app-shell">
      <header className="px-4 pt-5 pb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {backTo ? (
            <>
              <Link to={backTo} className="inline-flex items-center gap-1 text-sm text-[var(--muted)] no-underline mb-1">
                <ChevronLeft size={16} /> Back
              </Link>
              {title && <h1 className="font-display text-[1.35rem] mt-0 mb-0 leading-tight">{title}</h1>}
            </>
          ) : (
            <div>
              <div className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wide">
                {user?.role === "worker" ? "Worker" : "Resident"}
              </div>
              <div className="font-display text-xl truncate">{title || user?.name || "Hunar Naqsha"}</div>
            </div>
          )}
        </div>
        {user && (
          <div className="flex items-center gap-1 shrink-0">
            {isResident && (
              <Link to="/notifications" className="btn btn-ghost text-xs py-2 px-2.5 no-underline" title="Notifications">
                <Bell size={14} />
              </Link>
            )}
            <button
              className="btn btn-ghost text-xs py-2 px-3"
              onClick={() => {
                logout();
                window.location.href = "/";
              }}
              type="button"
            >
              <LogOut size={14} /> Out
            </button>
          </div>
        )}
      </header>
      <main className="px-4">{children}</main>
      {!hideNav && tabs.length > 0 && (
        <nav className="fixed bottom-0 left-0 right-0 z-20">
          <div className="max-w-[430px] mx-auto px-3 pb-3">
            <div
              className="rounded-[28px] border border-[var(--line)] bg-[rgba(255,253,249,0.95)] backdrop-blur shadow-[0_12px_40px_rgba(158,107,122,0.12)] py-2 px-1"
              style={{ display: "grid", gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
            >
              {tabs.map((t) => {
                const active = t.match(pathname);
                const Icon = t.icon;
                return (
                  <Link key={t.label} to={t.to} className={`nav-item ${active ? "active" : ""}`}>
                    <span className="nav-icon">
                      <Icon size={16} strokeWidth={2.25} />
                    </span>
                    {t.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}

export function RequireAuth({ role, children }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return <div className="app-shell px-4 pt-10 text-sm text-[var(--muted)]">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to="/app" replace />;
  }
  return children;
}

export function GapBadge({ level }) {
  const map = {
    green: "Balanced",
    yellow: "Gap forming",
    red: "Acute shortage",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border gap-${level || "green"}`}>
      <span aria-hidden>●</span>
      {map[level] || level}
    </span>
  );
}

export function UrgencyBadge({ urgency }) {
  if (!urgency || urgency === "flexible") return null;
  const map = {
    urgent: { label: "Needed today", cls: "gap-red" },
    "pre-eid": { label: "Before Eid", cls: "gap-yellow" },
    week: { label: "Within a week", cls: "gap-yellow" },
  };
  const item = map[urgency] || { label: urgency, cls: "gap-yellow" };
  return (
    <span className={`inline-flex text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${item.cls}`}>
      {item.label}
    </span>
  );
}

export function Sparkline({ history = [] }) {
  const rank = { green: 1, yellow: 2, red: 3 };
  const vals = history.map((h) => rank[h.gapLevel] || 1);
  if (vals.length < 2) {
    return <div className="text-[11px] text-[var(--muted)]">Tracking gap over time…</div>;
  }
  const w = 120;
  const h = 28;
  const max = 3;
  const step = w / (vals.length - 1);
  const points = vals
    .map((v, i) => `${i * step},${h - ((v - 1) / (max - 1)) * (h - 4) - 2}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="block">
      <polyline fill="none" stroke="#d4537e" strokeWidth="2" points={points} />
    </svg>
  );
}

export function Stars({ value }) {
  const n = Math.round(Number(value) || 0);
  return <span className="tracking-tight text-[var(--caramel)]">{"★".repeat(n)}{"☆".repeat(Math.max(0, 5 - n))}</span>;
}

export function TrustRing({ score = 0 }) {
  const p = Math.max(0, Math.min(100, Number(score) || 0));
  const tone = p >= 80 ? "trust-high" : p >= 55 ? "trust-mid" : "trust-low";
  return (
    <div className={`trust-ring shrink-0 ${tone}`} style={{ ["--p"]: p }} title={`Trust ${p}/100`}>
      {p}
    </div>
  );
}
