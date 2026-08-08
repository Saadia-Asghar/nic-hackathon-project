import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Search, Scissors, Sparkles, Share2 } from "lucide-react";
import { api, SKILL_EMOJI, whatsappShareUrl } from "../api";
import { GapBadge, Shell } from "../components";

export default function Home() {
  const [zones, setZones] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [z, n, a] = await Promise.all([api.zones(), api.needs(), api.alerts()]);
      setZones(z);
      setNeeds(n);
      setAlerts(a);
      setErr("");
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function resetDemo() {
    setBusy(true);
    try {
      await api.resetDemo();
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const topAlert = alerts[0];
  const openCount = needs.filter((n) => n.status === "open").length;
  const redZones = zones.filter((z) => z.gapLevel === "red").length;

  return (
    <Shell>
      {/* Brand + what it is */}
      <div className="mb-4 pt-1">
        <div className="pill mb-3">
          <MapPin size={12} /> Mohalla Mind · Skill Map
        </div>
        <h1 className="font-display text-[2rem] leading-[1.05] m-0 mb-2">
          Hunar Naqsha
        </h1>
        <p className="text-[var(--muted)] text-[0.95rem] leading-relaxed m-0">
          Find local skills in your gali — or offer yours at your own price. AI watches the mohalla and warns when a shortage is forming.
        </p>
      </div>

      {/* Hero value + live pulse */}
      <div className="hero-panel mb-4">
        <div className="relative z-10">
          <div className="text-xs uppercase tracking-[0.14em] text-white/55 font-semibold mb-2">
            Your mohalla pulse
          </div>
          <div className="font-display text-[1.65rem] leading-tight mb-3">
            Apni gali ka hunar,<br />apni marzi ka daam
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="rounded-2xl bg-white/8 border border-white/10 p-3">
              <div className="text-2xl font-semibold">{openCount}</div>
              <div className="text-[11px] text-white/60 mt-0.5">Open needs nearby</div>
            </div>
            <div className="rounded-2xl bg-white/8 border border-white/10 p-3">
              <div className="text-2xl font-semibold">{redZones || "0"}</div>
              <div className="text-[11px] text-white/60 mt-0.5">Zones in shortage</div>
            </div>
          </div>
          <p className="text-sm text-white/70 m-0 leading-relaxed">
            Residents post. Workers bid. AI flags gaps before Eid or exams hit.
          </p>
        </div>
      </div>

      {/* Onboarding choices */}
      <h2 className="font-display text-lg m-0 mb-2">Start here</h2>
      <div className="grid grid-cols-1 gap-2.5 mb-5">
        <Link to="/needs/new" className="choice-card">
          <div className="choice-icon">
            <Search size={18} />
          </div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-[1.05rem]">I need a skill</div>
              <p className="text-sm text-[var(--muted)] m-0 mt-1 leading-snug">
                Post what you need (tailor, tutor, baker…). Nearby workers send bids with their own price. You pick one.
              </p>
            </div>
            <ArrowRight className="shrink-0 mt-1 text-[var(--muted)]" size={18} />
          </div>
        </Link>

        <Link to="/workers/register" className="choice-card">
          <div className="choice-icon" style={{ background: "var(--accent)" }}>
            <Scissors size={18} />
          </div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-[1.05rem]">I offer a skill</div>
              <p className="text-sm text-[var(--muted)] m-0 mt-1 leading-snug">
                Register once with your gali. See nearby jobs. Bid your price — no commission, no algorithm rate.
              </p>
            </div>
            <ArrowRight className="shrink-0 mt-1 text-[var(--muted)]" size={18} />
          </div>
        </Link>
      </div>

      {/* How it works */}
      <div className="card p-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} />
          <h2 className="font-display text-base m-0">How it works</h2>
        </div>
        <div className="space-y-3">
          {[
            ["Post or register", "Resident posts a need — or worker joins with skill + zone."],
            ["Bid your own price", "Workers bid Rs. + timeline. Resident accepts the best one."],
            ["AI watches the gali", "Needs + season + bid silence → shortage alert + WhatsApp notice."],
          ].map(([t, d], i) => (
            <div key={t} className="flex gap-3">
              <div className="step-dot">{i + 1}</div>
              <div>
                <div className="font-semibold text-sm">{t}</div>
                <div className="text-xs text-[var(--muted)] leading-relaxed mt-0.5">{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {err && <div className="card p-3 mb-3 text-sm text-[var(--red)]">{err}</div>}

      {/* Live alert */}
      {topAlert && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-lg m-0">Live Hunar Alert</h2>
            <GapBadge level={topAlert.gapLevel} />
          </div>
          <Link to={`/alerts/${topAlert.id}`} className="no-underline text-inherit block">
            <div className={`card p-4 border gap-${topAlert.gapLevel}`}>
              <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
                {topAlert.zone?.displayName}
              </div>
              <div className="font-display text-lg mt-1">
                {SKILL_EMOJI[topAlert.skillCategory]} {topAlert.skillCategory}
              </div>
              <p className="text-sm mt-2 mb-3 leading-relaxed opacity-90">{topAlert.reasoning}</p>
              <div className="flex gap-2 flex-wrap">
                <span className="btn btn-ghost text-xs py-2 px-3">See why</span>
                {topAlert.gapLevel === "red" && topAlert.whatsappNotice && (
                  <a
                    className="btn btn-accent text-xs py-2 px-3"
                    href={whatsappShareUrl(topAlert.whatsappNotice)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Share2 size={14} /> Share notice
                  </a>
                )}
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Zones */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-lg m-0">Zone map</h2>
        <button className="btn btn-ghost text-xs py-1.5 px-3" onClick={resetDemo} disabled={busy}>
          {busy ? "…" : "Reset demo"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {zones.map((z) => (
          <Link key={z.id} to={`/zones/${z.id}`} className="no-underline text-inherit">
            <div className={`card p-3.5 min-h-[108px] border gap-${z.gapLevel}`}>
              <div className="font-semibold text-sm">{z.displayName}</div>
              <div className="text-[11px] opacity-75 mt-0.5">{z.urduName}</div>
              <div className="mt-2.5">
                <GapBadge level={z.gapLevel} />
              </div>
              <div className="text-[11px] mt-2.5 opacity-85">
                {z.openNeedsCount} open
                {z.topShortageSkill ? ` · ${z.topShortageSkill.split(" ")[0]}` : ""}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <h2 className="font-display text-lg m-0 mb-2">Recent needs</h2>
      <div className="space-y-2.5">
        {needs.slice(0, 6).map((n) => (
          <Link key={n.id} to={`/needs/${n.id}`} className="no-underline text-inherit block">
            <div className="card p-4">
              <div className="flex justify-between gap-2 items-start">
                <div className="font-semibold text-sm">
                  {SKILL_EMOJI[n.skillCategory]} {n.skillCategory}
                </div>
                <span className="pill capitalize">{n.status}</span>
              </div>
              <p className="text-sm mt-2 mb-2 text-[var(--muted)] line-clamp-2 leading-snug">{n.description}</p>
              <div className="text-xs text-[var(--muted)]">
                {n.zone?.displayName} · Rs.{n.budgetRange} · {n.bidCount} bids
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
