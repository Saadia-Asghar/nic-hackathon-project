import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { api, SKILL_EMOJI, whatsappShareUrl } from "../api";
import { useAuth } from "../auth";
import { GapBadge, Shell, Sparkline, UrgencyBadge } from "../components";

export default function ZoneDetail() {
  const { id } = useParams();
  const { user, ready } = useAuth();
  const [zone, setZone] = useState(null);
  const [history, setHistory] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    Promise.all([api.zone(id), api.zoneHistory(id)])
      .then(([z, h]) => {
        setZone(z);
        setHistory(h);
      })
      .catch((e) => setErr(e.message));
  }, [id]);

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (!zone) {
    return (
      <Shell title="Zone" backTo="/app">
        <p className="text-sm text-[var(--muted)]">{err || "Loading…"}</p>
      </Shell>
    );
  }

  const top = [...(zone.skills || [])].sort(
    (a, b) => ({ red: 3, yellow: 2, green: 1 }[b.gapLevel] - { red: 3, yellow: 2, green: 1 }[a.gapLevel])
  )[0];
  const redAlert = (zone.alerts || []).find((a) => a.gapLevel === "red");
  const skillHistory = history.filter((h) => h.skillCategory === top?.skillCategory).slice(0, 7).reverse();

  return (
    <Shell title={zone.displayName} backTo="/app">
      {top && (
        <div className={`card p-4 mb-4 border gap-${top.gapLevel}`}>
          <div className="flex justify-between items-center gap-2">
            <GapBadge level={top.gapLevel} />
            <span className="text-xs font-semibold uppercase text-[var(--muted)]">
              {top.confidence} confidence
            </span>
          </div>
          <p className="text-sm leading-relaxed mt-3 mb-2">{top.aiReasoning}</p>
          {(top.confidenceWhy || skillHistory[0]?.confidenceWhy) && (
            <p className="text-xs text-[var(--muted)] m-0 mb-3 leading-relaxed">
              Why confidence: {top.confidenceWhy || skillHistory[0]?.confidenceWhy}
            </p>
          )}
          <div className="mb-3">
            <div className="text-[11px] text-[var(--muted)] mb-1">Gap trend (recent analyses)</div>
            <Sparkline history={skillHistory.length ? skillHistory : history.slice(0, 7).reverse()} />
          </div>
          {redAlert?.whatsappNotice && (
            <a
              className="btn btn-accent w-full"
              href={whatsappShareUrl(redAlert.whatsappNotice)}
              target="_blank"
              rel="noreferrer"
            >
              Share WhatsApp notice
            </a>
          )}
          {top.gapLevel !== "green" && (
            <button
              className="btn btn-ghost w-full mt-2 text-xs"
              type="button"
              onClick={async () => {
                await api.markHandled(zone.id, top.skillCategory);
                const z = await api.zone(id);
                setZone(z);
              }}
            >
              Mark: community handling
            </button>
          )}
        </div>
      )}

      <h2 className="font-display text-lg mt-0 mb-2">Skills</h2>
      <div className="space-y-2 mb-4">
        {(zone.skills || []).map((s) => (
          <div key={s.id} className={`card p-3 border gap-${s.gapLevel}`}>
            <div className="flex justify-between gap-2 text-sm font-semibold">
              <span>
                {SKILL_EMOJI[s.skillCategory]} {s.skillCategory}
              </span>
              <GapBadge level={s.gapLevel} />
            </div>
            <div className="text-xs mt-1 opacity-90">
              {s.openNeedsCount} needs · {s.registeredWorkersCount} available workers
            </div>
          </div>
        ))}
      </div>

      <h2 className="font-display text-lg mb-2">Open needs</h2>
      <div className="space-y-2">
        {(zone.needs || [])
          .filter((n) => n.status === "open")
          .map((n) => (
            <Link key={n.id} to={`/needs/${n.id}`} className="card p-3 block no-underline text-inherit text-sm">
              <div className="flex justify-between gap-2">
                <span>
                  {SKILL_EMOJI[n.skillCategory]} {n.description}
                </span>
                <UrgencyBadge urgency={n.urgency} />
              </div>
            </Link>
          ))}
      </div>
    </Shell>
  );
}
