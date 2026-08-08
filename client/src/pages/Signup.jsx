import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { SKILLS } from "../api";

export default function Signup() {
  const { signup, user, ready } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState("resident");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    zoneId: "Z3",
    skillCategory: "Tailoring & Stitching",
    availability: "both",
    bio: "",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (!ready) return null;
  if (user) return <Navigate to="/app" replace />;

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role,
        zoneId: form.zoneId,
      };
      if (role === "worker") {
        payload.skillCategory = form.skillCategory;
        payload.availability = form.availability;
        payload.bio = form.bio;
      }
      await signup(payload);
      nav("/app");
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell px-4 pt-8 pb-8">
      <Link to="/" className="text-sm text-[var(--muted)] no-underline">
        ← Back
      </Link>
      <h1 className="font-display text-2xl mt-3 mb-1">Sign up</h1>
      <p className="text-sm text-[var(--muted)] mb-4">Pick one role. You’ll only see that dashboard.</p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          type="button"
          className={`btn ${role === "resident" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setRole("resident")}
        >
          Resident
        </button>
        <button
          type="button"
          className={`btn ${role === "worker" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setRole("worker")}
        >
          Worker
        </button>
      </div>

      <form className="card p-4" onSubmit={submit}>
        <div className="field">
          <label>Name</label>
          <input required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" required minLength={6} value={form.password} onChange={(e) => set("password", e.target.value)} />
        </div>
        <div className="field">
          <label>Your zone</label>
          <select value={form.zoneId} onChange={(e) => set("zoneId", e.target.value)}>
            <option value="Z1">Gali 1–2</option>
            <option value="Z2">Gali 3–4</option>
            <option value="Z3">Gali 5–7</option>
            <option value="Z4">Gali 8–9</option>
            <option value="Z5">Main Market</option>
            <option value="Z6">Back Streets</option>
          </select>
        </div>

        {role === "worker" && (
          <>
            <div className="field">
              <label>Your skill</label>
              <select value={form.skillCategory} onChange={(e) => set("skillCategory", e.target.value)}>
                {SKILLS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Availability</label>
              <select value={form.availability} onChange={(e) => set("availability", e.target.value)}>
                <option value="weekdays">Weekdays</option>
                <option value="weekends">Weekends</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="field">
              <label>Short bio (optional)</label>
              <textarea rows={2} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
            </div>
          </>
        )}

        {err && <p className="text-sm text-[var(--red)]">{err}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>
          {busy ? "…" : `Create ${role} account`}
        </button>
      </form>

      <p className="text-sm text-center text-[var(--muted)] mt-4">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
