import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function Login() {
  const { login, user, ready } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (!ready) return null;
  if (user) return <Navigate to="/app" replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await login(email, password);
      nav("/app");
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell px-4 pt-8">
      <Link to="/" className="text-sm text-[var(--muted)] no-underline">
        ← Back
      </Link>
      <h1 className="font-display text-2xl mt-3 mb-1">Log in</h1>
      <p className="text-sm text-[var(--muted)] mb-5">Open your resident or worker dashboard.</p>

      <form className="card p-4" onSubmit={submit}>
        <div className="field">
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {err && <p className="text-sm text-[var(--red)]">{err}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>
          {busy ? "…" : "Log in"}
        </button>
      </form>

      <p className="text-sm text-center text-[var(--muted)] mt-4">
        New here? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
}
