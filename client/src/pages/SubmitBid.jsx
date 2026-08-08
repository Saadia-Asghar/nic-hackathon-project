import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { Shell } from "../components";

export default function SubmitBid() {
  const { id } = useParams();
  const { user, ready } = useAuth();
  const nav = useNavigate();
  const [need, setNeed] = useState(null);
  const [priceRs, setPrice] = useState(1200);
  const [timelineDays, setDays] = useState(3);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api.need(id).then(setNeed).catch((e) => setErr(e.message));
  }, [id]);

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "worker") return <Navigate to="/app" replace />;

  async function submit(e) {
    e.preventDefault();
    try {
      await api.createBid({
        needId: id,
        workerId: user.workerId,
        priceRs,
        timelineDays,
        note,
      });
      nav(`/needs/${id}`);
    } catch (ex) {
      setErr(ex.message);
    }
  }

  return (
    <Shell title="Submit bid" backTo="/app">
      {need && (
        <div className="card p-4 mb-3 text-sm">
          <p className="my-0 mb-1 font-semibold">{need.description}</p>
          <div className="text-[var(--muted)]">
            {need.zone?.displayName} · Rs.{need.budgetRange}
          </div>
        </div>
      )}
      <form className="card p-4" onSubmit={submit}>
        <div className="field">
          <label>Your price (Rs.)</label>
          <input type="number" required value={priceRs} onChange={(e) => setPrice(Number(e.target.value))} />
        </div>
        <div className="field">
          <label>Days to complete</label>
          <input type="number" required value={timelineDays} onChange={(e) => setDays(Number(e.target.value))} />
        </div>
        <div className="field">
          <label>Note (optional)</label>
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        {err && <p className="text-sm text-[var(--red)]">{err}</p>}
        <button className="btn btn-primary w-full">Submit bid</button>
      </form>
    </Shell>
  );
}
