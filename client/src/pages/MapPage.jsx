import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { api } from "../api";
import { useAuth } from "../auth";
import { Shell, GapBadge } from "../components";
import "leaflet/dist/leaflet.css";

// Fix default marker assets under Vite (we use CircleMarker mostly)
delete L.Icon.Default.prototype._getIconUrl;

const GAP_COLOR = {
  green: "#42744d",
  yellow: "#c9891a",
  red: "#c23b4b",
};

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points?.length) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds.pad(0.2));
  }, [map, points]);
  return null;
}

export default function MapPage() {
  const { user, ready } = useAuth();
  const [data, setData] = useState(null);
  const [layer, setLayer] = useState("all");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) return;
    api
      .map()
      .then(setData)
      .catch((e) => setErr(e.message));
  }, [user]);

  const points = useMemo(() => {
    if (!data) return [];
    const list = [];
    if (layer === "all" || layer === "zones") {
      for (const z of data.zones) list.push({ lat: z.lat, lng: z.lng });
    }
    if (layer === "all" || layer === "workers") {
      for (const w of data.workers) list.push({ lat: w.lat, lng: w.lng });
    }
    if (layer === "all" || layer === "needs") {
      for (const n of data.needs) list.push({ lat: n.lat, lng: n.lng });
    }
    return list;
  }, [data, layer]);

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;

  const center = data?.center || { lat: 31.4805, lng: 74.3405 };

  return (
    <Shell title="Mohalla map" backTo="/app">
      <p className="text-sm text-[var(--muted)] mt-0 mb-3">
        Live OpenStreetMap of Model Town demo zones — shortages, workers, and open needs.
      </p>

      <div className="flex gap-2 mb-3 flex-wrap">
        {[
          ["all", "All"],
          ["zones", "Zones"],
          ["workers", "Workers"],
          ["needs", "Needs"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`btn text-xs py-1.5 px-3 ${layer === id ? "" : "btn-ghost"}`}
            onClick={() => setLayer(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {err && <p className="text-sm text-[var(--red)]">{err}</p>}

      <div className="map-frame mb-4 overflow-hidden rounded-2xl border border-[var(--line)] shadow-[0_8px_28px_rgba(158,107,122,0.1)]">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={15}
          scrollWheelZoom
          style={{ height: "420px", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {data && <FitBounds points={points} />}

          {data &&
            (layer === "all" || layer === "zones") &&
            data.zones.map((z) => (
              <CircleMarker
                key={`z-${z.id}`}
                center={[z.lat, z.lng]}
                radius={18}
                pathOptions={{
                  color: GAP_COLOR[z.gapLevel] || GAP_COLOR.green,
                  fillColor: GAP_COLOR[z.gapLevel] || GAP_COLOR.green,
                  fillOpacity: 0.35,
                  weight: 2,
                }}
              >
                <Popup>
                  <strong>{z.displayName}</strong>
                  <div className="text-xs mt-1">{z.urduName}</div>
                  <div className="mt-1">
                    <GapBadge level={z.gapLevel} />
                  </div>
                  <div className="text-xs mt-1">{z.openNeeds} open needs</div>
                  <Link to={`/zones/${z.id}`} className="text-xs font-semibold">
                    Open zone →
                  </Link>
                </Popup>
              </CircleMarker>
            ))}

          {data &&
            (layer === "all" || layer === "workers") &&
            data.workers.map((w) => (
              <CircleMarker
                key={`w-${w.id}`}
                center={[w.lat, w.lng]}
                radius={8}
                pathOptions={{ color: "#bc486e", fillColor: "#d4537e", fillOpacity: 0.9, weight: 1 }}
              >
                <Popup>
                  <strong>{w.name}</strong>
                  <div className="text-xs">{w.skillCategory}</div>
                  <div className="text-xs">★ {w.rating || "—"} · {w.zoneId}</div>
                  <Link to={`/workers/${w.id}`} className="text-xs font-semibold">
                    Profile →
                  </Link>
                </Popup>
              </CircleMarker>
            ))}

          {data &&
            (layer === "all" || layer === "needs") &&
            data.needs.map((n) => (
              <CircleMarker
                key={`n-${n.id}`}
                center={[n.lat, n.lng]}
                radius={7}
                pathOptions={{ color: "#9a7147", fillColor: "#c49a6c", fillOpacity: 0.85, weight: 1 }}
              >
                <Popup>
                  <strong>{n.skillCategory}</strong>
                  <div className="text-xs">{n.description}</div>
                  <Link to={`/needs/${n.id}`} className="text-xs font-semibold">
                    View need →
                  </Link>
                </Popup>
              </CircleMarker>
            ))}
        </MapContainer>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px] text-[var(--muted)] mb-8">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#42744d]/span> Zone gap
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#d4537e]" /> Worker
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#c49a6c]" /> Open need
        </div>
      </div>
    </Shell>
  );
}
