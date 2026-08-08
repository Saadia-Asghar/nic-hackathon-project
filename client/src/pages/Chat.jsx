import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ImagePlus, Info, Phone, Send } from "lucide-react";
import { api, whatsappShareUrl } from "../api";
import { useAuth } from "../auth";
import { Shell, JobStepper, initials, mohallaLabel } from "../components";

function fmtTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function Chat() {
  const { id } = useParams();
  const { user, ready } = useAuth();
  const [messages, setMessages] = useState([]);
  const [need, setNeed] = useState(null);
  const [worker, setWorker] = useState(null);
  const [zone, setZone] = useState(null);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const bottomRef = useRef(null);

  async function load() {
    const data = await api.messages(id);
    setNeed(data.need);
    setMessages(data.messages);
    setWorker(data.worker || null);
    setZone(data.zone || null);
  }

  useEffect(() => {
    if (!user) return;
    load().catch((e) => setErr(e.message));
    const t = setInterval(() => load().catch(() => {}), 8000);
    return () => clearInterval(t);
  }, [id, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const jobNo = (need?.id || id || "").slice(0, 4).toUpperCase();
  const skillShort = need?.skillCategory?.split(" ")[0] || "Job";
  const partner = worker?.name || "Worker";
  const zoneLabel = zone?.displayName || mohallaLabel(need?.zoneId);
  const waText = `Hunar Naqsha · ${skillShort} Job #${jobNo}\n${need?.description || ""}\nZone: ${zoneLabel}\nWith: ${partner}`;

  const systemNote =
    need?.status === "matched" && !need?.jobDone
      ? "Safe chat is open. Confirm timing & fabric/tools here — no phone numbers shared."
      : need?.jobDone
        ? "Job marked done. Rate the worker from the need page when ready."
        : need?.status === "completed"
          ? "This job is completed. Chat stays available for reference."
          : null;

  return (
    <Shell backTo="/chats" title={`${skillShort} chat`} hideNav={false}>
      <div className="chat-screen">
        <div className="card p-4 mb-4">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <div className="font-extrabold text-[var(--navy)]">
                {skillShort} Job #{jobNo}
              </div>
              <div className="text-sm text-[var(--muted)] mt-0.5">
                {partner} · {zoneLabel}
              </div>
            </div>
            <a
              className="btn-wa inline-flex items-center gap-1 no-underline shrink-0"
              href={whatsappShareUrl(waText)}
              target="_blank"
              rel="noreferrer"
            >
              <Phone size={13} /> WhatsApp
            </a>
          </div>
          {need && <JobStepper status={need.status} jobDone={need.jobDone} />}
        </div>

        {err && <p className="text-sm text-[var(--red)] mb-2">{err}</p>}

        <div className="chat-thread">
          <div className="chat-date">Today</div>

          {messages.length === 0 && (
            <p className="text-sm text-[var(--muted)] text-center py-6 m-0">Say salaam to start.</p>
          )}

          {messages.map((m) => {
            const mine = m.senderUserId === user.id;
            return (
              <div key={m.id} className={`chat-row ${mine ? "me" : ""}`}>
                {!mine && <div className="chat-avatar">{initials(m.senderName)}</div>}
                <div>
                  {!mine && (
                    <div className="text-[11px] font-semibold text-[var(--muted)] mb-1 ml-1">
                      {m.senderName}
                    </div>
                  )}
                  <div className={`chat-bubble ${mine ? "chat-me" : "chat-them"}`}>{m.body}</div>
                  <div className={`chat-meta ${mine ? "text-right" : ""}`}>
                    {fmtTime(m.createdAt)}
                    {mine ? " ✓✓" : ""}
                  </div>
                </div>
              </div>
            );
          })}

          {systemNote && (
            <div className="system-note">
              <Info size={16} className="text-[var(--teal)] shrink-0 mt-0.5" />
              <span>{systemNote}</span>
            </div>
          )}

          {need?.status === "matched" && !need?.jobDone && user.role === "resident" && (
            <Link className="btn btn-outline-teal w-full text-sm" to={`/needs/${id}`}>
              Confirm job done →
            </Link>
          )}

          <div ref={bottomRef} />
        </div>

        <form className="composer" onSubmit={send}>
          <button type="button" className="attach-btn" title="Photos coming soon" disabled>
            <ImagePlus size={18} />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            maxLength={500}
          />
          <button className="send-btn" type="submit" aria-label="Send">
            <Send size={18} />
          </button>
        </form>
      </div>
    </Shell>
  );
}
