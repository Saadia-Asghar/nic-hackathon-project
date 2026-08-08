import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Share2, ChevronDown, ChevronUp } from "lucide-react";
import { api, whatsappShareUrl } from "../api";
import { useAuth } from "../auth";
import { GapBadge, Shell, Stars, timeAgo, initials } from "../components";

export default function ResidentDashboard() {
  const { user } = useAuth();
  const [needs, setNeeds] = useState([]);
  const [alert, setAlert] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const [n, a] = await Promise.all([api.residentNeeds(user.id), api.alerts()]);
    setNeeds(n);
    setAlert(a[0] || null);
    const firstOpen = n.find((x) => x.status === "open" && (x.bids?.length || x.bidCount));
    if (firstOpen) setExpanded({ [firstOpen.id]: true });
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, [user.id]);

  async function accept(bidId) {
    try {
      setBusy(true);
      await api.acceptBid(bidId);
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const active = needs.filter((n) => n.status !== "completed");

  return (
    <Shell>
      <div className="pt-3 pb-2">
        <h1 className="font-display text-[1.75rem] m-0 leading-tight">
          Salam, {user.name.split(" ")[0]}!
        </h1>
        <p className="text-[var(--muted)] mt-1.5 mb-5 text-[0.95rem]">
          What local skill do you need today?
        </p>
      </div>

      <Link to="/needs/new" className="cta-post mb-7">
        <span className="cta-post-icon">
          <Plus size={22} strokeWidth={2.5} />
        </span>
        + Post a Skill Need
      </Link>

      {alert && (
        <div className={`card p-4 mb-5 border gap-${alert.gapLevel}`}>
          <div className="flex justify-between items-center gap-2">
            <div className="text-xs font-bold uppercase tracking-wide opacity-70">AI Alert</div>
            <GapBadge level={alert.gapLevel} />
          </div>
          <p className="text-sm mt-2 mb-3 leading-snug">{alert.reasoning}</p>
          {alert.whatsappNotice && (
            <a
              className="btn btn-accent w-full text-xs"
              href={whatsappShareUrl(alert.whatsappNotice)}
              target="_blank"
              rel="noreferrer"
            >
              <Share2 size={14} /> Share on WhatsApp
            </a>
          )}
        </div>
      )}

      {err && <p className="text-sm text-[var(--red)] mb-3">{err}</p>}

      <h2 className="font-display text-lg m-0 mb-3">My Active Needs</h2>
      <div className="space-y-4">
        {active.length === 0 && (
          <div className="card p-5 text-sm text-[var(--muted)]">No active needs yet — post one above.</div>
        )}
        {active.map((n) => {
          const open = !!expanded[n.id];
          const bids = n.bids || [];
          return (
            <div key={n.id} className="card p-4">
              <div className="flex justify-between items-center gap-2 mb-2">
                <span className="pill">{n.skillCategory.split(" ")[0]}</span>
                <span className="text-xs text-[var(--muted)]">{timeAgo(n.createdAt)}</span>
              </div>
              <Link to={`/needs/${n.id}`} className="no-underline text-inherit">
                <h3 className="font-display text-base m-0 mb-1 leading-snug">
                  {n.description.slice(0, 60)}
                  {n.description.length > 60 ? "…" : ""}
                </h3>
                <p className="text-sm text-[var(--muted)] mt-0 mb-3 line-clamp-2">{n.description}</p>
              </Link>

              {n.status === "open" && (
                <div className="rounded-xl bg-[var(--blue-soft)] p-3">
                  <button
                    type="button"
                    className="w-full flex justify-between items-center bg-transparent border-0 p-0 cursor-pointer font-semibold text-sm text-[var(--navy)]"
                    onClick={() => setExpanded((e) => ({ ...e, [n.id]: !open }))}
                  >
                    {bids.length || n.bidCount || 0} local bids received
                    {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {open && (
                    <div className="space-y-2.5 mt-3">
                      {bids.length === 0 && (
                        <p className="text-xs text-[var(--muted)] m-0">Waiting for workers…</p>
                      )}
                      {bids.map((b) => (
                        <div key={b.id} className="bg-white rounded-xl p-3">
                          <div className="flex gap-2.5 items-start">
                            <div className="chat-avatar">{initials(b.worker?.name)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm">{b.worker?.name}</div>
                              <div className="text-xs text-[var(--muted)]">
                                <Stars value={b.worker?.rating} /> ({b.worker?.completedJobs || 0} jobs)
                              </div>
                              <div className="font-extrabold text-[var(--navy)] mt-1">
                                Rs. {b.priceRs.toLocaleString()}
                              </div>
                              <div className="text-xs text-[var(--muted)]">
                                Ready in {b.timelineDays} day(s)
                              </div>
                            </div>
                          </div>
                          {b.status === "pending" && (
                            <button
                              type="button"
                              className="btn btn-outline-teal w-full mt-2.5 text-sm py-2"
                              disabled={busy}
                              onClick={() => accept(b.id)}
                            >
                              Accept Bid
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {["matched", "completed"].includes(n.status) && (
                <Link className="btn btn-primary w-full mt-1 text-sm" to={`/needs/${n.id}/chat`}>
                  Open safe chat
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
