# Audit progress — 2026-08-08

Working through the review checklist. Status after this pass:

## Critical (#1–5) — FIXED
| # | Issue | Fix |
|---|--------|-----|
| 1 | JSON file DB | **SQLite** via Node 24 `node:sqlite` → `server/data/hunar.db` (migrates legacy JSON) |
| 2 | Default JWT | Startup **env validation**; prod refuses default secret; local warns |
| 3 | Silent AI fallback | Hardcoded keys **removed**; boot warns if no `OPENAI_API_KEY`/`GEMINI_API_KEY`; supports both |
| 4 | CORS / abuse | **helmet** + origin allowlist (prod) + **express-rate-limit** |
| 5 | Hardcoded dist | `CLIENT_DIST` env + SPA fallback `index.html` |

## High-impact build order — DONE
| # | Item | Status |
|---|------|--------|
| 11 | PWA | `manifest.json` + `sw.js` + icons |
| 17 | Leaflet map | Already present |
| 18 | WhatsApp wa.me | Already wired |
| 25 | Demo switcher | Floating **Try as Fatima / Aisha** |
| 6 | Photo upload | `POST /workers/:id/photo` + profile UI |
| 7 | Forecast chart | Bar viz on resident home |
| 9 | Bid expiry | 72h TTL via `maintenance.js` |
| 10 | Cancel booking | `POST /needs/:id/cancel` + UI |
| 15 | AI “why” at a glance | Zone tiles + worker demand card |
| 26 | Dockerfile | Root `Dockerfile` |
| 28 | Smoke test | `npm run smoke` in server |

## Still open (later)
8 Urdu UI toggle · 12 availability calendar · 13 pagination · 14 password reset · 21 skeletons · 23 full AI history page · 27 APK retest · Supabase live keys

## Keys you must set
1. Paste `OPENAI_API_KEY` **or** `GEMINI_API_KEY` in `server/.env` for real LLM reasoning  
2. **Rotate** any OpenAI key that was previously committed/hardcoded  
3. Optional: `SUPABASE_SERVICE_ROLE_KEY` + run `supabase/migrations/001_hunar_schema.sql`
