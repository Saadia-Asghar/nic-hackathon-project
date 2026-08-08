const BASE = "/api";
const TOKEN_KEY = "hn_auth_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export const api = {
  health: () => request("/health"),
  resetDemo: () => request("/demo/reset", { method: "POST" }),
  signup: (body) => request("/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => request("/auth/me"),
  residentNeeds: (userId) => request(`/resident/${userId}/needs`),
  zones: () => request("/zones"),
  zone: (id) => request(`/zones/${id}`),
  zoneHistory: (id) => request(`/zones/${id}/history`),
  topWorkers: (zoneId) => request(`/zones/${zoneId}/top-workers`),
  forecast: () => request("/forecast"),
  map: () => request("/map"),
  needs: (q = "") => request(`/needs${q}`),
  need: (id) => request(`/needs/${id}`),
  createNeed: (body) => request("/needs", { method: "POST", body: JSON.stringify(body) }),
  confirmDone: (id) => request(`/needs/${id}/complete`, { method: "POST" }),
  repostNeed: (id) => request(`/needs/${id}/repost`, { method: "POST" }),
  workers: (q = "") => request(`/workers${q}`),
  worker: (id) => request(`/workers/${id}`),
  registerWorker: (body) => request("/workers", { method: "POST", body: JSON.stringify(body) }),
  setAvailability: (id, availableThisWeek) =>
    request(`/workers/${id}/availability`, {
      method: "PATCH",
      body: JSON.stringify({ availableThisWeek }),
    }),
  openNeedsForWorker: (id) => request(`/worker/${id}/open-needs`),
  workerStats: (id) => request(`/worker/${id}/stats`),
  demandNearby: (id) => request(`/worker/${id}/demand-nearby`),
  createBid: (body) => request("/bids", { method: "POST", body: JSON.stringify(body) }),
  acceptBid: (id) => request(`/bids/${id}/accept`, { method: "PATCH" }),
  rate: (body) => request("/ratings", { method: "POST", body: JSON.stringify(body) }),
  messages: (needId) => request(`/needs/${needId}/messages`),
  sendMessage: (needId, body) =>
    request(`/needs/${needId}/messages`, { method: "POST", body: JSON.stringify(body) }),
  alerts: () => request("/ai/alerts"),
  alert: (id) => request(`/ai/alerts/${id}`),
  analyze: (body) => request("/ai/analyze", { method: "POST", body: JSON.stringify(body) }),
  markHandled: (zoneId, skill) =>
    request(`/zones/${zoneId}/skills/${encodeURIComponent(skill)}/handle`, { method: "PATCH" }),
  favorites: () => request("/favorites"),
  addFavorite: (workerId) => request(`/favorites/${workerId}`, { method: "POST" }),
  removeFavorite: (workerId) => request(`/favorites/${workerId}`, { method: "DELETE" }),
  notifications: () => request("/notifications"),
  readNotification: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
  readAllNotifications: () => request("/notifications/read-all", { method: "POST" }),
};

export const SKILLS = [
  "Tailoring & Stitching",
  "Baking & Home Food",
  "Home Tutoring",
  "Beautician",
  "Electrical Work",
  "Plumbing",
  "Cleaning",
  "Other",
];

export const SKILL_EMOJI = {
  "Tailoring & Stitching": "🧵",
  "Baking & Home Food": "🎂",
  "Home Tutoring": "📚",
  Beautician: "💄",
  "Electrical Work": "⚡",
  Plumbing: "🔧",
  Cleaning: "🧹",
  Other: "✨",
};

export function whatsappShareUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
