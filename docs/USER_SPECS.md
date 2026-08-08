# Hunar Naqsha — User Specifications

**Version:** 1.0  

## 1. Research basis

- ILO 2017 — Pakistan’s Hidden Workers (home-based workers)  
- WIEGO Lahore Informal Economy Monitoring  
- World Bank / Oxfam informal urban economy research  
- Local discovery pain (tailor/baker/tutor via WhatsApp only)  
- Competitors: Khud Mukhtar, Sahuliat-AI, Fix-Karlo = matching only, **no gap AI**  

### Key findings → product implications

| Finding | Product implication |
|---------|---------------------|
| ~200m discovery radius | Zone/gali matching, not city-wide OLX |
| Predictable Eid / exam / Ramadan spikes | Seasonal signal in AI |
| No price transparency | Worker-set bids (InDrive-style dignity) |
| Listing apps don’t detect shortages | GapDetectionAgent is the differentiator |
| Workers reject platform price-setting | No commission, no algorithm price |

---

## 2. Personas

### Persona A — Fatima Bibi (Resident)

| | |
|--|--|
| Location | Gulberg / Model Town style mohalla |
| Age | 38 |
| Device | Android, WhatsApp daily |
| Pain | 3 days hunting tailor before Eid; paid Rs.2800 vs usual Rs.1200 |
| Goal | Nearby trusted worker, fair price, few taps |
| Avoids | Calling strangers, long profiles |

**Primary features:** F1, F4, F5, F7  

### Persona B — Aisha (Worker — Tailor)

| | |
|--|--|
| Location | Gali 4 |
| Age | 34 |
| Income | ~Rs.18–25k/month home stitching |
| Pain | Turns away 20–30 Eid orders; discovered too late |
| Goal | Earlier + steadier orders; **own price** |
| Avoids | Commission platforms, complex UX |

**Primary features:** F2, F3, F12, F9  

### Persona C — Bilal (Worker — Baker)

| | |
|--|--|
| Location | G-10, Islamabad |
| Age | 26 |
| Pain | Instagram-only discovery |
| Goal | Steady local orders |
| Avoids | Fake inquiries, heavy profile management |

### Persona D — Kashif (Resident — Father)

| | |
|--|--|
| Location | G-10 |
| Age | 44 |
| Need | O-level physics tutor within budget/~1km |
| Pain | Booked tutors + opaque rates |
| Goal | Compare bids quickly |

---

## 3. Jobs to be done

### Resident
1. When I need a local skill → find available workers nearby without phone calls  
2. When bids arrive → compare price/timeline/rating and pick confidently  
3. When I accept → see past record so I feel safe  
4. When work is done → rate so others benefit  

### Worker
1. When I have capacity → see nearby jobs to bid on  
2. When I bid → name my own price (no cut)  
3. When I finish → build visible reputation  

### System (Mohalla Mind)
1. When demand outpaces supply → alert before peak  
2. When acute → produce shareable community action  
3. When season changes → adjust gap sensitivity  

---

## 4. Session identity (hackathon)

- **No login / OTP**  
- Resident identified by `resident_name` (+ optional localStorage last name)  
- Worker identified by `worker_id` stored in localStorage after registration  
- Switch persona in demo via “Act as Resident / Worker” picker  

---

## 5. UX principles

1. Mobile-first, large tap targets  
2. Urdu labels where helpful (zones, skills) — conversational copy  
3. ≤3 steps to post need or bid  
4. AI explanation always visible when zone ≠ green  
5. Never show worker phone on public profile  

---

## 6. User acceptance scenarios

| ID | Scenario | Pass if |
|----|----------|---------|
| U1 | Fatima posts pre-Eid tailor need | Need open in feed + zone |
| U2 | Aisha bids Rs.1200 / 3 days | Bid visible on need |
| U3 | Fatima accepts | Status Matched; other bids closed |
| U4 | Fatima rates 5★ | Worker rating updates |
| U5 | Judge opens Red zone | Reasoning names numbers + Eid |
| U6 | Share notice | WhatsApp opens with text |
| U7 | New tailor registers in Red zone | Tile improves yellow/green |

---

## 7. Related docs

[PRD.md](./PRD.md) · [FEATURES.md](./FEATURES.md) · [TRD.md](./TRD.md)  
