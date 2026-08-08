import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, SKILLS, setSessionWorkerId } from "../api";
import { Shell } from "../components";

export default function RegisterWorker() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "",
    skillCategory: "Tailoring & Stitching",
    zoneId: "Z3",
    availability: "both",
    bio: "",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { worker } = await api.registerWorker(form);
      setSessionWorkerId(worker.id);
      nav(`/worker/${worker.id}/dashboard`);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title="Register Your Skill" backTo="/">
      <form className="card p-4" onSubmit={submit}>
        <div className="field">
          <label>Your name</label>
          <input required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="field">
          <label>Your skill</label>
          <select value={form.skillCategory} onChange={(e) => set("skillCategory", e.target.value)}>
            {SKILLS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Your zone / gali</label>
          <select value={form.zoneId} onChange={(e) => set("zoneId", e.target.value)}>
            <option value="Z1">Gali 1–2</option>
            <option value="Z2">Gali 3–4</option>
            <option value="Z3">Gali 5–7</option>
            <option value="Z4">Gali 8–9</option>
            <option value="Z5">Main Market Area</option>
            <option value="Z6">Back Streets</option>
          </select>
        </div>
        <div className="field">
          <label>Availability</label>
          <select value={form.availability} onChange={(e) => set("availability", e.target.value)}>
            <option value="weekdays">Weekdays only</option>
            <option value="both">Both weekdays & weekends</option>
            <option value="weekends">Weekends only</option>
          </select>
        </div>
        <div className="field">
          <label>About your work (optional)</label>
          <textarea rows={2} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
        </div>
        {err && <p className="text-sm text-[var(--red)]">{err}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>
          {busy ? "Saving…" : "Register & Start Getting Nearby Jobs →"}
        </button>
        <p className="text-xs text-[var(--muted)] mt-3 mb-0">
          No address. No CNIC. You set your own price — no commission.
        </p>
      </form>
    </Shell>
  );
}
