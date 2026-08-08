import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Search, Star, MapPin, X, User } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import { Shell } from "../components";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;

const GAP_COLOR = {
  green: "#2e7d32",
  yellow: "#ef6c00",
  red: "#c62828",
};

const SKILL_CHIPS = [
  { id: "all", label: "All" },
  { id: "Tailoring & Stitching", label: "Tailors" },
  { id: "Electrical Work", label: "Electricians" },
  { id: "Plumbing", label: "Plumbers" },
  { id: "Baking & Home Food", label: "Bakers" },
  { id: "Home Tutoring", label: "Tutors" },
];

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points?.length) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds.pad(0.25));
    setTimeout(() => map.invalidateSize(), 100);
  }, [map, points]);
  return null;
}

export default function MapPage() {
  const { user, ready } = useAuth();
  const [data, setData] = useState(null);
  const [skill, setSkill] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) return;
    api
      .map()
      .then((d) => {
        setData(d);
        const top = d.workers.find((w) => (w.rating || 0) >= 4.5) || d.workers[0];
        if (top) setSelected({ type: "worker", ...top });
      })
      .catch((e) => setErr(e.message));
  }, [user]);

  const workers = useMemo(() => {
    if (!data) return [];
    return data.workers.filter((w) => {
      if (skill !== "all" && w.skillCategory !== skill) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          w.name.toLowerCase().includes(q) ||
          w.skillCategory.toLowerCase().includes(q) ||
          w.zoneId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data, skill, search]);

  const needs = useMemo(() => {
    if (!data) return [];
    return data.needs.filter((n) => skill === "all" || n.skillCategory === skill);
  }, [data, skill]);

  const points = useMemo(() => {
    if (!data) return [];
    return [
      ...data.zones.map((z) => ({ lat: z.lat, lng: z.lng })),
      ...workers.map((w) => ({ lat: w.lat, lng: w.lng })),
    ];
  }, [data, workers]);

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;

  const center = data?.center || { lat: 31.4805, lng: 74.3405 };

  return (
    <Shell>
      <div className="pt-2 mb-3">
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            className="!pl-10 !rounded-full !bg-white shadow-sm"
            placeholder="Search skills or zones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="chip-row">
          {SKILL_CHIPS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`chip ${skill === c.id ? "active" : ""}`}
              onClick={() => setSkill(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {err && <p className="text-sm text-[var(--red)]">{err}</p>}

      <div className="map-frame mb-3 overflow-hidden rounded-2xl border border-[var(--line)]" style={{ height: 440 }}>
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={15}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {data && <FitBounds points={points} />}

          {data?.zones.map((z) => (
            <CircleMarker
              key={`z-${z.id}`}
              center={[z.lat, z.lng]}
              radius={16}
              pathOptions={{
                color: GAP_COLOR[z.gapLevel] || GAP_COLOR.green,
                fillColor: GAP_COLOR[z.gapLevel] || GAP_COLOR.green,
                fillOpacity: 0.28,
                weight: 2,
              }}
              eventHandlers={{
                click: () => setSelected({ type: "zone", ...z }),
              }}
            >
              <Popup>{z.displayName}</Popup>
            </CircleMarker>
          ))}

          {workers.map((w) => (
            <CircleMarker
              key={`w-${w.id}`}
              center={[w.lat, w.lng]}
              radius={10}
              pathOptions={{ color: "#00897b", fillColor: "#00897b", fillOpacity: 0.95, weight: 1 }}
              eventHandlers={{
                click: () => setSelected({ type: "worker", ...w }),
              }}
            />
          ))}

          {needs.map((n) => (
            <CircleMarker
              key={`n-${n.id}`}
              center={[n.lat, n.lng]}
              radius={8}
              pathOptions={{ color: "#c62828", fillColor: "#ef5350", fillOpacity: 0.9, weight: 1 }}
              eventHandlers={{
                click: () => setSelected({ type: "need", ...n }),
              }}
            />
          ))}
        </MapContainer>

        {selected?.type === "worker" && (
          <div className="map-overlay-card">
            <div className="flex gap-3 items-start">
              <div className="w-12 h-12 rounded-full bg-[var(--blue-soft)] text-[var(--navy)] grid place-items-center shrink-0">
                <User size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-extrabold text-[var(--ink)] leading-tight">
                      {selected.name}&apos;s Shop
                    </div>
                    {(selected.rating || 0) >= 4.5 && (
                      <span className="inline-flex mt-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--teal)] text-white">
                        Top Rated
                      </span>
                    )}
                  </div>
                  <button type="button" className="text-[var(--muted)] p-1" onClick={() => setSelected(null)}>
                    <X size={16} />
                  </button>
                </div>
                <div className="text-sm text-[var(--muted)] mt-1.5 flex items-center gap-1">
                  <Star size={13} className="text-[#f9a825]" fill="#f9a825" />
                  {selected.rating || "—"} · {selected.skillCategory.split(" ")[0]}
                </div>
                <div className="text-sm text-[var(--muted)] mt-0.5 flex items-center gap-1">
                  <MapPin size={13} /> {selected.zoneId}
                </div>
              </div>
            </div>
            <Link className="btn btn-primary w-full mt-3" to={`/workers/${selected.id}`}>
              View Details
            </Link>
          </div>
        )}

        {selected?.type === "need" && (
          <div className="map-overlay-card">
            <div className="flex justify-between gap-2">
              <div>
                <div className="font-extrabold">{selected.skillCategory}</div>
                <p className="text-sm text-[var(--muted)] mt-1 mb-0">{selected.description}</p>
              </div>
              <button type="button" className="text-[var(--muted)] p-1" onClick={() => setSelected(null)}>
                <X size={16} />
              </button>
            </div>
            <Link className="btn btn-primary w-full mt-3" to={`/needs/${selected.id}`}>
              View Need
            </Link>
          </div>
        )}
      </div>
    </Shell>
  );
}
