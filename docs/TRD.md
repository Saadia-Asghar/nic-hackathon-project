# Hunar Naqsha — Technical Requirements Document (TRD)

**Version:** 1.0  
**Stack:** React + Vite · Tailwind · Express · SQLite (Drizzle) · Gemini  

> Note: Local build uses a **JSON file store** (`server/data/hunar.json`) so Windows installs do not need native SQLite. Schema fields match the product SQL; swap to Postgres/SQLite later if needed.

---

## 1. Architecture

```
Mobile Browser (React + Vite + Tailwind)
        │ REST JSON
Express API (/api/*)
        ├── needs, workers, bids, zones, ratings, alerts
        ├── /api/ai/analyze | /alerts | /notice/:zoneId
        │
        ├── SQLite (Drizzle ORM)
        └── AI Agent Layer
              ├── GapDetectionAgent (Gemini + heuristic fallback)
              ├── SeasonalContextAgent (pure date logic)
              └── NoticeGeneratorAgent (Gemini on red / template fallback)
```

---

## 2. API

### Needs
- `POST /api/needs`  
- `GET /api/needs?zone=&skill=&status=`  
- `GET /api/needs/:id` (+ bids)  
- `PATCH /api/needs/:id/status`  
- `POST /api/needs/:id/complete`  

### Workers
- `POST /api/workers`  
- `GET /api/workers?zone=&skill=`  
- `GET /api/workers/:id`  
- `PATCH /api/workers/:id`  

### Bids
- `POST /api/bids`  
- `GET /api/bids/need/:needId`  
- `PATCH /api/bids/:id/accept`  

### Zones
- `GET /api/zones`  
- `GET /api/zones/:id`  
- `GET /api/zones/:id/history`  

### AI
- `POST /api/ai/analyze` `{ zoneId, skillCategory }`  
- `GET /api/ai/alerts`  
- `GET /api/ai/notice/:zoneId?skill=`  

### Ratings
- `POST /api/ratings`  

### Meta
- `GET /api/health`  
- `POST /api/demo/reset` — reseed demo data  

---

## 3. Database tables

`zones` · `needs` · `workers` · `bids` · `zone_status` · `alerts` · `ratings` · `seasonal_context` · `ai_history`

See `server/db/schema.ts` for Drizzle definitions (mirrors product SQL).

---

## 4. Agents

### GapDetectionAgent
- **Trigger:** after need create, bid create/accept, worker register, rating  
- **Reads:** open needs, workers, bids 48h, response rate, matched week, season, days_to_eid, multiplier  
- **Writes:** `zone_status`; inserts/updates `alerts` if yellow/red  
- **Model:** Gemini 2.0 Flash; fallback heuristics if no API key / timeout  

### SeasonalContextAgent
- Date ∈ `seasonal_context` ∧ skill affected → season flag + multiplier  
- Else `normal` / 1.0  
- Demo override: `DEMO_DAYS_TO_EID=11`  

### NoticeGeneratorAgent
- On `gap_level === red`  
- Gemini drafts Urdu/English WhatsApp text OR template fallback  
- Stored on `alerts.whatsapp_notice`  

---

## 5. Gemini env

```
GEMINI_API_KEY=...
DEMO_DAYS_TO_EID=11
PORT=3001
```

---

## 6. Frontend routes

`/` · `/needs/new` · `/needs/:id` · `/needs/:id/bid` · `/workers/register` · `/workers/:id` · `/worker/:id/dashboard` · `/zones/:id` · `/alerts/:id`

---

## 7. Adjacent zone rule

```
Z1↔Z2, Z2↔Z3, Z3↔Z4, Z4↔Z5, Z5↔Z6, Z1↔Z6 (ring)
```

Worker may bid in own zone or adjacent.

---

## 8. Seed (demo)

Workers: Aisha, Nadia, Bilal, Sara, Imran, Zara  
Needs: 3× Tailoring in Z3 (Red), Baking Z2, Tutoring Z1 matched, Electrical Z4 Yellow  
Zone status precomputed then refreshed by agent  

---

## 9. Related docs

[PRD.md](./PRD.md) · [FEATURES.md](./FEATURES.md) · [USER_SPECS.md](./USER_SPECS.md)  
