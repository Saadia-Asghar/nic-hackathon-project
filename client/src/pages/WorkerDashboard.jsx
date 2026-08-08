import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Share2 } from "lucide-react";
import { api, SKILL_EMOJI, whatsappShareUrl } from "../api";
import { useAuth } from "../auth";
import { Shell, Stars, UrgencyBadge } from "../components";

export default function WorkerDashboard() {
  const { user } = useAuth();
  const workerId = user.workerId;
  const [worker, setWorker] = useState(null);
  const [openNeeds, setOpenNeeds] = useState([]);
  const [stats, setStats] = useState(null);
  const [nearby, setNearby] = useState([]);
  const [err, setErr] = useState("");
  const [onlyUnbid, setOnlyUnbid] = useState(true);

  async function load() {
    if (!workerId) {
      setErr("Worker profile missing. Sign up again as worker.");
      return;
    }
    const [w, n, s, d] = await Promise.all([
      api.worker(workerId),
      api.openNeedsForWorker(workerId),
      api.workerStats(workerId),
      api.demandNearby(workerId),
    ]);
    setWorker(w);
    setOpenNeeds(n);
    setStats(s);
    setNearby(d);
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, [workerId]);

  if (!worker && !err) {
    return (
      <Shell title="Jobs">
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      </Shell>
    );
  }

  const pending = (worker?.bids || []).filter((b) => b.status === "pending");
  const bidIds = new Set(stats?.bidNeedIds || []);
  const visible = onlyUnbid ? openNeeds.filter((n) => !bidIds.has(n.id)) : openNeeds;

  return (
    <Shell title={`Hi, ${user.name.split(" ")[0]}`}>
      {worker && (
        <div className="card p-4 mb-4">
          <div className="font-semibold text-sm">
            {SKILL_EMOJI[worker.skillCategory]} {worker.skillCategory}
          </div>
          <div className="text-sm text-[var(--muted)] mt-1">
            {worker.zone?.displayName || worker.zoneId} · <Stars value={worker.rating} /> · Trust{" "}
            {worker.trustScore ?? "—"}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] px-3 py-2.5">
            <div>
              <div className="text-sm font-semibold">Available this week</div>
              <div className="text-[11px] text-[var(--muted)]">Off = not counted in gap supply</div>
            </div>
            <button
              type="button"
              className={`btn text-xs py-2 px-3 ${stats?.availableThisWeek !== false ? "btn-primary" : "btn-ghost"}`}
              onClick={async () => {
                await api.setAvailability(workerId, !(stats?.availableThisWeek !== false));
                await load();
              }}
            >
              {stats?.availableThisWeek !== false ? "On" : "Off"}
            </button>
          </div>
          <Link className="btn btn-ghost w-full mt-3 text-xs" to={`/workers/${worker.id}`}>
            View trust profile
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="card p-4">
          <div className="text-xl font-semibold">Rs. {(stats?.earningsRs || 0).toLocaleString()}</div>
          <div className="text-xs text-[var(--muted)]">Earned (completed)</div>
        </div>
        <div className="card p-4">
          <div className="text-xl font-semibold">{stats?.completedJobs || 0}</div>
          <div className="text-xs text-[var(--muted)]">Completed jobs</div>
        </div>
      </div>

      {nearby[0] && (
        <div className={`card p-4 mb-4 border gap-red`}>
          <div className="text-xs font-semibold uppercase tracking-wide opacity-70">Nearby demand</div>
          <p className="text-sm mt-2 mb-3">
            High {nearby[0].skillCategory} demand in {nearby[0].zone?.displayName}. Bid if you can take work.
          </p>
          {nearby[0].workerNotice && (
            <a
              className="btn btn-accent w-full text-xs"
              href={whatsappShareUrl(nearby[0].workerNotice)}
              target="_blank"
              rel="noreferrer"
            >
              <Share2 size={14} /> Share / ping
            </a>
          )}
        </div>
      )}

      {err && <p className="text-sm text-[var(--red)] mb-3">{err}</p>}

      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-lg m-0">Jobs near you</h2>
        <button
          type="button"
          className="text-xs font-semibold text-[var(--rose)]"
          onClick={() => setOnlyUnbid((v) => !v)}
        >
          {onlyUnbid ? "Show all" : "Not bid yet"}
        </button>
      </div>
      <div className="space-y-2.5 mb-5">
        {visible.length === 0 && (
          <div className="card p-4 text-sm text-[var(--muted)]">
            {onlyUnbid ? "No new needs to bid on." : "No open needs nearby."}
          </div>
        )}
        {visible.map((n) => (
          <div key={n.id} className="card p-4">
            <div className="flex justify-between gap-2 items-start">
              <div className="font-semibold text-sm">{n.zone?.displayName}</div>
              <UrgencyBadge urgency={n.urgency} />
            </div>
            <p className="text-sm text-[var(--muted)] my-1 line-clamp-2">{n.description}</p>
            <div className="text-xs text-[var(--muted)] mb-3">
              Rs.{n.budgetRange} · {n.bidCount} bids
              {bidIds.has(n.id) ? " · you bid" : ""}
            </div>
            {!bidIds.has(n.id) && (
              <Link className="btn btn-primary w-full" to={`/needs/${n.id}/bid`}>
                Bid
              </Link>
            )}
            {bidIds.has(n.id) && (
              <Link className="btn btn-ghost w-full" to={`/needs/${n.id}`}>
                View need
              </Link>
            )}
          </div>
        ))}
      </div>

      <h2 className="font-display text-lg m-0 mb-2">My bids ({pending.length}/3)</h2>
      <div className="space-y-2">
        {pending.length === 0 && (
          <div className="card p-4 text-sm text-[var(--muted)]">No active bids.</div>
        )}
        {pending.map((b) => (
          <Link key={b.id} to={`/needs/${b.needId}`} className="card p-3 block no-underline text-inherit text-sm">
            Rs.{b.priceRs} · {b.timelineDays} days · Pending
          </Link>
        ))}
      </div>
    </Shell>
  );
}
