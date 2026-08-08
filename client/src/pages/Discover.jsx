import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Search } from "lucide-react";
import { api, SKILLS, SKILL_EMOJI } from "../api";
import { useAuth } from "../auth";
import { Shell, Stars, TrustRing } from "../components";

export default function Discover() {
  const { user, ready, isResident } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [zone, setZone] = useState("");
  const [skill, setSkill] = useState("");
  const [minTrust, setMinTrust] = useState(0);
  const [search, setSearch] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) return;
    api.favorites().then(setFavorites).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = new URLSearchParams({ active: "true" });
    if (zone) q.set("zone", zone);
    if (skill) q.set("skill", skill);
    if (minTrust) q.set("minTrust", String(minTrust));
    if (search.trim()) q.set("search", search.trim());
    api
      .workers(`?${q.toString()}`)
      .then(setWorkers)
      .catch((e) => setErr(e.message));
  }, [user, zone, skill, minTrust, search]);

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isResident) return <Navigate to="/app" replace />;

  return (
    <Shell title="Discover hunar" backTo="/app">
      <p className="text-sm text-[var(--muted)] mt-0 mb-4">
        Browse nearby workers by zone, skill, and trust — inspired by hyperlocal discovery.
      </p>

      {favorites.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">Saved</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {favorites.map((w) => (
              <Link
                key={w.id}
                to={`/workers/${w.id}`}
                className="card px-3 py-2 no-underline text-inherit shrink-0 min-w-[140px]"
              >
                <div className="font-semibold text-sm">{w.name}</div>
                <div className="text-[11px] text-[var(--muted)]">{w.skillCategory.split(" ")[0]}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="card p-3.5 mb-4 space-y-2.5">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            className="!pl-9"
            placeholder="Search name or skill"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select value={zone} onChange={(e) => setZone(e.target.value)}>
            <option value="">All zones</option>
            <option value="Z1">Gali 1–2</option>
            <option value="Z2">Gali 3–4</option>
            <option value="Z3">Gali 5–7</option>
            <option value="Z4">Gali 8–9</option>
            <option value="Z5">Main Market</option>
            <option value="Z6">Back Streets</option>
          </select>
          <select value={skill} onChange={(e) => setSkill(e.target.value)}>
            <option value="">All skills</option>
            {SKILLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Min trust: {minTrust}</label>
          <input
            type="range"
            min={0}
            max={80}
            step={5}
            value={minTrust}
            onChange={(e) => setMinTrust(Number(e.target.value))}
          />
        </div>
      </div>

      {err && <p className="text-sm text-[var(--red)]">{err}</p>}

      <div className="text-xs text-[var(--muted)] mb-2">{workers.length} matches</div>
      <div className="space-y-2.5">
        {workers.map((w) => (
          <Link key={w.id} to={`/workers/${w.id}`} className="card p-4 flex gap-3 no-underline text-inherit">
            <TrustRing score={w.trustScore || 0} />
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{w.name}</div>
              <div className="text-xs text-[var(--muted)] mt-0.5">
                {SKILL_EMOJI[w.skillCategory]} {w.skillCategory} · {w.zone?.displayName || w.zoneId}
              </div>
              <div className="text-xs mt-1">
                <Stars value={w.rating} /> · {w.completedJobs} jobs
              </div>
              {w.bio && <p className="text-xs text-[var(--muted)] mt-1 mb-0 line-clamp-2">{w.bio}</p>}
            </div>
          </Link>
        ))}
        {workers.length === 0 && (
          <div className="card p-4 text-sm text-[var(--muted)]">No workers match these filters.</div>
        )}
      </div>
    </Shell>
  );
}
