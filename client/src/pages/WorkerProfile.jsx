import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  BadgeCheck,
  Heart,
  MapPin,
  Megaphone,
  MessageCircle,
  Star,
} from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import { Shell, Stars, initials, mohallaLabel } from "../components";

const TONE = {
  maroon: "linear-gradient(145deg, #7a1f3d 0%, #c45a6a 55%, #e8b4bc 100%)",
  teal: "linear-gradient(145deg, #0d5c56 0%, #26a69a 55%, #b2dfdb 100%)",
  navy: "linear-gradient(145deg, #1a237e 0%, #3949ab 55%, #c5cae9 100%)",
};

export default function WorkerProfile() {
  const { id } = useParams();
  const { user, ready, isResident, refresh } = useAuth();
  const [worker, setWorker] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  useEffect(() => {
    api.worker(id).then(setWorker).catch(console.error);
  }, [id]);

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (!worker) {
    return (
      <Shell title="Worker" backTo={isResident ? "/discover" : "/app"}>
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      </Shell>
    );
  }

  const isFav = (user.favorites || []).includes(worker.id);
  const zoneLabel = worker.zone?.displayName || mohallaLabel(worker.zoneId);
  const reviews = worker.reviews || [];
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 2);
  const topRated = (worker.rating || 0) >= 4.5 || (worker.trustScore || 0) >= 70;

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
    <Shell title={`Ustaad ${worker.name}`} backTo={isResident ? "/discover" : "/app"}>
      <div className="flex flex-col items-center text-center pt-2 mb-5 relative">
        {isResident && (
          <button
            type="button"
            className={`absolute right-0 top-0 btn text-xs py-2 px-2.5 ${isFav ? "btn-primary" : "btn-ghost"}`}
            disabled={favBusy}
            onClick={toggleFavorite}
            title={isFav ? "Remove favorite" : "Save favorite"}
          >
            <Heart size={14} fill={isFav ? "currentColor" : "none"} />
          </button>
        )}

        <div className="relative mb-3">
          <div
            className="w-28 h-28 rounded-full grid place-items-center text-3xl font-extrabold text-[var(--navy)] border-4 border-white shadow-md"
            style={{ background: "var(--blue-soft)" }}
          >
            {worker.name.slice(0, 1)}
          </div>
          {worker.verified && (
            <span className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-[var(--teal)] text-white grid place-items-center border-2 border-white">
              <BadgeCheck size={14} />
            </span>
          )}
        </div>

        <h1 className="font-display text-[1.55rem] m-0 leading-tight">Ustaad {worker.name}</h1>
        <p className="text-sm text-[var(--muted)] mt-1 mb-3">
          {worker.title || "Skilled Worker"} · {zoneLabel}
        </p>

        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {(worker.tags || []).map((t) => (
            <span key={t} className="pill">
              {t}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2.5 w-full text-left">
          <div className="card p-3.5">
            <div className="flex items-center gap-1.5 font-extrabold text-[1.35rem] text-[var(--navy)]">
              <Star size={16} className="text-[#f9a825]" fill="#f9a825" />
              {worker.rating || "—"}
            </div>
            <div className="text-xs text-[var(--muted)] mt-1">
              {worker.reviewCount || 0} Reviews
            </div>
          </div>
          <div className="card p-3.5">
            <div className="flex items-center gap-1.5 font-extrabold text-[var(--navy)] text-sm leading-tight">
              <BadgeCheck size={16} className="text-[var(--teal)]" />
              {topRated ? "Top Rated" : `Trust ${worker.trustScore || 0}`}
            </div>
            <div className="text-xs text-[var(--muted)] mt-1.5 flex items-center gap-1">
              <MapPin size={12} /> {zoneLabel}
            </div>
          </div>
        </div>
      </div>

      {(worker.portfolio || []).length > 0 && (
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-display text-lg m-0">Recent Work</h2>
            <span className="text-xs font-semibold text-[var(--navy)]">See All</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {worker.portfolio.map((p) => (
              <div
                key={p.title}
                className="relative h-36 rounded-2xl overflow-hidden shadow-sm"
                style={{ background: TONE[p.tone] || TONE.navy }}
              >
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,white,transparent_45%)]" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white font-bold text-sm drop-shadow">
                  {p.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="font-display text-lg m-0 mb-2">Services & Pricing</h2>
      <div className="card mb-5 overflow-hidden">
        {(worker.services || []).map((s, i) => (
          <div
            key={s.name}
            className={`px-4 py-3.5 flex justify-between gap-3 items-start ${
              i > 0 ? "border-t border-[var(--line)]" : ""
            }`}
          >
            <div className="min-w-0">
              <div className="font-bold text-sm text-[var(--navy)]">{s.name}</div>
              <div className="text-xs text-[var(--muted)] mt-0.5">{s.detail}</div>
            </div>
            <div className="font-extrabold text-sm text-[var(--navy)] whitespace-nowrap">{s.price}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-2">
        <h2 className="font-display text-lg m-0">What Neighbors Say</h2>
        <span className="text-sm font-semibold text-[var(--navy)] inline-flex items-center gap-1">
          <Star size={13} className="text-[#f9a825]" fill="#f9a825" /> {worker.rating || "—"}
        </span>
      </div>

      <div className="space-y-2.5 mb-3">
        {visibleReviews.length === 0 && (
          <div className="card p-4 text-sm text-[var(--muted)]">No reviews yet — be the first after a job.</div>
        )}
        {visibleReviews.map((r) => (
          <div key={r.id} className="card p-3.5">
            <div className="flex gap-2.5 items-start">
              <div className="chat-avatar">{initials(r.reviewerName || "N")}</div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm">
                  {r.reviewerName || "Neighbor"}
                  {r.reviewerZone ? (
                    <span className="font-normal text-[var(--muted)]"> · {r.reviewerZone}</span>
                  ) : null}
                </div>
                <div className="mt-0.5">
                  <Stars value={r.stars} />
                </div>
                {r.comment && (
                  <p className="text-sm text-[var(--muted)] italic mt-2 mb-0 leading-relaxed">
                    “{r.comment}”
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {reviews.length > 2 && (
        <button
          type="button"
          className="btn btn-outline-teal w-full mb-5 text-sm"
          onClick={() => setShowAllReviews((v) => !v)}
        >
          {showAllReviews ? "Show fewer reviews" : `Read all ${worker.reviewCount || reviews.length} reviews`}
        </button>
      )}

      {worker.bio && (
        <div className="card p-4 mb-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-1">About</div>
          <p className="text-sm m-0 leading-relaxed">{worker.bio}</p>
          <div className="text-xs text-[var(--muted)] mt-2">
            {worker.completedJobs} jobs · {worker.availability} · Trust {worker.trustScore}/100
          </div>
        </div>
      )}

      {isResident && (
        <div className="sticky bottom-[4.75rem] z-10 flex flex-col gap-2 pb-2 bg-[linear-gradient(to_top,var(--bg)_70%,transparent)] pt-3">
          {worker.matchedChatNeedId ? (
            <Link className="btn btn-primary w-full" to={`/needs/${worker.matchedChatNeedId}/chat`}>
              <MessageCircle size={16} /> Send a Message
            </Link>
          ) : (
            <Link className="btn btn-primary w-full" to="/chats">
              <MessageCircle size={16} /> Chat unlocks after match
            </Link>
          )}
          <Link
            className="btn btn-outline-teal w-full"
            to={`/needs/new?skill=${encodeURIComponent(worker.skillCategory)}&for=${encodeURIComponent(worker.name)}`}
          >
            <Megaphone size={16} /> Post a Need for {worker.name}
          </Link>
        </div>
      )}
    </Shell>
  );
}
