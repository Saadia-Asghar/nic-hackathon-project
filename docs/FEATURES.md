# Hunar Naqsha — Feature Specifications

**Version:** 1.0  
**Source of truth with:** PRD.md · TRD.md · USER_SPECS.md

---

## F1 — Need Post

| | |
|--|--|
| **User** | Resident |
| **Route** | `/needs/new` |
| **Purpose** | Primary demand signal |

**Fields:** skill_category, description, budget_range (`500-1000` \| `1000-2000` \| `2000+` \| `open`), urgency (`flexible` \| `week` \| `pre-eid` \| `urgent`), zone_id, resident_name  

**After submit:** status `open`; appears in feed; workers in skill+zone notified (in-app); GapDetectionAgent runs  

**Acceptance:** ≤3 taps; visible in feed ≤2s  

---

## F2 — Worker Registration

| | |
|--|--|
| **User** | Worker |
| **Route** | `/workers/register` |

**Fields:** name, skill_category, zone_id, availability (`weekdays` \| `weekends` \| `both`), bio, photo_url (optional)  

**Rules:** No address, no CNIC  

**After submit:** worker count updates; GapDetectionAgent runs; worker can browse open needs  

---

## F3 — Bid Submission

| | |
|--|--|
| **User** | Worker |
| **Route** | `/needs/:id/bid` |

**Fields:** price_rs, timeline_days, note (optional)  

**Rules:**  
- Bid only in own zone or adjacent zone  
- Max 3 active (`pending`) bids  
- Bid not editable after submit  

**After submit:** appears on need detail; bid_response_rate updates; GapDetectionAgent runs  

---

## F4 — Bid Acceptance

| | |
|--|--|
| **User** | Resident |
| **Route** | `/needs/:id` |

**Behavior:**  
- Need: `open` → `matched`  
- Winning bid: `pending` → `accepted`  
- Sibling bids: `pending` → `closed`  
- GapDetectionAgent runs  

---

## F5 — Job Completion + Rating

| | |
|--|--|
| **User** | Resident |
| **API** | `POST /api/ratings` |

**Fields:** stars (1–5), comment (optional), need_id, bid_id, worker_id  

**Behavior:** rolling average rating; completed_jobs++; GapDetectionAgent runs  

---

## F6 — AI Zone Health Score

| | |
|--|--|
| **Agent** | GapDetectionAgent |
| **Trigger** | need/bid/accept/register/rating events |

**Output → `zone_status`:** gap_level, ai_reasoning, ai_action, confidence, metrics, season_flag  

**Levels:** `green` \| `yellow` \| `red`  

---

## F7 — Gap Alert Card

| | |
|--|--|
| **Where** | Home (`/`) top of feed |

Shown when any zone+skill is yellow/red.  

**Yellow CTA:** See Open Needs  
**Red CTA:** Share Community Notice  

---

## F8 — WhatsApp Community Notice

| | |
|--|--|
| **Agent** | NoticeGeneratorAgent (on red) |
| **Delivery** | `https://wa.me/?text=` URL scheme |

No WhatsApp Business API. Copy-text fallback on alert page.  

---

## F9 — Worker Public Profile

| | |
|--|--|
| **Route** | `/workers/:id` |

Shows: name, skill, zone, availability, rating, completed_jobs, bio, photo  

**Hides:** phone, full address  

---

## F10 — Zone Detail

| | |
|--|--|
| **Route** | `/zones/:id` |

AI assessment card, skill health rows, open needs list, registered workers, share notice if red  

---

## F11 — My Activity (Resident) — P1

Session by name: posted needs, bid outcomes, ratings given  

---

## F12 — My Activity / Worker Dashboard — P1

| | |
|--|--|
| **Route** | `/worker/:id/dashboard` |

Open needs near you, active bids (x/3), completed jobs, rating  

---

## Seasonal context (system)

| Season | Window (demo seed) | Skills | Multiplier |
|--------|-------------------|--------|------------|
| pre-eid-fitr-2026 | 2026-03-10 → 2026-03-31 | Tailoring, Baking, Beautician | 3.0 |
| exam-season-2026 | 2026-02-15 → 2026-05-15 | Tutoring | 2.0 |
| ramadan-2026 | 2026-02-28 → 2026-03-29 | Baking, Cleaning | 1.8 |
| pre-eid-adha-2026 | 2026-06-06 → 2026-06-17 | Tailoring, Baking, Beautician | 2.5 |

Demo mode may force `days_to_next_eid = 11` for judge script.  

---

## Page map

| Route | Page |
|-------|------|
| `/` | Home — alerts, zone tiles, recent needs |
| `/needs/new` | Post need |
| `/needs/:id` | Need detail + bids |
| `/needs/:id/bid` | Submit bid |
| `/workers/register` | Worker registration |
| `/workers/:id` | Public profile |
| `/worker/:id/dashboard` | Worker dashboard |
| `/zones/:id` | Zone detail |
| `/alerts/:id` | Alert + WhatsApp notice |
