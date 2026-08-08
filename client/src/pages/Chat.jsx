import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { Shell } from "../components";

export default function Chat() {
  const { id } = useParams();
  const { user, ready } = useAuth();
  const [messages, setMessages] = useState([]);
  const [need, setNeed] = useState(null);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    const data = await api.messages(id);
    setNeed(data.need);
    setMessages(data.messages);
  }

  useEffect(() => {
    if (!user) return;
    load().catch((e) => setErr(e.message));
  }, [id, user]);

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await api.sendMessage(id, { senderUserId: user.id, body: text });
      setText("");
      await load();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  return (
    <Shell title="Safe chat" backTo={`/needs/${id}`}>
      <div className="card p-3 mb-3 text-xs text-[var(--muted)]">
        In-app only — no phone numbers shown. Unlocks after bid accept.
        {need ? ` · ${need.status}` : ""}
      </div>

      {err && <p className="text-sm text-[var(--red)] mb-2">{err}</p>}

      <div className="card p-3 mb-3 min-h-[280px] max-h-[50vh] overflow-y-auto space-y-2">
        {messages.length === 0 && (
          <p className="text-sm text-[var(--muted)] text-center py-8 m-0">Say salaam to start.</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`chat-bubble ${m.senderUserId === user.id ? "chat-me" : "chat-them"}`}
          >
            <div className="text-[10px] opacity-70 mb-0.5">{m.senderName}</div>
            {m.body}
          </div>
        ))}
      </div>

      <form className="flex gap-2" onSubmit={send}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          maxLength={500}
        />
        <button className="btn btn-primary shrink-0" type="submit">
          Send
        </button>
      </form>
    </Shell>
  );
}
