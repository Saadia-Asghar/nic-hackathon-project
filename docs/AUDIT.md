# Hunar Naqsha — full audit (demo readiness)

**Date:** 2026-08-08  
**Product:** Hunar Naqsha · Mohalla Mind track  
**App:** http://localhost:5174 · API: http://localhost:3001  

---

## 1. Feature checklist (PRD F1–F12)

| ID | Feature | Status |
|----|---------|--------|
| F1 | Need post | Done |
| F2 | Worker registration (signup role=worker) | Done |
| F3 | Bid submit (zone/adjacent, max 3) | Done |
| F4 | Bid accept → matched | Done |
| F5 | Confirm done + rating | Done |
| F6 | AI zone health green/yellow/red | Done (heuristic; Gemini optional) |
| F7 | Gap alert on resident home | Done |
| F8 | WhatsApp notice on red | Done (+ copy text) |
| F9 | Worker public profile (Stitch UI) | Done |
| F10 | Zone detail + map + re-run agent | Done |
| F11 | Resident activity | Done (My Active Needs) |
| F12 | Worker dashboard | Done |

**Extra shipped:** JWT auth, Leaflet map, safe chat, favorites, notifications, Stitch navy UI, demo reset.

---

## 2. What is still missing / weak

| Item | Notes |
|------|--------|
| Gemini live reasoning | Needs `GEMINI_API_KEY` — without it agent uses heuristics (still demo-ready) |
| Supabase live DB | Schema SQL ready; MCP timed out — paste SQL + service role key |
| Photo upload in chat | Attach button is UI-only |
| Real phone WhatsApp | Only `wa.me` share text (by design — no numbers) |
| Push notifications | In-app only |
| Payments / KYC | Out of scope per PRD |
| Full Auth via Supabase Auth | Still app JWT + bcrypt (can migrate later) |

---

## 3. Agents — how they work

### GapDetectionAgent (`server/src/agents.js`)
**Triggers:** need create, bid, accept, worker register, rating, availability toggle, background scan (~5 min), zone “Re-run” button.

**Inputs fused:**
1. Open needs count  
2. Available workers (`availableThisWeek`)  
3. Bid response rate on open needs (48h)  
4. Season multiplier (Eid ×3 via `DEMO_FORCE_PRE_EID`)  
5. Days to Eid  

**Output:** `gap_level` + `ai_reasoning` + `ai_action` + confidence → `zone_status` + `alerts` (+ WhatsApp text if red).

**Path:** Gemini (if key) → validate JSON → else **heuristic** (always works).

### SeasonalContextAgent
Pure date / demo force. No API key.

### NoticeGeneratorAgent
On **red** only. Gemini draft or Urdu/English template. Opens via `wa.me/?text=`.

---

## 4. API keys — what you need

| Key | Required for demo? | Where |
|-----|-------------------|--------|
| *(none)* | **No** — heuristic agent + JSON store is enough | — |
| `GEMINI_API_KEY` | Optional — richer AI wording | `server/.env` |
| `JWT_SECRET` | Optional (has default) | `server/.env` |
| `SUPABASE_URL` | For cloud DB sync | `server/.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | For server sync writes | `server/.env` |
| `SUPABASE_ANON_KEY` | Client read (optional) | `server/.env` / client |

Project URL detected: `https://gnzxgxvzflkystgrcfbz.supabase.co`

---

## 5. Supabase attach steps

1. Open Supabase SQL Editor.  
2. Paste + run: `supabase/migrations/001_hunar_schema.sql`  
3. Project Settings → API → copy **URL** + **service_role** key.  
4. Put in `server/.env`:

```
SUPABASE_URL=https://gnzxgxvzflkystgrcfbz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

5. Restart API → Profile → **Reset demo data** (pushes snapshot to Supabase).  
6. Check `GET /api/health` → `supabase.configured: true`.

Local JSON store remains primary for the hackathon demo; Supabase is the cloud mirror.

---

## 6. Demo script (judges)

1. Login `fatima@demo.com` / `demo123`  
2. See **RED** AI alert on Gali 5–7 Tailoring + Share WhatsApp  
3. Mohalla pulse tiles (before colors)  
4. Open safe chat with Aisha  
5. Worker login `aisha@demo.com` → Available Needs → bid  
6. Zone → **Re-run GapDetectionAgent** (before→after)  
7. Second worker signup → availability on → gap improves  

---

## 7. Architecture (current)

```
React (Vite :5174)
   → Express API (:3001)
        → JSON file store (primary)
        → GapDetectionAgent (Gemini optional / heuristic)
        → Supabase sync (optional, when env set)
```
