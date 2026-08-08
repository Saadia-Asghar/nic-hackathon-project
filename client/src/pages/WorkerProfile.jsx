import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Heart } from "lucide-react";
import { api, SKILL_EMOJI } from "../api";
import { useAuth } from "../auth";
import { Shell, Stars, TrustRing } from "../components";

export default function WorkerProfile() {
  const { id } = useParams();
  const { user, ready, isResident, refresh } = useAuth();
  const [worker, setWorker] = useState(null);
  const [favBusy, setFavBusy] = useState(false);

  useEffect(() => {
    api.worker(id).then(setWorker).catch(console.error);
  }, [id]);

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (!worker) {
    return (
      <Shell title="Worker" backTo="/discover">
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      </Shell>
    );
  }

  const isFav = (user.favorites || []).includes(worker.id);

  async function toggleFavorite() {
    setFavBusy(true);
    try {
      if (isFav) await api.removeFavorite(worker.id);
      else await api.addFavorite(worker.id);
      await refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setFavBusy(false);
    }
  }

  return (
    <Shell title={worker.name} backTo={user.role === "resident" ? "/discover" : "/app"}>
      <div className="card p-4 mb-3">
        <div className="flex gap-3 items-start">
          <TrustRing score={worker.trustScore || 0} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold">
              {SKILL_EMOJI[worker.skillCategory]} {worker.skillCategory}
            </div>
            <div className="text-sm text-[var(--muted)] mt-1">
              {worker.zone?.displayName || worker.zoneId} · {worker.availability}
            </div>
            <div className="mt-2 text-sm">
              <Stars value={worker.rating} /> · {worker.completedJobs} jobs · Trust {worker.trustScore}/100
            </div>
          </div>
          {isResident && (
            <button
              type="button"
              className={`btn text-xs py-2 px-2.5 ${isFav ? "btn-primary" : "btn-ghost"}`}
              disabled={favBusy}
              onClick={toggleFavorite}
              title={isFav ? "Remove favorite" : "Save favorite"}
            >
              <Heart size={14} fill={isFav ? "currentColor" : "none"} />
            </button>
          )}
        </div>
        {worker.bio && <p className="text-sm mt-3 mb-0 leading-relaxed">{worker.bio}</p>}
      </div>

      <div className="card p-4 mb-3">
        <div className="text-sm font-semibold mb-2">Trust breakdown</div>
        <div className="space-y-1.5">
          {(worker.trustBreakdown || []).map((b) => (
            <div key={b.label} className="flex justify-between text-xs text-[var(--muted)]">
              <span>{b.label}</span>
              <span className="font-semibold text-[var(--ink)]">+{b.points}</span>
            </div>
          ))}
          {(!worker.trustBreakdown || worker.trustBreakdown.length === 0) && (
            <p className="text-xs text-[var(--muted)] m-0">Complete profile and jobs to raise trust.</p>
          )}
        </div>
      </div>

      <div className="card p-4">
        <div className="text-sm font-semibold mb-2">Recent reviews</div>
        {(worker.reviews || []).length === 0 && (
          <p className="text-xs text-[var(--muted)] m-0">No reviews yet.</p>
        )}
        {(worker.reviews || []).map((r) => (
          <div key={r.id} className="py-2 border-b border-[var(--line)] last:border-0">
            <Stars value={r.stars} />
            {r.comment && <p className="text-xs text-[var(--muted)] mt-1 mb-0">{r.comment}</p>}
          </div>
        ))}
      </div>
    </Shell>
  );
}
