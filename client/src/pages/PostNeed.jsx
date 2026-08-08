import { useState, useEffect } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { api, SKILLS, SKILL_EMOJI } from "../api";
import { useAuth } from "../auth";
import { RequireAuth, Shell } from "../components";

function PostNeedForm() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const skillParam = params.get("skill");
  const forWorker = params.get("for");
  const targetWorkerId = params.get("workerId");
  const [form, setForm] = useState({
    skillCategory: SKILLS.includes(skillParam) ? skillParam : "Tailoring & Stitching",
    description: forWorker ? `Looking for ${forWorker} — ` : "",
    budgetRange: "1000-2000",
    urgency: "pre-eid",
    zoneId: user.zoneId || "Z3",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const [estimate, setEstimate] = useState(null);
  const [estimating, setEstimating] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchEstimate = async () => {
      setEstimating(true);
      try {
        const res = await api.priceEstimate(form.zoneId, form.skillCategory, form.urgency);
        if (active) setEstimate(res.price_range);
      } catch (e) {
        console.warn("Price estimate failed", e);
      } finally {
        if (active) setEstimating(false);
      }
    };
    const timer = setTimeout(fetchEstimate, 600);
    return () => { active = false; clearTimeout(timer); };
  }, [form.zoneId, form.skillCategory, form.urgency]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const { need } = await api.createNeed({
        ...form,
        residentName: user.name,
        residentUserId: user.id,
        targetWorkerId: targetWorkerId || undefined,
      });
      nav(`/needs/${need.id}`);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title="Post a need" backTo="/app">
      {forWorker && (
        <p className="text-sm text-[var(--muted)] mt-0 mb-3">
          Posting a need inspired by <strong>Ustaad {forWorker}</strong> — they can bid if nearby.
        </p>
      )}
      <form className="card p-4" onSubmit={submit}>
        <div className="field">
          <label>Skill</label>
          <div className="grid grid-cols-2 gap-2">
            {SKILLS.map((s) => (
              <button
                type="button"
                key={s}
                className={`btn text-xs py-2 ${form.skillCategory === s ? "btn-primary" : "btn-ghost"}`}
                onClick={() => set("skillCategory", s)}
              >
                {SKILL_EMOJI[s]} {s.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>What do you need?</label>
          <textarea
            rows={3}
            required
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="e.g. 2 suits before Eid…"
          />
        </div>
        <div className="field">
          <label className="flex justify-between items-center">
            Budget
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--blue-soft)] text-[var(--teal)]">
              ✨ AI Suggestion
            </span>
          </label>
          <select value={form.budgetRange} onChange={(e) => set("budgetRange", e.target.value)}>
            <option value="500-1000">Rs. 500–1,000</option>
            <option value="1000-2000">Rs. 1,000–2,000</option>
            <option value="2000+">Rs. 2,000+</option>
            <option value="open">Open to bids</option>
          </select>
          <p className="text-xs text-[var(--muted)] mt-1.5 mb-0">
            Fair rate: <strong>{estimating ? "Calculating..." : estimate || "Loading..."}</strong>
          </p>
        </div>
        <div className="field">
          <label>Urgency</label>
          <select value={form.urgency} onChange={(e) => set("urgency", e.target.value)}>
            <option value="flexible">Flexible</option>
            <option value="week">Within 1 week</option>
            <option value="pre-eid">Before Eid</option>
            <option value="urgent">Today/Tomorrow</option>
          </select>
        </div>
        <div className="field">
          <label>Zone</label>
          <select value={form.zoneId} onChange={(e) => set("zoneId", e.target.value)}>
            <option value="Z1">Gali 1–2</option>
            <option value="Z2">Gali 3–4</option>
            <option value="Z3">Gali 5–7</option>
            <option value="Z4">Gali 8–9</option>
            <option value="Z5">Main Market</option>
            <option value="Z6">Back Streets</option>
          </select>
        </div>
        {err && <p className="text-sm text-[var(--red)]">{err}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>
          {busy ? "…" : "Post need"}
        </button>
      </form>
    </Shell>
  );
}

export default function PostNeed() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "resident") return <Navigate to="/app" replace />;
  return (
    <RequireAuth role="resident">
      <PostNeedForm />
    </RequireAuth>
  );
}
