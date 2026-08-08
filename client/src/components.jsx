import { Link, Navigate, useLocation } from "react-router-dom";
import {
  Home,
  Map,
  MessageCircle,
  User,
  Bell,
  MapPin,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "./auth";

const ZONE_LABEL = {
  Z1: "Gali 1–2",
  Z2: "Gali 3–4",
  Z3: "Gali 5–7",
  Z4: "Gali 8–9",
  Z5: "Main Market",
  Z6: "Back Streets",
};

export function mohallaLabel(zoneId) {
  return ZONE_LABEL[zoneId] || "Mohalla";
}

export function Shell({ children, title, backTo, hideNav = false, showMohalla = true }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const tabs = user
    ? [
        { to: "/app", label: "Home", icon: Home, match: (p) => p === "/app" },
        { to: "/map", label: "Map", icon: Map, match: (p) => p.startsWith("/map") },
        {
          to: "/chats",
          label: "Chat",
          icon: MessageCircle,
          match: (p) => p.startsWith("/chats") || p.includes("/chat"),
        },
        { to: "/profile", label: "Profile", icon: User, match: (p) => p.startsWith("/profile") },
      ]
    : [];

  const zoneName = mohallaLabel(user?.zoneId);

  return (
    <div className="app-shell">
      <header className="px-4 pt-2">
        {backTo ? (
          <div className="flex items-start justify-between gap-3 pt-3 pb-1">
            <div className="min-w-0">
              <Link to={backTo} className="inline-flex items-center gap-1 text-sm text-[var(--muted)] no-underline mb-1">
                <ChevronLeft size={16} /> Back
              </Link>
              {title && <h1 className="font-display text-[1.35rem] mt-0 mb-0 leading-tight">{title}</h1>}
            </div>
            <Link to="/notifications" className="p-2 text-[var(--navy)]" aria-label="Notifications">
              <Bell size={20} />
            </Link>
          </div>
        ) : (
          <div className="top-bar">
            <div className="flex items-center gap-1.5 text-[var(--navy)]">
              <MapPin size={18} strokeWidth={2.4} />
              <span className="top-bar-title">{showMohalla ? zoneName : title || "Hunar Naqsha"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Link to="/notifications" className="p-2 text-[var(--navy)]" aria-label="Notifications">
                <Bell size={20} />
              </Link>
              {user && (
                <button
                  className="p-2 text-[var(--muted)]"
                  type="button"
                  title="Log out"
                  onClick={() => {
                    logout();
                    window.location.href = "/";
                  }}
                >
                  <LogOut size={18} />
                </button>
              )}
            </div>
          </div>
        )}
      </header>
      <main className="px-4">{children}</main>
      {!hideNav && tabs.length > 0 && (
        <nav className="fixed bottom-0 left-0 right-0 z-30">
          <div className="max-w-[430px] mx-auto">
            <div className="bottom-nav" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
              {tabs.map((t) => {
                const active = t.match(pathname);
                const Icon = t.icon;
                return (
                  <Link key={t.label} to={t.to} className={`nav-item ${active ? "active" : ""}`}>
                    <span className="nav-icon">
                      <Icon size={20} strokeWidth={active ? 2.4 : 2} />
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
    urgent: { label: "Urgent", cls: "gap-red" },
    "pre-eid": { label: "Before Eid", cls: "gap-yellow" },
    week: { label: "Standard", cls: "gap-yellow" },
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
      <polyline fill="none" stroke="#1a237e" strokeWidth="2" points={points} />
    </svg>
  );
}

export function Stars({ value }) {
  const n = Math.round(Number(value) || 0);
  return <span className="tracking-tight text-[#f9a825]">{"★".repeat(n)}{"☆".repeat(Math.max(0, 5 - n))}</span>;
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

export function JobStepper({ status, jobDone }) {
  let stage = 0;
  if (status === "matched" || status === "completed") stage = 1;
  if (status === "matched" && jobDone) stage = 2;
  if (status === "completed") stage = 3;

  const steps = [
    { key: "booked", label: "Booked", icon: "✓" },
    { key: "progress", label: "In Progress", icon: "✂" },
    { key: "done", label: "Completed", icon: "✓" },
  ];

  const fillPct = stage <= 1 ? 0 : stage === 2 ? 50 : 100;

  return (
    <div className="stepper">
      <div className="stepper-line-done" style={{ width: `calc(${fillPct}% * 0.68)` }} />
      {steps.map((s, i) => {
        const n = i + 1;
        const cls = stage > n ? "done" : stage === n ? "current" : "";
        return (
          <div key={s.key} className={`step ${cls}`}>
            <div className="step-dot">{s.icon}</div>
            <div className="step-label">{s.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export function timeAgo(iso) {
  if (!iso) return "";
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `Posted ${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `Posted ${hrs}h ago`;
  return `Posted ${Math.round(hrs / 24)}d ago`;
}

export function initials(name = "?") {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
