import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Sparkles } from "lucide-react";
import { api, SKILL_EMOJI, whatsappShareUrl } from "../api";
import { useAuth } from "../auth";
import { GapBadge, Shell, Sparkline, UrgencyBadge } from "../components";
import "leaflet/dist/leaflet.css";

const GAP_COLOR = {
  green: "#2e7d32",
  yellow: "#ef6c00",
  red: "#c62828",
};

export default function ZoneDetail() {
  const { id } = useParams();
  const { user, ready } = useAuth();
  const [zone, setZone] = useState(null);
  const [history, setHistory] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastRun, setLastRun] = useState(null);

  async function load() {
    const [z, h] = await Promise.all([api.zone(id), api.zoneHistory(id)]);
    setZone(z);
    setHistory(h);
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
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
  const gapLevel = top?.gapLevel || "green";
  const hasCoords = zone.lat != null && zone.lng != null;

  async function rerunAgent() {
    if (!top) return;
    setBusy(true);
    setErr("");
    try {
      const result = await api.analyze({ zoneId: zone.id, skillCategory: top.skillCategory });
      setLastRun(result);
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title={zone.displayName} backTo="/app">
      {hasCoords && (
        <div className="map-frame mb-4 overflow-hidden rounded-2xl border border-[var(--line)]">
          <MapContainer
            center={[zone.lat, zone.lng]}
            zoom={16}
            scrollWheelZoom={false}
            style={{ height: "180px", width: "100%" }}
          >
            <TileLayer
              attribution="&copy; OSM"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <CircleMarker
              center={[zone.lat, zone.lng]}
              radius={22}
              pathOptions={{
                color: GAP_COLOR[gapLevel],
                fillColor: GAP_COLOR[gapLevel],
                fillOpacity: 0.35,
                weight: 2,
              }}
            >
              <Popup>
                {zone.displayName} · {gapLevel}
              </Popup>
            </CircleMarker>
          </MapContainer>
          <div className="px-3 py-2 border-t border-[var(--line)] flex justify-between items-center">
            <span className="text-xs text-[var(--muted)]">Live map</span>
            <Link to="/map" className="text-xs font-semibold no-underline text-[var(--navy)]">
              Full mohalla map →
            </Link>
          </div>
        </div>
      )}

      {top && (
        <div className={`card p-4 mb-4 border gap-${top.gapLevel}`}>
          <div className="flex justify-between items-center gap-2">
            <GapBadge level={top.gapLevel} />
            <span className="text-xs font-semibold uppercase text-[var(--muted)]">
              {top.confidence} · {top.agentSource || "heuristic"}
            </span>
          </div>
          <div className="text-sm font-semibold mt-2">
            {SKILL_EMOJI[top.skillCategory]} {top.skillCategory}
          </div>
          <p className="text-sm leading-relaxed mt-2 mb-2">{top.aiReasoning}</p>
          <p className="text-sm m-0 mb-3">
            <strong>Action:</strong> {top.aiAction}
          </p>
          {(top.confidenceWhy || skillHistory[0]?.confidenceWhy) && (
            <p className="text-xs text-[var(--muted)] m-0 mb-3 leading-relaxed">
              Why confidence: {top.confidenceWhy || skillHistory[0]?.confidenceWhy}
            </p>
          )}
          <div className="mb-3">
            <div className="text-[11px] text-[var(--muted)] mb-1">Gap trend (recent analyses)</div>
            <Sparkline history={skillHistory.length ? skillHistory : history.slice(0, 7).reverse()} />
          </div>

          {lastRun?.before && lastRun?.after && (
            <div className="rounded-xl bg-[var(--blue-soft)] p-3 mb-3 text-xs">
              <div className="font-semibold text-[var(--navy)] mb-1">Before → After this scan</div>
              <div>
                {lastRun.before.gapLevel} ({lastRun.before.openNeedsCount} needs /{" "}
                {lastRun.before.registeredWorkersCount} workers) →{" "}
                <strong>{lastRun.after.gapLevel}</strong> ({lastRun.after.openNeedsCount} /{" "}
                {lastRun.after.registeredWorkersCount})
              </div>
            </div>
          )}

          <button type="button" className="btn btn-primary w-full text-sm mb-2" disabled={busy} onClick={rerunAgent}>
            <Sparkles size={15} /> {busy ? "Agent running…" : "Re-run GapDetectionAgent"}
          </button>

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

      {err && <p className="text-sm text-[var(--red)] mb-3">{err}</p>}

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
            {s.aiReasoning && (
              <p className="text-xs text-[var(--muted)] mt-2 mb-0 line-clamp-2">{s.aiReasoning}</p>
            )}
          </div>
        ))}
      </div>

      <h2 className="font-display text-lg mb-2">Open needs</h2>
      <div className="space-y-2 mb-8">
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
