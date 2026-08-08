# Hunar Naqsha — Full Product & Technical Document

**Product name:** Hunar Naqsha  
**Tagline:** Apni gali ka hunar, apni marzi ka daam  
**Track:** Mohalla Mind (AI Seekho Builders Day / NIC Hackathon)  
**Platform:** Mobile-first web / APK  
**Version:** 1.0 — Hackathon Build Spec  
**Last updated:** 2026-08-08

**One-line product:**  
A mobile-first app where residents post skill needs, local workers bid with their own prices, book and chat in-app (WhatsApp optional), leave feedback, and an AI fuses demand + season + bids + ratings to warn when a neighborhood skill shortage is forming.

**Two-line pitch:**  
Hunar Naqsha turns a Pakistani mohalla’s invisible skill economy into something the neighborhood can see: residents post needs, workers set their own prices, and AI fuses demand, season, bid silence, and feedback to warn when a shortage is forming — then helps close it before Eid or exams break the gali.

---

# PART A — USER RESEARCH

## A1. Research basis (problem evidence)

| Finding | Implication for product |
|---------|-------------------------|
| Pakistan has 12M+ home-based workers (ILO “hidden workers”) — no shop address, word-of-mouth only | Discovery must work by **gali/zone**, not formal address/CNIC |
| Demand radius often ~200m; next street may not know the worker | Zone tiles + nearby needs/bids beat city-wide OLX listings |
| Eid / Ramadan / exam seasons create predictable spikes | **Seasonal calendar** is a first-class signal |
| Existing apps (Khud Mukhtar, Fix-Karlo-style listings) are “OLX for X” | Differentiator = **gap intelligence**, not more listings |
| Trust is personal and local | **In-app booking + chat + feedback** replace blind phone numbers |
| Residents already use WhatsApp | WhatsApp = **optional contact + share notice**, not the only channel |

## A2. Personas

### Persona A — Fatima (Resident / Demand)

| Attribute | Detail |
|-----------|--------|
| Who | Home manager / parent in Gulberg, G-10, Model Town, etc. |
| Needs | Tailor before Eid, tutor in exam season, baker for dawat, plumber today |
| Current behavior | Ask neighbor → WhatsApp group → random numbers → give up or overpay |
| Pain | Can’t find reliable nearby help; no price clarity; no proof of past work |
| Goal in app | Post once → compare bids → book → chat → rate |
| Success | Matched in her zone at a price she accepts, with chat trail |

### Persona B — Ustaad Aisha (Worker / Supply)

| Attribute | Detail |
|-----------|--------|
| Who | Home tailor / baker / tutor / beautician / electrician / plumber / cleaner |
| Current behavior | 10–15 regulars; invisible one street over |
| Pain | No discovery; no public proof; hard to set fair seasonal prices |
| Goal in app | Register → see nearby needs → bid own price → chat → build stars |
| Success | More jobs in her gali + neighboring zones; reputation grows |

### Explicit non-users (out of scope)

- Mohalla committee lead (admin empire)
- Local NGO / government dashboards
- Bank/compliance officers

**Rationale:** Track allows choosing who the system is for. Ordinary residents + workers = the mohalla. AI uses the same data they generate.

## A3. Jobs-to-be-done

| Job | User | Feature cluster |
|-----|------|-----------------|
| “Help me find someone in my gali before Eid” | Resident | Need post, bids, accept |
| “Let me set my own price like InDrive” | Worker | Bid submit |
| “Talk without sharing number first” | Both | In-app chat after book |
| “Use WhatsApp if easier” | Both | Optional WhatsApp deep link |
| “Know if this worker is trustworthy” | Resident | Rating, feedback, completed jobs |
| “See if my mohalla is short on tailors” | Both | Zone heatmap + AI alert |
| “Tell neighbors we need more tailors” | Anyone | Share WhatsApp mobilization notice |

## A4. Feature research → priority

| Feature | User value | Mohalla Mind value | Hackathon priority |
|---------|------------|--------------------|--------------------|
| Zone gap tiles | Shared neighborhood view | Before/after + fusion output | P0 |
| Post need | Core demand | Signal 1 | P0 |
| Worker register | Core supply | Signal 1 input | P0 |
| Bid + accept | Marketplace utility | Downstream action | P0 |
| Gemini gap reasoning | Differentiator | Requirements 2, 5 | P0 |
| WhatsApp shortage notice | Mobilization | Requirement 3 | P0 |
| Booking status | Clarity | Impact trail | P0 |
| In-app chat (post-book) | Trust / coordination | Action depth | P0 (simple) |
| Feedback → AI | Trust + 4th signal | Stronger reasoning | P0 |
| Optional WhatsApp contact | Familiarity | Convenience | P1 |
| Pricing intelligence card | Budget help | Extra insight | P2 |
| Live counter-bids / escrow / auth | Nice-to-have | Scope risk | Cut |

---

# PART B — PRD (Product Requirements Document)

## B1. Goals

1. Let any resident post a skill need by zone (no full address).
2. Let any worker bid with their own price and timeline.
3. Complete the job loop in-app: book → chat → complete → feedback.
4. Fuse multiple community signals so AI judges skill-gap risk per zone+skill.
5. Simulate real actions: match/book, mobilization notice, status changes.
6. Show visible before/after on zone tiles and booking states.
7. Explain every AI decision in plain language.

## B2. Non-goals (hackathon)

- Payments / escrow / platform commission
- Real-time auction / counter-offer loops
- Full auth (OTP, CNIC, KYC)
- Real GIS maps (use zone tile grid)
- NGO / municipal admin portals
- Voice/video calls inside app

## B3. Skill categories (fixed 8)

1. Tailoring & Stitching  
2. Baking & Home Food  
3. Home Tutoring  
4. Beautician  
5. Electrical Work  
6. Plumbing  
7. Cleaning  
8. Other  

## B4. Zones (seed for demo)

Example: Model Town / G-10 style mock

| Zone ID | Label |
|---------|--------|
| Z1 | Gali 1–2 |
| Z2 | Gali 3–4 |
| Z3 | Gali 5–7 |
| Z4 | Gali 8–9 |
| Z5 | Gali 10–12 |

## B5. Feature catalog (every feature)

### F1 — Home / Zone View
- Color-coded zone tiles: Green / Yellow / Red  
- Per tile: zone name, top shortage skill, open needs count  
- Feed of recent need posts  
- AI Gap Alert card when any zone is Yellow/Red  

### F2 — Post a Need (Resident)
- Skill, description, budget range, urgency, zone, resident name  
- Status starts as `open`  
- Triggers worker notification (in-app list refresh for demo)  
- Triggers AI zone recalculation  

### F3 — Need Detail + Bids (Resident)
- List bids: worker, price, timeline, rating, note  
- Accept bid → booking created, need `matched`/`booked`  
- Reject other bids (auto or soft)  

### F4 — Worker Registration
- Name, skill, zone, availability, bio, optional photo  
- No address / CNIC required  

### F5 — Browse Needs + Bid (Worker)
- Open needs in own + neighboring zones filtered by skill  
- Bid: price, timeline_days, optional note  

### F6 — Booking
- Created on accept  
- Statuses: `booked` → `in_progress` → `completed` / `cancelled`  
- Both parties see booking card  

### F7 — In-app Chat
- Unlocks only after booking  
- Text messages only  
- Thread tied to `booking_id`  

### F8 — Optional WhatsApp Contact
- Button on booking: opens `https://wa.me/92XXXXXXXXXX?text=...`  
- Prefill: need summary + booking reference  
- Does not replace in-app chat  

### F9 — Feedback & Rating
- After `completed`, resident submits stars + on_time + quality + would_rehire + optional comment  
- Updates worker aggregate rating & completed_jobs  
- Feeds AI evaluation inputs  

### F10 — AI Gap Detection (Hero)
- Inputs: open needs, workers, bid response rate, season flag, avg rating / rehire rate  
- Output: gap_level, reasoning, action, confidence  
- Updates `zone_status`  

### F11 — Community Mobilization Notice
- When Yellow/Red: draft WhatsApp-ready shortage notice  
- Share via WhatsApp URL scheme  
- Badge: `Mobilization Sent` (simulated)  

### F12 — Worker Public Profile
- Skill, zone, availability, stars, completed jobs, sample photo, short bio  

### F13 — Seasonal Context Engine
- Hardcoded seasons (no external API): pre-eid, exam-season, ramadan, normal  

### F14 — Pricing Intelligence (optional P2)
- Show bid range vs simple zone average for that skill  

## B6. User flows

### Flow R1 — Resident happy path
Post need → receive bids → accept → book → chat → complete → feedback → zone AI updates  

### Flow W1 — Worker happy path
Register → browse needs → bid → accepted → chat → deliver → receive rating  

### Flow A1 — Shortage hero path (demo)
Multiple needs in one skill+zone → low/zero bids → pre-Eid season → AI Yellow/Red → alert card → share notice → second worker registers → tile improves  

## B7. Status machines

### Need status
`open` → `booked` → `completed` | `expired` | `cancelled`

### Bid status
`pending` → `accepted` | `rejected` | `withdrawn`

### Booking status
`booked` → `in_progress` → `completed` | `cancelled`

### Zone gap level
`green` | `yellow` | `red`  
(+ UI badge `mobilization_sent` boolean)

## B8. Mohalla Mind requirement mapping

| # | Requirement | Product proof |
|---|-------------|----------------|
| 1 | Fuse ≥2 signal types | Needs + season + bid behaviour + feedback/trust |
| 2 | Reason, not summarize | Context-dependent gap judgment via Gemini |
| 3 | Simulate real action | Booking/match, chat open, WhatsApp notice sent |
| 4 | Show impact | Zone colors + need/booking state changes |
| 5 | Explain why | AI reasoning card on every gap decision |

## B9. Success metrics (demo / product)

| Metric | Demo success |
|--------|----------------|
| Time to first bid visible | < 30s in script |
| Zone color change visible | Yes, live |
| AI reason readable aloud | 2–3 sentences |
| Booking + chat reachable | After accept |
| Feedback updates rating | Immediate |

## B10. Brand

| Item | Value |
|------|--------|
| Name | Hunar Naqsha |
| Tagline (UR) | Apni gali ka hunar, apni marzi ka daam |
| Tagline (EN) | Your neighborhood’s skill, your own price |
| Tone | Local, clear, dignified — not corporate govtech |
| Visual direction | Warm street/mohalla atmosphere; avoid purple-AI cliché; zone colors Green/Yellow/Red as system language |

---

# PART C — USER-SPECIFIC DOCUMENTATION

## C1. Resident guide (in-product copy outline)

1. Open Home → see zones and feed  
2. Tap **Post a Need** → fill skill, details, budget, urgency, gali  
3. Wait for bids on Need Detail  
4. Compare price, timeline, stars → **Accept**  
5. Booking opens → **Chat in app** (or WhatsApp if needed)  
6. When done → **Mark Complete** → leave feedback  
7. If you see a Hunar Alert on Home → **Share on WhatsApp** to help find more workers  

## C2. Worker guide

1. **Register** once (name, skill, gali, availability, bio, photo)  
2. Home / Needs list → open needs in your skill  
3. **Bid** your price and days  
4. If accepted → chat, agree details, do the work  
5. After resident completes → your stars update  
6. Keep availability updated (simple field)  

## C3. Permissions & privacy (hackathon assumptions)

- No login: identify by name (+ optional phone for WhatsApp link only)  
- No full home address — zone/gali only  
- Chat only after booking  
- Phone number optional; shown only via WhatsApp button if provided  

---

# PART D — PAGES / SCREENS / DASHBOARDS

## D1. Screen inventory

| ID | Screen | Primary user | Purpose |
|----|--------|--------------|---------|
| S1 | Home / Zone View | Both | Neighborhood skill map + feed + AI alerts |
| S2 | Post Need | Resident | Create demand signal |
| S3 | Need Detail + Bids | Resident | Compare & accept |
| S4 | Worker Registration | Worker | Create supply identity |
| S5 | Worker Needs + Bid | Worker | Supply response |
| S6 | AI Gap Alert (card/modal) | Both | Hero intelligence |
| S7 | Worker Profile | Both | Trust evaluation |
| S8 | Booking Detail | Both | Status + actions |
| S9 | Chat Thread | Both | Coordination |
| S10 | Feedback Form | Resident | Trust signal capture |
| S11 | My Needs (list) | Resident | Track posts |
| S12 | My Jobs (list) | Worker | Track bids/bookings |

**Note:** There is **no separate NGO/admin dashboard**. The Home zone view *is* the community dashboard for everyone.

## D2. Home dashboard widgets

1. Zone tile grid (5 zones)  
2. Legend: Green / Yellow / Red  
3. Active Hunar Alert stack  
4. Recent needs feed  
5. CTA: Post a Need | I’m a Worker  

## D3. Wire content — S1 Home

- Header: Hunar Naqsha  
- Zone tiles  
- Alert card (conditional)  
- Feed cards: skill · zone · budget · bid count · status  

## D4. Wire content — S8 Booking

- Need summary  
- Agreed price & timeline  
- Worker snippet (stars)  
- Status chip  
- Buttons: Open Chat | WhatsApp | Mark In Progress | Mark Complete  

## D5. Wire content — S6 AI Alert

- Zone + skill  
- Gap level  
- Reasoning (2–3 sentences)  
- Confidence  
- Recommended action  
- Share on WhatsApp  
- Mobilization badge if shared  

---

# PART E — TRD (Technical Requirements Document)

## E1. Recommended stack (hackathon)

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React / Next.js mobile-first OR Flutter/React Native | Fast UI |
| Backend | Next.js API routes / Firebase / Supabase | Speed |
| DB | PostgreSQL (Supabase) or Firestore | Simple relational preferred |
| AI | Google AI Studio / Gemini API | Track requirement |
| Files | Local URLs or Supabase Storage for work photo | Optional |
| Messaging | App DB table (not Socket-heavy); poll or simple realtime | Demo-safe |
| WhatsApp | `wa.me` URL scheme only | No WhatsApp Business API |

## E2. Architecture (logical)

```
[Resident / Worker UI]
        |
        v
[API Layer]
   |-- needs, workers, bids, bookings, messages, feedback
   |
   v
[Domain Services]
   |-- MarketplaceService (bid/accept/book)
   |-- ChatService
   |-- FeedbackService
   |-- SeasonService (calendar rules)
   |-- GapOrchestrator (aggregate stats → Gemini → zone_status)
   |
   v
[Gemini Agent] ---- JSON gap judgment
   |
   v
[Database]
```

## E3. Agents & services (what “works”)

There is **one AI agent** plus deterministic services.

### Agent 1 — GapJudgeAgent (Gemini)

| Item | Spec |
|------|------|
| Trigger | After need create, bid create, bid accept, booking complete, feedback create, worker register |
| Inputs | zone, skill, open_needs, workers, bids_48h, bid_response_rate, matched_week, season_flag, days_to_eid, avg_rating, rehire_rate, late_rate |
| Output JSON | `gap_level`, `reasoning`, `action`, `confidence` |
| Side effects | Upsert `zone_status`; may set `notice_draft` |

### Service — SeasonService (rules, not LLM)

| Flag | Condition | Skills weighted |
|------|-----------|-----------------|
| pre-eid | Within 21 days of Eid ul Fitr/Adha | Tailoring, Baking, Beautician |
| exam-season | Feb 15–May 15 / Oct 1–Nov 30 | Home Tutoring |
| ramadan | Ramadan month dates (hardcoded year table) | Baking, Cleaning |
| normal | Else | Equal |

### Service — MarketplaceService
Create need, create bid, accept bid → create booking, reject sibling bids  

### Service — ChatService
Create thread on booking; send/list messages  

### Service — FeedbackService
Validate completed booking; write feedback; recompute worker rating  

### Service — NoticeService
Build WhatsApp share text from zone_status; mark `mobilization_sent`  

### Service — NotificationService (mock)
In-app “notifications” as list rows for demo (no push required)  

## E4. Gemini prompt (canonical)

```
You are analyzing skill supply and demand in a Pakistani neighborhood zone.

Zone: {zone}
Skill category: {skill}
Date today: {today}
Days until next Eid: {days_to_eid_or_not_imminent}
Season context: {season_flag}

Current data:
- Open need posts in this zone+skill: {open_needs}
- Registered workers in this zone+skill: {workers}
- Bids received on open needs in last 48 hours: {bids_48h}
- Bid response rate: {bid_response_rate}
- Needs matched/booked this week: {matched_week}
- Average worker rating (1-5): {avg_rating}
- Would-rehire rate (0-1): {rehire_rate}
- Late/no-show rate (0-1): {late_rate}

Task:
1. Assess whether a skill shortage is forming, present, or not a concern.
2. Assign gap_level: green | yellow | red
3. Write 2-3 sentence plain-language explanation of EXACTLY which combination of signals caused this assessment.
4. Recommend one specific action.

Return JSON only:
{
  "gap_level": "green|yellow|red",
  "reasoning": "...",
  "action": "...",
  "confidence": "low|medium|high"
}
```

## E5. Gap heuristics (for fallback if Gemini fails)

Use only as backup so demo never bricks:

- red: open_needs >= 3 AND workers <= 1 AND (season in pre-eid/exam/ramadan OR bid_response_rate < 0.2)  
- yellow: open_needs >= 2 AND (workers <= 2 OR bid_response_rate < 0.4 OR avg_rating < 3.2)  
- else green  

Always prefer Gemini when available; show reasoning from model.

## E6. API endpoints (suggested)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/zones` | Zone tiles + status |
| GET | `/needs` | Feed / filters |
| POST | `/needs` | Create need |
| GET | `/needs/:id` | Detail + bids |
| POST | `/workers` | Register |
| GET | `/workers/:id` | Profile |
| GET | `/needs/open` | Worker browse |
| POST | `/bids` | Submit bid |
| POST | `/bids/:id/accept` | Accept → booking |
| GET | `/bookings/:id` | Booking detail |
| PATCH | `/bookings/:id/status` | Progress/complete |
| GET | `/bookings/:id/messages` | Chat list |
| POST | `/bookings/:id/messages` | Send chat |
| POST | `/bookings/:id/feedback` | Feedback |
| POST | `/zones/:zone/skills/:skill/analyze` | Force AI refresh |
| POST | `/zones/:zone/mobilization/share` | Mark notice shared |

## E7. Non-functional

| Concern | Target |
|---------|--------|
| Mobile-first | 390px base width |
| AI latency | Show skeleton; timeout → fallback heuristic |
| Offline | Not required |
| Auth | Name-based demo identity |
| Localization | UI English; notices bilingual-capable (Urdu text in share string) |

---

# PART F — DATABASE SCHEMA

## F1. ER overview

```
workers 1---* bids *---1 needs
needs 1---1 bookings
bookings 1---* messages
bookings 1---1 feedback
workers 1---* feedback
zone_status (zone + skill_category grain)
season_calendar (optional config table)
```

## F2. Tables

### `zones`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | z1… |
| name | text | Gali 5–7 |
| sort_order | int | |

### `workers`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | |
| skill_category | text | enum-like |
| zone_id | text FK | |
| availability | text | weekdays/weekends/both |
| bio | text | |
| photo_url | text null | |
| phone | text null | for WhatsApp only |
| rating | numeric | avg stars |
| completed_jobs | int | default 0 |
| registered_at | timestamptz | |

### `needs`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| skill_category | text | |
| description | text | |
| budget_range | text | 500-1000 / 1000-2000 / 2000+ / open |
| urgency | text | flexible / week / eid / today |
| zone_id | text FK | |
| status | text | open/booked/completed/expired/cancelled |
| resident_name | text | |
| resident_phone | text null | |
| created_at | timestamptz | |

### `bids`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| need_id | uuid FK | |
| worker_id | uuid FK | |
| price | int | PKR |
| timeline_days | int | |
| note | text null | |
| status | text | pending/accepted/rejected/withdrawn |
| created_at | timestamptz | |

### `bookings`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| need_id | uuid FK unique | |
| bid_id | uuid FK | |
| worker_id | uuid FK | |
| agreed_price | int | |
| timeline_days | int | |
| status | text | booked/in_progress/completed/cancelled |
| chat_unlocked | bool | default true on create |
| created_at | timestamptz | |
| completed_at | timestamptz null | |

### `messages`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| booking_id | uuid FK | |
| sender_role | text | resident/worker |
| sender_name | text | |
| body | text | |
| created_at | timestamptz | |

### `feedback`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| booking_id | uuid FK unique | |
| need_id | uuid FK | |
| worker_id | uuid FK | |
| stars | int | 1–5 |
| on_time | text | yes/late/no_show |
| quality | text | yes/partial/no |
| would_rehire | bool | |
| comment | text null | |
| created_at | timestamptz | |

### `zone_status`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| zone_id | text | |
| skill_category | text | |
| gap_level | text | green/yellow/red |
| open_needs | int | |
| registered_workers | int | |
| bid_response_rate | numeric | |
| avg_rating | numeric null | |
| rehire_rate | numeric null | |
| season_flag | text | |
| ai_reasoning | text | |
| ai_action | text | |
| confidence | text | |
| notice_draft | text | |
| mobilization_sent | bool | default false |
| last_updated | timestamptz | |
| UNIQUE(zone_id, skill_category) | | |

### `notifications` (optional mock)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| audience_role | text | |
| audience_name | text | |
| title | text | |
| body | text | |
| link_type | text | need/booking/alert |
| link_id | text | |
| created_at | timestamptz | |
| read | bool | |

## F3. Derived metrics (computed before Gemini)

```
bid_response_rate = (needs_with_>=1_bid in window) / max(open_or_recent_needs, 1)
rehire_rate = count(would_rehire=true) / max(feedback_count, 1)
late_rate = count(on_time in late,no_show) / max(feedback_count, 1)
```

## F4. Seed data (demo)

- 5 zones  
- 8 workers across skills (at least 1 tailor in Z3 only — single point of failure)  
- 6 needs (mix open)  
- 2–3 sample bookings with messages  
- 1 pre-built Yellow scenario activators (extra tailor needs)  
- Hardcoded `days_to_eid = 12` for demo mode flag  

---

# PART G — EVENT / AGENT ORCHESTRATION

| Event | Services run |
|-------|----------------|
| `need.created` | NotificationService → GapOrchestrator |
| `bid.created` | GapOrchestrator |
| `bid.accepted` | MarketplaceService creates booking → ChatService seed → GapOrchestrator |
| `booking.completed` | (wait feedback) or GapOrchestrator light refresh |
| `feedback.created` | FeedbackService recompute rating → GapOrchestrator |
| `worker.registered` | GapOrchestrator |
| `mobilization.shared` | NoticeService sets flag |

**GapOrchestrator steps**
1. Aggregate SQL metrics for zone+skill  
2. SeasonService.resolve(today)  
3. GapJudgeAgent (Gemini)  
4. Upsert zone_status + notice_draft  
5. UI reads zone_status for tiles/alert  

---

# PART H — BUILD ORDER

1. Seed + zone tiles (S1)  
2. Post need (S2)  
3. Worker registration (S4)  
4. Bid + accept + booking (S3, S5, S8)  
5. Chat + optional WhatsApp (S9)  
6. Complete + feedback (S10)  
7. Gemini gap + alert + share (S6)  
8. Polish demo script  

---

# PART I — 3-MINUTE DEMO SCRIPT

1. **0:00–0:20** Home: 5 green zones — “Hunar Naqsha maps mohalla hunar.”  
2. **0:20–0:50** Fatima posts tailoring need before Eid.  
3. **0:50–1:10** Aisha bids Rs.1200 / 3 days.  
4. **1:10–1:40** Fatima accepts → Booked → open chat → optional WhatsApp.  
5. **1:40–2:00** Complete + 5★ feedback — rating updates.  
6. **2:00–2:30** Activate 2 more tailor needs → zone Yellow → read AI reasoning (needs + Eid + bid silence + capacity).  
7. **2:30–2:50** Share WhatsApp mobilization notice.  
8. **2:50–3:00** Register 2nd tailor → tile improves — before/after done.  

---

# PART J — README ASSUMPTIONS (for submission)

- Zones and Eid proximity may be mocked for demo day.  
- Weather/maps APIs not used (not needed).  
- Gemini used for gap judgment; season rules hardcoded.  
- Chat is booking-scoped; not a social network.  
- WhatsApp via URL scheme only.  
- No payments.  
- Users: residents and workers only.  

---

# PART K — ACCEPTANCE CHECKLIST

- [ ] Resident can post need  
- [ ] Worker can register and bid  
- [ ] Accept creates booking  
- [ ] Chat works after booking  
- [ ] WhatsApp contact button works if phone present  
- [ ] Feedback updates worker rating  
- [ ] Gemini (or fallback) sets zone green/yellow/red with reasoning  
- [ ] Alert card + WhatsApp shortage share works  
- [ ] Before/after visible in demo  
- [ ] All 5 Mohalla Mind structural requirements demonstrable  

---

**Document owner:** Hunar Naqsha team  
**Status:** Ready for Checkpoint 1 (Planning & Branding) + implementation  
