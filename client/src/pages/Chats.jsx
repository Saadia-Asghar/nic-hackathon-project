import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import { Shell, initials } from "../components";

export default function Chats() {
  const { user, ready, isResident, isWorker } = useAuth();
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) return;
    api
      .chats()
      .then(setRows)
      .catch((e) => setErr(e.message));
  }, [user]);

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Shell>
      <h1 className="font-display text-xl mt-3 mb-1">Chats</h1>
      <p className="text-sm text-[var(--muted)] mt-0 mb-4">
        Safe in-app chat unlocks after a bid is accepted.
      </p>
      {err && <p className="text-sm text-[var(--red)]">{err}</p>}
      <div className="space-y-2.5">
        {rows.length === 0 && (
          <div className="card p-5 text-sm text-[var(--muted)] flex gap-2 items-center">
            <MessageCircle size={18} /> No active chats yet.
          </div>
        )}
        {rows.map((c) => (
          <Link
            key={c.needId}
            to={`/needs/${c.needId}/chat`}
            className="card p-3.5 flex gap-3 no-underline text-inherit items-center"
          >
            <div className="chat-avatar">{initials(c.partnerName)}</div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm truncate">{c.partnerName}</div>
              <div className="text-xs text-[var(--muted)] truncate">
                {c.skillCategory} · {c.preview || "Say salaam…"}
              </div>
            </div>
            <span className="pill capitalize">{c.status}</span>
          </Link>
        ))}
      </div>
      {isResident && (
        <p className="text-xs text-[var(--muted)] mt-4">
          Accept a bid on Home to unlock chat with that worker.
        </p>
      )}
      {isWorker && (
        <p className="text-xs text-[var(--muted)] mt-4">
          When a resident accepts your bid, the chat appears here.
        </p>
      )}
    </Shell>
  );
}
