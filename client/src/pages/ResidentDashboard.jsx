import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Map, MessageCircle, Search, Share2, Sparkles } from "lucide-react";
import { api, SKILL_EMOJI, whatsappShareUrl } from "../api";
import { useAuth } from "../auth";
import { GapBadge, Shell, Stars, TrustRing, UrgencyBadge } from "../components";

export default function ResidentDashboard() {
  const { user } = useAuth();
  const [needs, setNeeds] = useState([]);
  const [alert, setAlert] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [top, setTop] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    Promise.all([
      api.residentNeeds(user.id),
      api.alerts(),
      api.forecast(),
      api.topWorkers(user.zoneId || "Z3"),
    ])
      .then(([n, a, f, t]) => {
        setNeeds(n);
        setAlert(a[0] || null);
        setForecast(f.slice(0, 2));
        setTop(t.slice(0, 3));
      })
      .catch((e) => setErr(e.message));
  }, [user.id, user.zoneId]);

  const open = needs.filter((n) => n.status === "open").length;
  const matched = needs.filter((n) => ["matched", "completed"].includes(n.status));

  return (
    <Shell title={`Hi, ${user.name.split(" ")[0]}`}>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Link className="btn btn-primary" to="/needs/new">
          Post need
        </Link>
        <Link className="btn btn-ghost" to="/discover">
          <Search size={15} /> Find
        </Link>
        <Link className="btn btn-ghost" to="/map">
          <Map size={15} /> Map
        </Link>
      </div>

      {alert && (
        <div className={`card p-4 mb-4 border gap-${alert.gapLevel}`}>
          <div className="flex justify-between items-center gap-2">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-70">Hunar alert</div>
            <GapBadge level={alert.gapLevel} />
          </div>
          <div className="font-semibold mt-2 text-sm">
            {SKILL_EMOJI[alert.skillCategory]} {alert.skillCategory} · {alert.zone?.displayName}
          </div>
          <p className="text-sm mt-2 mb-3 line-clamp-2 leading-snug opacity-90">{alert.reasoning}</p>
          <div className="flex gap-2">
            {alert.whatsappNotice && (
              <a
                className="btn btn-accent flex-1 text-xs py-2"
                href={whatsappShareUrl(alert.whatsappNotice)}
                target="_blank"
                rel="noreferrer"
              >
                <Share2 size={14} /> Share WhatsApp
              </a>
            )}
            <Link className="btn btn-ghost flex-1 text-xs py-2" to={`/alerts/${alert.id}`}>
              Details
            </Link>
          </div>
          <button
            className="btn btn-ghost w-full mt-2 text-xs"
            type="button"
            onClick={async () => {
              await api.markHandled(alert.zoneId, alert.skillCategory);
              setAlert(null);
            }}
          >
            Community is handling this
          </button>
        </div>
      )}

      {forecast.length > 0 && (
        <div className="card p-4 mb-4">
          <div className="text-sm font-semibold flex items-center gap-2 mb-2">
            <Sparkles size={15} className="text-[var(--rose)]" /> Coming demand
          </div>
          {forecast.map((f) => (
            <div key={f.skillCategory} className="text-sm text-[var(--muted)] py-1.5 border-b border-[var(--line)] last:border-0">
              {SKILL_EMOJI[f.skillCategory]} {f.headline}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="card p-4">
          <div className="text-2xl font-semibold">{open}</div>
          <div className="text-xs text-[var(--muted)]">Waiting for bids</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-semibold">{matched.length}</div>
          <div className="text-xs text-[var(--muted)]">Matched / done</div>
        </div>
      </div>

      {top.length > 0 && (
        <div className="mb-4">
          <h2 className="font-display text-lg m-0 mb-2">Top in your zone</h2>
          <div className="space-y-2">
            {top.map((w) => (
              <Link key={w.id} to={`/workers/${w.id}`} className="card p-3 flex gap-3 no-underline text-inherit items-center">
                <TrustRing score={w.trustScore || 0} />
                <div className="min-w-0">
                  <div className="font-semibold text-sm">{w.name}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {w.skillCategory.split(" ")[0]} · <Stars value={w.rating} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {err && <p className="text-sm text-[var(--red)]">{err}</p>}

      <h2 className="font-display text-lg m-0 mb-2">My activity</h2>
      <div className="space-y-2.5">
        {needs.length === 0 && (
          <div className="card p-4 text-sm text-[var(--muted)]">No posts yet — tap Post need.</div>
        )}
        {needs.map((n) => (
          <div key={n.id} className="card p-4">
            <Link to={`/needs/${n.id}`} className="no-underline text-inherit block">
              <div className="flex justify-between gap-2 items-start">
                <div className="font-semibold text-sm">
                  {SKILL_EMOJI[n.skillCategory]} {n.skillCategory}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="pill capitalize">{n.status}</span>
                  <UrgencyBadge urgency={n.urgency} />
                </div>
              </div>
              <p className="text-sm text-[var(--muted)] mt-2 mb-1 line-clamp-2">{n.description}</p>
              <div className="text-xs text-[var(--muted)]">
                {n.zone?.displayName} · {n.bidCount} bids
              </div>
            </Link>
            <div className="flex gap-2 mt-3">
              {["matched", "completed"].includes(n.status) && (
                <Link className="btn btn-ghost flex-1 text-xs py-2" to={`/needs/${n.id}/chat`}>
                  <MessageCircle size={14} /> Chat
                </Link>
              )}
              {n.status === "matched" && !n.jobDone && (
                <Link className="btn btn-primary flex-1 text-xs py-2" to={`/needs/${n.id}`}>
                  Confirm done
                </Link>
              )}
              {n.status === "completed" && (
                <button
                  className="btn btn-ghost flex-1 text-xs py-2"
                  type="button"
                  onClick={async () => {
                    const { need } = await api.repostNeed(n.id);
                    window.location.href = `/needs/${need.id}`;
                  }}
                >
                  Repost
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
