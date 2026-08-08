import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Navigation, RefreshCw, Share2, Star } from "lucide-react";
import { api, whatsappShareUrl } from "../api";
import { useAuth } from "../auth";
import { Shell, UrgencyBadge, mohallaLabel } from "../components";

function distKm(a, b) {
  if (!a?.lat || !b?.lat) return null;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)) * 10) / 10;
}

export default function WorkerDashboard() {
  const { user } = useAuth();
  const workerId = user.workerId;
  const [worker, setWorker] = useState(null);
  const [openNeeds, setOpenNeeds] = useState([]);
  const [stats, setStats] = useState(null);
  const [nearby, setNearby] = useState([]);
  const [err, setErr] = useState("");

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
      <Shell>
        <p className="text-sm text-[var(--muted)] pt-6">Loading…</p>
      </Shell>
    );
  }

  const bidIds = new Set(stats?.bidNeedIds || []);
  const pending = (worker?.bids || []).filter((b) => b.status === "pending");
  const visible = openNeeds.filter((n) => !bidIds.has(n.id));
  const rehire = Math.min(99, Math.round(55 + (worker?.rating || 0) * 8 + (worker?.completedJobs || 0)));
  const available = stats?.availableThisWeek !== false;

  return (
    <Shell>
      <div className="flex gap-3 items-center pt-3 mb-5">
        <div
          className="w-16 h-16 rounded-full shrink-0 grid place-items-center text-lg font-extrabold text-[var(--navy)]"
          style={{ background: "var(--blue-soft)" }}
        >
          {(worker?.name || user.name).slice(0, 1)}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-[1.35rem] m-0 leading-tight">
            Salam, Ustaad {user.name.split(" ")[0]}!
          </h1>
          <span className="pill mt-1.5 inline-flex">{worker?.skillCategory || "Worker"}</span>
        </div>
      </div>

      <div className="card p-3.5 mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Available this week</div>
          <div className="text-[11px] text-[var(--muted)]">Off = AI won’t count you in supply</div>
        </div>
        <button
          type="button"
          className={`btn text-xs py-2 px-3 ${available ? "btn-primary" : "btn-ghost"}`}
          onClick={async () => {
            await api.setAvailability(workerId, !available);
            await load();
          }}
        >
          {available ? "On" : "Off"}
        </button>
      </div>

      <div className="grid grid-cols-[1.2fr_1fr] gap-2.5 mb-4">
        <div className="card p-4 flex flex-col justify-center">
          <Star size={18} className="text-[#f9a825] mb-2" fill="#f9a825" />
          <div className="stat-big">{worker?.rating || "—"}</div>
          <div className="text-xs text-[var(--muted)] mt-1">Rating</div>
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="card p-3 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full grid place-items-center bg-[#e8f5e9] text-[var(--green)]">
              <CheckCircle2 size={16} />
            </span>
            <div>
              <div className="font-extrabold text-[var(--navy)] text-lg leading-none">
                {stats?.completedJobs || worker?.completedJobs || 0}
              </div>
              <div className="text-[11px] text-[var(--muted)]">Jobs Done</div>
            </div>
          </div>
          <div className="card p-3 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full grid place-items-center bg-[#fff3e0] text-[var(--yellow)]">
              <RefreshCw size={15} />
            </span>
            <div>
              <div className="font-extrabold text-[var(--navy)] text-lg leading-none">{rehire}%</div>
              <div className="text-[11px] text-[var(--muted)]">Rehire Rate</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-3.5 mb-5 flex justify-between items-center">
        <div>
          <div className="text-sm font-semibold">Active bids</div>
          <div className="text-[11px] text-[var(--muted)]">Max 3 pending at once</div>
        </div>
        <div className="font-extrabold text-[var(--navy)] text-xl">
          {pending.length}/3
        </div>
      </div>

      {nearby[0] && (
        <div className="card p-4 mb-5 border gap-red">
          <div className="text-xs font-bold uppercase tracking-wide opacity-70">Nearby demand</div>
          <p className="text-sm mt-2 mb-3">
            High {nearby[0].skillCategory} demand in {nearby[0].zone?.displayName || nearby[0].zoneId}.
            Bid if you can take work.
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

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg m-0">Available Needs</h2>
        <span className="text-xs font-semibold text-[var(--muted)]">
          {mohallaLabel(worker?.zoneId)} Zone
        </span>
      </div>

      {err && <p className="text-sm text-[var(--red)] mb-3">{err}</p>}

      <div className="space-y-3.5 mb-5">
        {visible.length === 0 && (
          <div className="card p-5 text-sm text-[var(--muted)]">No open needs near you right now.</div>
        )}
        {visible.map((n) => {
          const d = distKm(worker, n);
          const budget =
            n.budgetRange === "open"
              ? "Open"
              : n.budgetRange.includes("+")
                ? `${n.budgetRange.replace("+", "")}+ PKR`
                : `${n.budgetRange.split("-").pop()} PKR`;
          const canBid = pending.length < 3;
          return (
            <div key={n.id} className="card p-4">
              <div className="flex justify-between items-center mb-2">
                <UrgencyBadge urgency={n.urgency} />
                <span className="text-xs font-semibold text-[var(--muted)] inline-flex items-center gap-1">
                  <Navigation size={12} /> {d != null ? `${d} km` : n.zoneId}
                </span>
              </div>
              <h3 className="font-display text-base m-0 mb-1">
                {n.description.split(/[.—]/)[0].slice(0, 40)}
              </h3>
              <p className="text-sm text-[var(--muted)] mt-0 mb-3 line-clamp-2">{n.description}</p>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] text-[var(--muted)]">Budget</div>
                  <div className="font-extrabold text-[var(--navy)]">{budget}</div>
                </div>
                {canBid ? (
                  <Link className="btn btn-primary text-sm py-2.5 px-4" to={`/needs/${n.id}/bid`}>
                    Submit Bid
                  </Link>
                ) : (
                  <span className="text-xs text-[var(--muted)] font-semibold">Bid limit reached</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {pending.length > 0 && (
        <>
          <h2 className="font-display text-lg m-0 mb-2">My pending bids</h2>
          <div className="space-y-2">
            {pending.map((b) => (
              <Link
                key={b.id}
                to={`/needs/${b.needId}`}
                className="card p-3 block no-underline text-inherit text-sm"
              >
                Rs.{b.priceRs} · {b.timelineDays} days · Pending
              </Link>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}
