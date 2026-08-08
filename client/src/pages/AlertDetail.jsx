import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { api, SKILL_EMOJI, whatsappShareUrl } from "../api";
import { useAuth } from "../auth";
import { GapBadge, Shell } from "../components";

export default function AlertDetail() {
  const { id } = useParams();
  const { user, ready } = useAuth();
  const [alert, setAlert] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.alert(id).then(setAlert).catch((e) => setErr(e.message));
  }, [id]);

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (!alert) {
    return (
      <Shell title="Alert" backTo="/app">
        <p className="text-sm text-[var(--muted)]">{err || "Loading…"}</p>
      </Shell>
    );
  }

  return (
    <Shell title="Shortage alert" backTo="/app">
      <div className={`card p-4 mb-3 border gap-${alert.gapLevel}`}>
        <div className="font-display text-lg">
          {SKILL_EMOJI[alert.skillCategory]} {alert.skillCategory}
        </div>
        <div className="text-sm text-[var(--muted)]">{alert.zone?.displayName}</div>
        <div className="mt-2">
          <GapBadge level={alert.gapLevel} />
        </div>
      </div>

      <div className="card p-4 mb-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Why</div>
        <p className="text-sm leading-relaxed mt-2 mb-2">{alert.reasoning}</p>
        <div className="text-sm">Next: {alert.action}</div>
      </div>

      {alert.whatsappNotice && (
        <div className="card p-4">
          <pre className="whitespace-pre-wrap text-sm font-[inherit] m-0 mb-3 bg-[#f4f5f3] p-3 rounded-2xl">
            {alert.whatsappNotice}
          </pre>
          <a className="btn btn-accent w-full" href={whatsappShareUrl(alert.whatsappNotice)} target="_blank" rel="noreferrer">
            Share on WhatsApp
          </a>
        </div>
      )}
    </Shell>
  );
}
