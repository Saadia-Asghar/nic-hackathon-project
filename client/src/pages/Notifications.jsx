import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import { Shell } from "../components";

export default function Notifications() {
  const { user, ready } = useAuth();
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  function load() {
    return api
      .notifications()
      .then(setRows)
      .catch((e) => setErr(e.message));
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Shell title="Notifications" backTo="/app">
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-[var(--muted)] m-0">Bids, matches, and gap alerts.</p>
        <button
          type="button"
          className="btn btn-ghost text-xs py-1.5 px-2"
          onClick={() => api.readAllNotifications().then(load)}
        >
          Mark all read
        </button>
      </div>
      {err && <p className="text-sm text-[var(--red)]">{err}</p>}
      <div className="space-y-2 mb-10">
        {rows.length === 0 && (
          <div className="card p-4 text-sm text-[var(--muted)] flex gap-2 items-center">
            <Bell size={16} /> No notifications yet.
          </div>
        )}
        {rows.map((n) => (
          <button
            key={n.id}
            type="button"
            className={`card p-3.5 text-left w-full border ${n.read ? "opacity-70" : "border-[var(--rose)]"}`}
            onClick={async () => {
              if (!n.read) await api.readNotification(n.id);
              if (n.link) window.location.href = n.link;
              else load();
            }}
          >
            <div className="text-xs text-[var(--muted)] mb-0.5">
              {new Date(n.createdAt).toLocaleString()}
              {!n.read && <span className="text-[var(--rose)] font-semibold"> · New</span>}
            </div>
            <div className="font-semibold text-sm">{n.title}</div>
            <div className="text-sm text-[var(--muted)] mt-0.5">{n.body}</div>
            {n.link && (
              <Link to={n.link} className="text-xs font-semibold mt-1 inline-block" onClick={(e) => e.stopPropagation()}>
                Open →
              </Link>
            )}
          </button>
        ))}
      </div>
    </Shell>
  );
}
