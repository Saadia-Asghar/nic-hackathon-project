import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

const DEMOS = [
  { label: "Fatima", email: "fatima@demo.com", password: "demo123", role: "Resident" },
  { label: "Aisha", email: "aisha@demo.com", password: "demo123", role: "Worker" },
];

export default function DemoSwitcher() {
  const { login, logout, user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function tryAs(demo) {
    setBusy(true);
    setErr("");
    try {
      if (user) logout();
      await login(demo.email, demo.password);
      setOpen(false);
      navigate("/app");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="demo-switcher">
      {open && (
        <div className="demo-switcher-panel card p-3 mb-2">
          <div className="text-xs font-semibold mb-2">Demo walkthrough</div>
          <div className="flex flex-col gap-1.5">
            {DEMOS.map((d) => (
              <button
                key={d.email}
                type="button"
                className="btn btn-ghost w-full text-xs justify-between"
                disabled={busy}
                onClick={() => tryAs(d)}
              >
                <span>Try as {d.label}</span>
                <span className="text-[var(--muted)]">{d.role}</span>
              </button>
            ))}
          </div>
          {err && <p className="text-[11px] text-[var(--red)] m-0 mt-2">{err}</p>}
        </div>
      )}
      <button type="button" className="demo-switcher-fab" onClick={() => setOpen((v) => !v)}>
        {open ? "Close" : "Demo"}
      </button>
    </div>
  );
}
