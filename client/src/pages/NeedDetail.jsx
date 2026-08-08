import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { api, SKILL_EMOJI } from "../api";
import { useAuth } from "../auth";
import { Shell, Stars, UrgencyBadge } from "../components";

export default function NeedDetail() {
  const { id } = useParams();
  const { user, ready, isResident, isWorker } = useAuth();
  const [need, setNeed] = useState(null);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setNeed(await api.need(id));
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, [id]);

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;

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

  async function confirmDone() {
    try {
      setBusy(true);
      await api.confirmDone(need.id);
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function rate() {
    try {
      setBusy(true);
      const bid = need.bids.find((b) => b.status === "accepted");
      await api.rate({
        workerId: bid.workerId,
        needId: need.id,
        bidId: bid.id,
        stars,
        comment,
      });
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function repost() {
    try {
      setBusy(true);
      const { need: next } = await api.repostNeed(need.id);
      window.location.href = `/needs/${next.id}`;
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  if (!need) {
    return (
      <Shell title="Need" backTo="/app">
        <p className="text-sm text-[var(--muted)]">{err || "Loading…"}</p>
      </Shell>
    );
  }

  const mine =
    isResident &&
    (need.residentUserId === user.id || (!need.residentUserId && need.residentName === user.name));

  return (
    <Shell title={`${SKILL_EMOJI[need.skillCategory]} Need`} backTo="/app">
      <div className="card p-4 mb-3">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs text-[var(--muted)]">{need.zone?.displayName}</span>
          <span className="pill capitalize">{need.status}</span>
          <UrgencyBadge urgency={need.urgency} />
        </div>
        <p className="mt-1 mb-2">{need.description}</p>
        <div className="text-sm text-[var(--muted)]">Budget Rs.{need.budgetRange}</div>
        {isWorker && need.status === "open" && (
          <Link className="btn btn-primary w-full mt-3" to={`/needs/${need.id}/bid`}>
            Bid on this
          </Link>
        )}
        {mine && ["completed", "matched"].includes(need.status) && (
          <button className="btn btn-ghost w-full mt-3 text-xs" onClick={repost} disabled={busy}>
            Post this need again
          </button>
        )}
      </div>

      {err && <p className="text-sm text-[var(--red)] mb-2">{err}</p>}

      <h2 className="font-display text-lg mt-0 mb-2">Bids</h2>
      <div className="space-y-2.5">
        {need.bids.length === 0 && (
          <div className="card p-4 text-sm text-[var(--muted)]">No bids yet.</div>
        )}
        {need.bids.map((b) => (
          <div key={b.id} className="card p-4">
            <div className="flex justify-between gap-2">
              <div>
                <div className="font-semibold">{b.worker?.name}</div>
                <div className="text-xs text-[var(--muted)]">
                  <Stars value={b.worker?.rating} /> · {b.worker?.completedJobs} jobs
                </div>
                {b.servedThisZone && (
                  <div className="text-[10px] font-semibold text-[var(--green)] mt-1">
                    Served this gali before
                  </div>
                )}
              </div>
              <span className="text-xs uppercase text-[var(--muted)]">{b.status}</span>
            </div>
            <div className="mt-2 font-semibold">
              Rs. {b.priceRs} · {b.timelineDays} days
            </div>
            {b.note && <p className="text-sm text-[var(--muted)] mt-1 mb-0">{b.note}</p>}
            {mine && need.status === "open" && b.status === "pending" && (
              <button className="btn btn-primary w-full mt-3" onClick={() => accept(b.id)} disabled={busy}>
                Accept bid
              </button>
            )}
          </div>
        ))}
      </div>

      {["matched", "completed"].includes(need.status) && (mine || isWorker) && (
        <Link className="btn btn-ghost w-full mt-4" to={`/needs/${need.id}/chat`}>
          Safe chat — confirm timing
        </Link>
      )}

      {mine && need.status === "matched" && !need.jobDone && (
        <div className="card p-4 mt-4">
          <h3 className="font-display text-base mt-0 mb-2">Close the loop</h3>
          <p className="text-sm text-[var(--muted)] mt-0 mb-3">
            When the work is finished, confirm here — then you can rate the worker.
          </p>
          <button className="btn btn-primary w-full" onClick={confirmDone} disabled={busy}>
            Confirm job done
          </button>
        </div>
      )}

      {mine && need.status === "matched" && need.jobDone && (
        <div className="card p-4 mt-4">
          <h3 className="font-display text-base mt-0">Rate the worker</h3>
          <div className="field">
            <label>Stars</label>
            <select value={stars} onChange={(e) => setStars(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Comment</label>
            <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="On time? Quality?" />
          </div>
          <button className="btn btn-primary w-full" onClick={rate} disabled={busy}>
            Submit rating
          </button>
        </div>
      )}
    </Shell>
  );
}
