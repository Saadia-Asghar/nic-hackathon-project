# Hunar Naqsha — Product Requirements Document (PRD)

**Version:** 1.0  
**Track:** Mohalla Mind | AI Seekho Builders Day 2026  
**Platform:** Mobile-first web app  

## 1. Summary

**Hunar Naqsha (Skill Map)** connects residents who need local skills with home-based workers who set their own prices, while an AI layer watches transactional data to warn when a neighborhood skill shortage is forming.

**Tagline:** Apni gali ka hunar, apni marzi ka daam

## 2. Problems

| Side | Problem |
|------|---------|
| **Resident (Fatima)** | Before Eid/exams, finding a tailor/tutor takes days of WhatsApp + calls; prices inflate under desperation |
| **Worker (Aisha)** | Discovery capped ~200m word-of-mouth; income limited; Eid rush arrives too late |
| **Mohalla (system)** | Predictable seasonal spikes (Eid, Ramadan, exams) still cause the same shortages every year — no early warning |

## 3. Solution concept

```
Resident posts need → Workers notified → Workers bid own price →
Resident accepts → Need matched → Rating after completion →
AI updates zone health (green/yellow/red) + drafts community notice
```

AI does **not** chat with users. It is a background intelligence layer that outputs zone health per skill + plain-language reason + draft action.

## 4. Mohalla Mind alignment

| Requirement | How met |
|-------------|---------|
| Fuse 2+ different signals | Need posts + seasonal calendar + bid response rate (+ ratings) |
| AI reasons, not summarize | Same counts → different gap level by season context |
| Simulate real action | Bid accept / match; WhatsApp community notice when red |
| Before/after impact | Zone tiles change color; need Open → Matched |
| Explain the why | Reasoning card on every alert |

## 5. Users (in scope)

- **Resident** — post need, review bids, accept, rate  
- **Worker** — register, bid, view jobs/rating  

**Out of scope:** Mohalla committee admin, NGO/gov dashboards, payments, KYC.

## 6. Skill categories (fixed 8)

Tailoring & Stitching · Baking & Home Food · Home Tutoring · Beautician · Electrical Work · Plumbing · Cleaning · Other

## 7. Demo zones (6)

Z1 Gali 1–2 · Z2 Gali 3–4 · Z3 Gali 5–7 · Z4 Gali 8–9 · Z5 Main Market · Z6 Back Streets

## 8. Feature IDs (see FEATURES.md for detail)

| ID | Feature | Priority |
|----|---------|----------|
| F1 | Need Post | P0 |
| F2 | Worker Registration | P0 |
| F3 | Bid Submission | P0 |
| F4 | Bid Acceptance | P0 |
| F5 | Job Completion + Rating | P0 |
| F6 | AI Zone Health Score | P0 |
| F7 | Gap Alert Card | P0 |
| F8 | WhatsApp Community Notice | P0 |
| F9 | Worker Public Profile | P0 |
| F10 | Zone Detail Screen | P0 |
| F11 | My Activity (Resident) | P1 |
| F12 | My Activity (Worker) | P1 |

## 9. Non-goals (hackathon)

Payments/escrow · live auction · push notifications · real GIS maps · CNIC/login · platform commission · NGO dashboards

## 10. Success criteria (demo)

- Zone Red alert + AI reasoning readable aloud  
- Live bid → accept → Matched  
- Second worker register → tile improves (before/after)  
- WhatsApp notice opens with prefilled Urdu/English text  

## 11. Related docs

- [FEATURES.md](./FEATURES.md)  
- [USER_SPECS.md](./USER_SPECS.md)  
- [TRD.md](./TRD.md)  
