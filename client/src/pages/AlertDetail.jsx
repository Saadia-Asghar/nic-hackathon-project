import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Copy, Share2 } from "lucide-react";
import { api, SKILL_EMOJI, whatsappShareUrl } from "../api";
import { useAuth } from "../auth";
import { GapBadge, Shell } from "../components";

export default function AlertDetail() {
  const { id } = useParams();
  const { user, ready } = useAuth();
  const [alert, setAlert] = useState(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

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

  async function copyNotice() {
    if (!alert.whatsappNotice) return;
    try {
      await navigator.clipboard.writeText(alert.whatsappNotice);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErr("Could not copy — select the text manually");
    }
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
        {alert.confidenceWhy && (
          <p className="text-xs text-[var(--muted)] mt-3 mb-0">Confidence: {alert.confidenceWhy}</p>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <Link className="btn btn-ghost flex-1 text-xs" to={`/zones/${alert.zoneId}`}>
          Open zone
        </Link>
        <Link className="btn btn-ghost flex-1 text-xs" to="/signup">
          Invite worker
        </Link>
      </div>

      {alert.whatsappNotice && (
        <div className="card p-4">
          <pre className="whitespace-pre-wrap text-sm font-[inherit] m-0 mb-3 bg-[var(--bg)] p-3 rounded-2xl">
            {alert.whatsappNotice}
          </pre>
          <a
            className="btn btn-accent w-full mb-2"
            href={whatsappShareUrl(alert.whatsappNotice)}
            target="_blank"
            rel="noreferrer"
          >
            <Share2 size={14} /> Share on WhatsApp
          </a>
          <button type="button" className="btn btn-ghost w-full text-sm" onClick={copyNotice}>
            <Copy size={14} /> {copied ? "Copied!" : "Copy notice text"}
          </button>
        </div>
      )}

      {!alert.whatsappNotice && alert.gapLevel !== "red" && (
        <p className="text-xs text-[var(--muted)]">
          Community WhatsApp notice drafts when the gap hits red.
        </p>
      )}
    </Shell>
  );
}
