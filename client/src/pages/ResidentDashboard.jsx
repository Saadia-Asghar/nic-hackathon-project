import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Share2, ChevronDown, ChevronUp } from "lucide-react";
import { api, whatsappShareUrl } from "../api";
import { useAuth } from "../auth";
import { GapBadge, Shell, Stars, timeAgo, initials } from "../components";

export default function ResidentDashboard() {
  const { user } = useAuth();
  const [needs, setNeeds] = useState([]);
  const [alert, setAlert] = useState(null);
  const [zones, setZones] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const [n, a, z, f] = await Promise.all([
      api.residentNeeds(user.id),
      api.alerts(),
      api.zones(),
      api.forecast(),
    ]);
    setNeeds(n);
    const mine =
      a.find((x) => x.zoneId === (user.zoneId || "Z3") && x.gapLevel === "red") ||
      a.find((x) => x.zoneId === (user.zoneId || "Z3")) ||
      a.find((x) => x.gapLevel === "red") ||
      a[0] ||
      null;
    setAlert(mine);
    setZones(z);
    setForecast(f.slice(0, 2));
    const firstOpen = n.find((x) => x.status === "open" && (x.bids?.length || x.bidCount));
    if (firstOpen) setExpanded({ [firstOpen.id]: true });
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, [user.id, user.zoneId]);

  async function accept(bidId) {
    try {
      setBusy(true);
      await api.acceptBid(bidId);
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDone(needId) {
    try {
      setBusy(true);
      await api.confirmDone(needId);
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const active = needs.filter((n) => n.status !== "completed");

  return (
    <Shell>
      <div className="pt-3 pb-2">
        <h1 className="font-display text-[1.75rem] m-0 leading-tight">
          Salam, {user.name.split(" ")[0]}!
        </h1>
        <p className="text-[var(--muted)] mt-1.5 mb-5 text-[0.95rem]">
          What local skill do you need today?
        </p>
      </div>

      <Link to="/needs/new" className="cta-post mb-6">
        <span className="cta-post-icon">
          <Plus size={22} strokeWidth={2.5} />
        </span>
        + Post a Skill Need
      </Link>

      {alert && (
        <div className={`card p-4 mb-5 border gap-${alert.gapLevel}`}>
          <div className="flex justify-between items-center gap-2">
            <div className="text-xs font-bold uppercase tracking-wide opacity-70">AI Alert</div>
            <GapBadge level={alert.gapLevel} />
          </div>
          <div className="font-semibold text-sm mt-2">
            {alert.skillCategory} · {alert.zone?.displayName || alert.zoneId}
          </div>
          <p className="text-xs text-[var(--muted)] mt-1 mb-0">
            GapDetectionAgent · {alert.agentSource || "heuristic"} · {alert.confidence || "medium"} confidence
          </p>
          <p className="text-sm mt-2 mb-3 leading-snug">{alert.reasoning}</p>
          <div className="flex flex-col gap-2">
            {alert.gapLevel === "red" && alert.whatsappNotice ? (
              <a
                className="btn btn-accent w-full text-xs"
                href={whatsappShareUrl(alert.whatsappNotice)}
                target="_blank"
                rel="noreferrer"
              >
                <Share2 size={14} /> Share community notice
              </a>
            ) : (
              <Link className="btn btn-ghost w-full text-xs" to={`/zones/${alert.zoneId}`}>
                See open needs in zone
              </Link>
            )}
            <div className="flex gap-2">
              <Link className="btn btn-ghost flex-1 text-xs py-2" to={`/alerts/${alert.id}`}>
                Why this alert
              </Link>
              <Link className="btn btn-ghost flex-1 text-xs py-2" to="/signup">
                Invite a worker
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-lg m-0">Mohalla pulse</h2>
        <Link to="/map" className="text-xs font-semibold text-[var(--teal)] no-underline">
          Open map →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {zones.map((z) => (
          <Link key={z.id} to={`/zones/${z.id}`} className="no-underline text-inherit">
            <div className={`card p-3 min-h-[96px] border gap-${z.gapLevel}`}>
              <div className="font-semibold text-sm">{z.displayName}</div>
              <div className="mt-2">
                <GapBadge level={z.gapLevel} />
              </div>
              <div className="text-[11px] mt-2 opacity-85">
                {z.openNeedsCount} open
                {z.topShortageSkill ? ` · ${z.topShortageSkill.split(" ")[0]}` : ""}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {forecast.length > 0 && (
        <div className="card p-4 mb-5">
          <div className="text-sm font-semibold mb-2">Coming demand</div>
          {forecast.map((f) => (
            <div
              key={f.skillCategory}
              className="text-sm text-[var(--muted)] py-1.5 border-b border-[var(--line)] last:border-0"
            >
              {f.headline || f.skillCategory}
            </div>
          ))}
        </div>
      )}

      {err && <p className="text-sm text-[var(--red)] mb-3">{err}</p>}

      <h2 className="font-display text-lg m-0 mb-3">My Active Needs</h2>
      <div className="space-y-4">
        {active.length === 0 && (
          <div className="card p-5 text-sm text-[var(--muted)]">No active needs yet — post one above.</div>
        )}
        {active.map((n) => {
          const open = !!expanded[n.id];
          const bids = n.bids || [];
          return (
            <div key={n.id} className="card p-4">
              <div className="flex justify-between items-center gap-2 mb-2">
                <span className="pill">{n.skillCategory.split(" ")[0]}</span>
                <span className="text-xs text-[var(--muted)]">{timeAgo(n.createdAt)}</span>
              </div>
              <Link to={`/needs/${n.id}`} className="no-underline text-inherit">
                <h3 className="font-display text-base m-0 mb-1 leading-snug">
                  {n.description.slice(0, 60)}
                  {n.description.length > 60 ? "…" : ""}
                </h3>
                <p className="text-sm text-[var(--muted)] mt-0 mb-3 line-clamp-2">{n.description}</p>
              </Link>

              {n.status === "open" && (
                <div className="rounded-xl bg-[var(--blue-soft)] p-3">
                  <button
                    type="button"
                    className="w-full flex justify-between items-center bg-transparent border-0 p-0 cursor-pointer font-semibold text-sm text-[var(--navy)]"
                    onClick={() => setExpanded((e) => ({ ...e, [n.id]: !open }))}
                  >
                    {bids.length || n.bidCount || 0} local bids received
                    {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {open && (
                    <div className="space-y-2.5 mt-3">
                      {bids.length === 0 && (
                        <p className="text-xs text-[var(--muted)] m-0">Waiting for workers…</p>
                      )}
                      {bids.map((b) => (
                        <div key={b.id} className="bg-white rounded-xl p-3">
                          <div className="flex gap-2.5 items-start">
                            <div className="chat-avatar">{initials(b.worker?.name)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm">{b.worker?.name}</div>
                              <div className="text-xs text-[var(--muted)]">
                                <Stars value={b.worker?.rating} /> ({b.worker?.completedJobs || 0} jobs)
                              </div>
                              <div className="font-extrabold text-[var(--navy)] mt-1">
                                Rs. {b.priceRs.toLocaleString()}
                              </div>
                              <div className="text-xs text-[var(--muted)]">
                                Ready in {b.timelineDays} day(s)
                              </div>
                            </div>
                          </div>
                          {b.status === "pending" && (
                            <button
                              type="button"
                              className="btn btn-outline-teal w-full mt-2.5 text-sm py-2"
                              disabled={busy}
                              onClick={() => accept(b.id)}
                            >
                              Accept Bid
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {n.status === "matched" && (
                <div className="flex flex-col gap-2 mt-1">
                  <Link className="btn btn-primary w-full text-sm" to={`/needs/${n.id}/chat`}>
                    Open safe chat
                  </Link>
                  {!n.jobDone ? (
                    <button
                      type="button"
                      className="btn btn-outline-teal w-full text-sm"
                      disabled={busy}
                      onClick={() => confirmDone(n.id)}
                    >
                      Confirm job done
                    </button>
                  ) : (
                    <Link className="btn btn-ghost w-full text-sm" to={`/needs/${n.id}`}>
                      Rate the worker →
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
