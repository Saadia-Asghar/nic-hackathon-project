import { v4 as uuid } from "uuid";
import { store } from "./store.js";
import { nowIso } from "./constants.js";

export function notifyUser(userId, { type, title, body, link = null }) {
  if (!userId) return null;
  const note = {
    id: uuid(),
    userId,
    type: type || "info",
    title,
    body,
    link,
    read: false,
    createdAt: nowIso(),
  };
  store.write((db) => {
    if (!db.notifications) db.notifications = [];
    db.notifications.unshift(note);
  });
  return note;
}

export function notifyZoneWorkers(zoneId, skillCategory, payload) {
  const db = store.read();
  const workers = db.workers.filter(
    (w) => w.zoneId === zoneId && w.skillCategory === skillCategory && w.userId
  );
  for (const w of workers) {
    notifyUser(w.userId, payload);
  }
}
