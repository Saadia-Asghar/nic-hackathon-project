#!/usr/bin/env node
/** Smoke test: GET /api/health must return ok */
const base = process.env.API_URL || "http://127.0.0.1:3001";
const res = await fetch(`${base}/api/health`);
const data = await res.json();
if (!res.ok || !data.ok) {
  console.error("FAIL", data);
  process.exit(1);
}
console.log("OK", {
  agent: data.agent?.mode,
  store: data.store?.engine,
  supabase: data.supabase?.configured,
});
