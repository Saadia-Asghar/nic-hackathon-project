import { Router } from "express";
import { v4 as uuid } from "uuid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { store } from "./store.js";
import { ADJACENT, MAP_CENTER, nowIso, jitter } from "./constants.js";
import { analyzeZoneSkill, buildForecast, agentMode, suggestPrice, getSeasonForSkill } from "./agents.js";
import { supabaseStatus } from "./supabase.js";
import { seed } from "./seed.js";
import {
  authenticate,
  createUser,
  findUserById,
  publicUser,
  requireAuth,
  signToken,
} from "./auth.js";
import { computeTrust } from "./trust.js";
import { notifyUser, notifyZoneWorkers } from "./notify.js";

const router = Router();

function safeUser(user) {
  return publicUser(user);
}

function zoneCoords(zoneId) {
  const z = store.read().zones.find((x) => x.id === zoneId);
  if (!z?.lat) return { lat: MAP_CENTER.lat, lng: MAP_CENTER.lng };
  return { lat: z.lat, lng: z.lng };
}

router.get("/health", (_req, res) => {
  res.json({
    ok: true,
    product: "Hunar Naqsha",
    track: "Mohalla Mind",
    agent: agentMode(),
    supabase: supabaseStatus(),
    store: { engine: store.engine, path: store.path },
  });
});

router.get("/ai/status", (_req, res) => {
  res.json(agentMode());
});

router.post("/demo/reset", async (_req, res) => {
  try {
    await seed();
    res.json({ ok: true, supabase: supabaseStatus() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---- Auth ----
router.post("/auth/signup", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      zoneId,
      skillCategory,
      availability,
      bio,
    } = req.body || {};

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Name, email, password, and role are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    let workerId = null;
    if (role === "worker") {
      if (!zoneId || !skillCategory || !availability) {
        return res.status(400).json({
          error: "Workers need zone, skill, and availability at signup",
        });
      }
      workerId = uuid();
    }

    const user = await createUser({
      name,
      email,
      password,
      role,
      zoneId: zoneId || null,
      workerId,
    });

    if (role === "worker") {
      const zc = zoneCoords(zoneId);
      const coords = jitter(zc.lat, zc.lng);
      store.write((db) => {
        db.workers.unshift({
          id: workerId,
          userId: user.id,
          name: user.name,
          skillCategory,
          zoneId,
          availability,
          bio: bio || null,
          photoUrl: null,
          rating: 0,
          completedJobs: 0,
          isActive: true,
          availableThisWeek: true,
          registeredAt: nowIso(),
          lat: coords.lat,
          lng: coords.lng,
        });
      });
      await analyzeZoneSkill(zoneId, skillCategory);
    }

    const fresh = findUserById(user.id);
    notifyUser(fresh.id, {
      type: "welcome",
      title: "Account created",
      body: role === "worker" ? "Your hunar profile is live." : "Post a need whenever you want help.",
      link: "/app",
    });
    const token = signToken(fresh);
    res.status(201).json({ user: safeUser(fresh), token });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const user = await authenticate(email, password);
    res.json({ user: safeUser(user), token: signToken(user) });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

router.get("/auth/me", requireAuth, (req, res) => {
  res.json({ user: safeUser(req.user) });
});

/** @deprecated Prefer Bearer /auth/me — kept for older clients */
router.get("/auth/me/:id", (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: safeUser(user) });
});

router.get("/resident/:userId/needs", (req, res) => {
  const db = store.read();
  const user = findUserById(req.params.userId);
  if (!user || user.role !== "resident") {
    return res.status(404).json({ error: "Resident not found" });
  }
  const rows = db.needs
    .filter((n) => n.residentUserId === user.id || (!n.residentUserId && n.residentName === user.name))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((n) => ({
      ...n,
      bidCount: db.bids.filter((b) => b.needId === n.id).length,
      zone: db.zones.find((z) => z.id === n.zoneId),
      bids: db.bids
        .filter((b) => b.needId === n.id)
        .map((b) => ({
          ...b,
          worker: db.workers.find((w) => w.id === b.workerId),
        })),
    }));
  res.json(rows);
});

router.get("/zones", (_req, res) => {
  const db = store.read();
  const payload = db.zones.map((z) => {
    const zs = db.zoneStatus.filter((s) => s.zoneId === z.id);
    const rank = { red: 3, yellow: 2, green: 1 };
    const worst = zs.reduce((acc, s) => ((rank[s.gapLevel] || 0) > (rank[acc] || 0) ? s.gapLevel : acc), "green");
    const topGap = [...zs]
      .filter((s) => s.gapLevel !== "green")
      .sort((a, b) => (rank[b.gapLevel] || 0) - (rank[a.gapLevel] || 0))[0];
    return {
      ...z,
      gapLevel: worst,
      topShortageSkill: topGap?.skillCategory || null,
      topReasoning: topGap?.aiReasoning || null,
      openNeedsCount: db.needs.filter((n) => n.zoneId === z.id && n.status === "open").length,
      skills: zs,
    };
  });
  res.json(payload);
});

router.get("/zones/:id", (req, res) => {
  const db = store.read();
  const z = db.zones.find((x) => x.id === req.params.id);
  if (!z) return res.status(404).json({ error: "Zone not found" });
  res.json({
    ...z,
    skills: db.zoneStatus.filter((s) => s.zoneId === z.id),
    needs: db.needs.filter((n) => n.zoneId === z.id),
    workers: db.workers.filter((w) => w.zoneId === z.id),
    alerts: db.alerts.filter((a) => a.zoneId === z.id && a.isActive),
  });
});

router.get("/zones/:id/history", (req, res) => {
  const rows = store
    .read()
    .aiHistory.filter((h) => h.zoneId === req.params.id)
    .slice(0, 30);
  res.json(rows);
});

router.get("/needs", (req, res) => {
  const db = store.read();
  let rows = [...db.needs].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  if (req.query.zone) rows = rows.filter((n) => n.zoneId === req.query.zone);
  if (req.query.skill) rows = rows.filter((n) => n.skillCategory === req.query.skill);
  if (req.query.status) rows = rows.filter((n) => n.status === req.query.status);
  res.json(
    rows.map((n) => ({
      ...n,
      bidCount: db.bids.filter((b) => b.needId === n.id).length,
      zone: db.zones.find((z) => z.id === n.zoneId),
    }))
  );
});

router.get("/needs/:id", (req, res) => {
  const db = store.read();
  const need = db.needs.find((n) => n.id === req.params.id);
  if (!need) return res.status(404).json({ error: "Need not found" });
  const needBids = db.bids
    .filter((b) => b.needId === need.id)
    .map((b) => {
      const worker = db.workers.find((w) => w.id === b.workerId);
      const servedZone = db.needs.some(
        (n) =>
          n.zoneId === need.zoneId &&
          n.status === "completed" &&
          n.matchedBidId &&
          db.bids.some((xb) => xb.id === n.matchedBidId && xb.workerId === b.workerId)
      );
      return {
        ...b,
        worker,
        servedThisZone: servedZone,
      };
    });
  res.json({ ...need, bids: needBids, zone: db.zones.find((z) => z.id === need.zoneId) });
});

router.post("/needs", requireAuth, async (req, res) => {
  const { skillCategory, description, budgetRange, urgency, zoneId } = req.body || {};
  if (!skillCategory || !description || !budgetRange || !urgency || !zoneId) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (req.user.role !== "resident") {
    return res.status(403).json({ error: "Only residents can post needs" });
  }
  const coords = jitter(zoneCoords(zoneId).lat, zoneCoords(zoneId).lng);
  const need = {
    id: uuid(),
    skillCategory,
    description,
    budgetRange,
    urgency,
    zoneId,
    residentName: req.user.name,
    residentUserId: req.user.id,
    status: "open",
    createdAt: nowIso(),
    matchedAt: null,
    matchedBidId: null,
    lat: coords.lat,
    lng: coords.lng,
    targetWorkerId: req.body.targetWorkerId || null,
  };
  store.write((db) => db.needs.unshift(need));
  if (need.targetWorkerId) {
    notifyUser(need.targetWorkerId, {
      type: "rehire",
      title: `${req.user.name} wants to book you again!`,
      body: `They posted a new need: ${description.slice(0, 90)}`,
      link: `/needs/${need.id}`,
    });
  } else {
    notifyZoneWorkers(zoneId, skillCategory, {
      type: "need",
      title: "New need near you",
      body: `${req.user.name}: ${description.slice(0, 90)}`,
      link: `/needs/${need.id}`,
    });
  }
  const analysis = await analyzeZoneSkill(zoneId, skillCategory);
  if (analysis?.gapLevel === "red" || analysis?.gapLevel === "yellow") {
    notifyUser(req.user.id, {
      type: "gap",
      title: `${zoneId} · ${skillCategory}`,
      body: analysis.gapLevel === "red" ? "Acute shortage — workers nearby may be scarce." : "Gap forming in your zone.",
      link: `/zones/${zoneId}`,
    });
  }
  res.status(201).json({ need, analysis });
});

router.patch("/needs/:id/status", async (req, res) => {
  let need;
  store.write((db) => {
    need = db.needs.find((n) => n.id === req.params.id);
    if (need) need.status = req.body?.status;
  });
  if (!need) return res.status(404).json({ error: "Need not found" });
  await analyzeZoneSkill(need.zoneId, need.skillCategory);
  res.json(need);
});

router.post("/needs/:id/complete", async (req, res) => {
  let need;
  store.write((db) => {
    need = db.needs.find((n) => n.id === req.params.id);
    if (need && need.status === "matched") {
      need.jobDone = true;
      need.jobDoneAt = nowIso();
    }
  });
  if (!need || !need.jobDone) {
    return res.status(400).json({ error: "Need must be matched to confirm done" });
  }
  res.json(need);
});

router.post("/needs/:id/repost", async (req, res) => {
  const db = store.read();
  const old = db.needs.find((n) => n.id === req.params.id);
  if (!old) return res.status(404).json({ error: "Need not found" });
  const need = {
    id: uuid(),
    skillCategory: old.skillCategory,
    description: old.description,
    budgetRange: old.budgetRange,
    urgency: old.urgency === "flexible" ? "pre-eid" : old.urgency,
    zoneId: old.zoneId,
    residentName: old.residentName,
    residentUserId: old.residentUserId,
    status: "open",
    createdAt: nowIso(),
    matchedAt: null,
    matchedBidId: null,
    jobDone: false,
    repostedFrom: old.id,
  };
  store.write((s) => s.needs.unshift(need));
  const analysis = await analyzeZoneSkill(need.zoneId, need.skillCategory);
  res.status(201).json({ need, analysis });
});

router.get("/workers", (req, res) => {
  const db = store.read();
  let rows = db.workers;
  if (req.query.zone) rows = rows.filter((w) => w.zoneId === req.query.zone);
  if (req.query.skill) rows = rows.filter((w) => w.skillCategory === req.query.skill);
  if (req.query.active === "true") rows = rows.filter((w) => w.isActive);
  const minTrust = Number(req.query.minTrust || 0);
  const search = String(req.query.search || "").toLowerCase().trim();

  const enriched = rows
    .map((w) => {
      const ratings = db.ratings.filter((r) => r.workerId === w.id);
      const trust = computeTrust(w, ratings);
      return {
        ...w,
        ...trust,
        zone: db.zones.find((z) => z.id === w.zoneId),
        reviewCount: ratings.length,
      };
    })
    .filter((w) => w.trustScore >= minTrust)
    .filter((w) => {
      if (!search) return true;
      return (
        w.name.toLowerCase().includes(search) ||
        (w.bio || "").toLowerCase().includes(search) ||
        w.skillCategory.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => b.trustScore - a.trustScore);

  res.json(enriched);
});

router.get("/workers/:id", (req, res) => {
  const db = store.read();
  const worker = db.workers.find((w) => w.id === req.params.id);
  if (!worker) return res.status(404).json({ error: "Worker not found" });
  const workerBids = db.bids.filter((b) => b.workerId === worker.id);
  const ratings = db.ratings.filter((r) => r.workerId === worker.id);
  const trust = computeTrust(worker, ratings);

  // Active matched chat with this worker (for "Send a Message")
  const matchedNeed = db.needs.find((n) => {
    if (!["matched", "completed"].includes(n.status) || !n.matchedBidId) return false;
    const bid = db.bids.find((b) => b.id === n.matchedBidId);
    return bid && bid.workerId === worker.id;
  });

  const avg =
    ratings.length > 0
      ? Number((ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1))
      : worker.rating;

  res.json({
    ...worker,
    ...trust,
    rating: avg || worker.rating,
    bids: workerBids,
    zone: db.zones.find((z) => z.id === worker.zoneId),
    pendingBids: workerBids.filter((b) => b.status === "pending").length,
    reviews: ratings
      .slice()
      .sort((a, b) => (a.ratedAt < b.ratedAt ? 1 : -1))
      .slice(0, 8),
    reviewCount: ratings.length || worker.completedJobs || 0,
    matchedChatNeedId: matchedNeed?.id || null,
    tags: worker.tags || defaultTags(worker.skillCategory),
    services: worker.services || defaultServices(worker.skillCategory),
    portfolio: worker.portfolio || defaultPortfolio(worker.skillCategory),
    title: worker.title || titleForSkill(worker.skillCategory),
    verified: worker.verified ?? (worker.completedJobs || 0) >= 5,
  });
});

function titleForSkill(skill) {
  const map = {
    "Tailoring & Stitching": "Master Tailor",
    "Baking & Home Food": "Home Baker",
    "Home Tutoring": "Tutor",
    Beautician: "Beautician",
    "Electrical Work": "Electrician",
    Plumbing: "Plumber",
    Cleaning: "Home Cleaner",
  };
  return map[skill] || "Skilled Worker";
}

function defaultTags(skill) {
  const map = {
    "Tailoring & Stitching": ["Womenswear", "Alterations", "Everyday"],
    "Baking & Home Food": ["Cakes", "Dawat", "Home-style"],
    "Home Tutoring": ["O/A Levels", "Math", "Physics"],
    Beautician: ["Bridal", "Mehndi", "Facial"],
    "Electrical Work": ["Wiring", "Fans", "Sockets"],
    Plumbing: ["Leak fix", "Install", "Urgent"],
    Cleaning: ["Deep clean", "Weekly", "Move-out"],
  };
  return map[skill] || ["Local", "Trusted"];
}

function defaultServices(skill) {
  const map = {
    "Tailoring & Stitching": [
      { name: "Simple Suit Stitching", detail: "Standard 2-piece shalwar kameez", price: "Rs. 1,500" },
      { name: "Fancy Suit (Embroidery)", detail: "Intricate designs, heavy fabric", price: "Rs. 3,500+" },
      { name: "Urgent Alterations", detail: "Same day service", price: "Rs. 500" },
    ],
    "Baking & Home Food": [
      { name: "Birthday cake (1kg)", detail: "Custom frosting", price: "Rs. 2,500" },
      { name: "Dawat tray", detail: "Serves 8–10", price: "Rs. 4,000" },
      { name: "Samosa pack (25)", detail: "Fresh fried", price: "Rs. 800" },
    ],
    "Home Tutoring": [
      { name: "Weekly tutoring", detail: "3 sessions / week", price: "Rs. 4,500" },
      { name: "Exam crash course", detail: "2 weeks intensive", price: "Rs. 6,000" },
      { name: "Single session", detail: "90 minutes", price: "Rs. 800" },
    ],
  };
  return (
    map[skill] || [
      { name: "Standard service", detail: "Discuss details in chat after match", price: "Open bid" },
      { name: "Urgent visit", detail: "Same-day when available", price: "Rs. 500+" },
    ]
  );
}

function defaultPortfolio(skill) {
  const map = {
    "Tailoring & Stitching": [
      { title: "Bridal Suit", tone: "maroon" },
      { title: "Eid Collection", tone: "teal" },
    ],
    "Baking & Home Food": [
      { title: "Chocolate cake", tone: "maroon" },
      { title: "Dawat trays", tone: "teal" },
    ],
  };
  return map[skill] || [
    { title: "Recent job", tone: "navy" },
    { title: "Neighborhood work", tone: "teal" },
  ];
}

router.post("/workers", async (req, res) => {
  const { name, skillCategory, zoneId, availability, bio, photoUrl, userId } = req.body || {};
  if (!name || !skillCategory || !zoneId || !availability) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const worker = {
    id: uuid(),
    userId: userId || null,
    name,
    skillCategory,
    zoneId,
    availability,
    bio: bio || null,
    photoUrl: photoUrl || null,
    rating: 0,
    completedJobs: 0,
    isActive: true,
    registeredAt: nowIso(),
  };
  store.write((db) => {
    db.workers.unshift(worker);
    if (userId) {
      const u = db.users.find((x) => x.id === userId);
      if (u) {
        u.workerId = worker.id;
        u.zoneId = zoneId;
      }
    }
  });
  const analysis = await analyzeZoneSkill(zoneId, skillCategory);
  res.status(201).json({ worker, analysis });
});

router.get("/worker/:id/open-needs", (req, res) => {
  const db = store.read();
  const worker = db.workers.find((w) => w.id === req.params.id);
  if (!worker) return res.status(404).json({ error: "Worker not found" });
  const allowed = ADJACENT[worker.zoneId] || [worker.zoneId];
  const open = db.needs
    .filter((n) => n.status === "open" && n.skillCategory === worker.skillCategory && allowed.includes(n.zoneId))
    .map((n) => ({
      ...n,
      bidCount: db.bids.filter((b) => b.needId === n.id).length,
      zone: db.zones.find((z) => z.id === n.zoneId),
    }));
  res.json(open);
});

router.post("/bids", requireAuth, async (req, res) => {
  const { needId, priceRs, timelineDays, note } = req.body || {};
  const db = store.read();
  const need = db.needs.find((n) => n.id === needId);
  const workerId = req.user.workerId || req.body?.workerId;
  const worker = db.workers.find((w) => w.id === workerId);
  if (req.user.role !== "worker") return res.status(403).json({ error: "Only workers can bid" });
  if (!need || need.status !== "open") return res.status(400).json({ error: "Need not open" });
  if (!worker || !worker.isActive) return res.status(400).json({ error: "Worker inactive" });
  if (worker.userId && worker.userId !== req.user.id) {
    return res.status(403).json({ error: "Bid only for your own profile" });
  }
  if (worker.skillCategory !== need.skillCategory) return res.status(400).json({ error: "Skill mismatch" });
  const allowed = ADJACENT[worker.zoneId] || [worker.zoneId];
  if (!allowed.includes(need.zoneId)) {
    return res.status(400).json({ error: "Need outside your zone / adjacent zones" });
  }
  const pending = db.bids.filter((b) => b.workerId === workerId && b.status === "pending");
  if (pending.length >= 3) return res.status(400).json({ error: "Maximum 3 active bids" });
  if (db.bids.some((b) => b.needId === needId && b.workerId === workerId && b.status === "pending")) {
    return res.status(400).json({ error: "Already bid on this need" });
  }
  const bid = {
    id: uuid(),
    needId,
    workerId,
    priceRs: Number(priceRs),
    timelineDays: Number(timelineDays),
    note: note || null,
    status: "pending",
    createdAt: nowIso(),
  };
  store.write((s) => s.bids.unshift(bid));
  if (need.residentUserId) {
    notifyUser(need.residentUserId, {
      type: "bid",
      title: "New bid on your need",
      body: `${worker.name} offered Rs ${bid.priceRs} — ${timelineDays} day(s).`,
      link: `/needs/${need.id}`,
    });
  }
  const analysis = await analyzeZoneSkill(need.zoneId, need.skillCategory);
  res.status(201).json({ bid, analysis });
});

router.get("/bids/need/:needId", (req, res) => {
  const db = store.read();
  res.json(
    db.bids
      .filter((b) => b.needId === req.params.needId)
      .map((b) => ({ ...b, worker: db.workers.find((w) => w.id === b.workerId) }))
  );
});

router.patch("/bids/:id/accept", requireAuth, async (req, res) => {
  let need;
  let bid;
  let worker;
  store.write((db) => {
    bid = db.bids.find((b) => b.id === req.params.id);
    if (!bid || bid.status !== "pending") return;
    need = db.needs.find((n) => n.id === bid.needId);
    if (!need || need.status !== "open") {
      need = null;
      return;
    }
    if (need.residentUserId && need.residentUserId !== req.user.id) {
      need = null;
      bid = null;
      return;
    }
    bid.status = "accepted";
    for (const s of db.bids) {
      if (s.needId === need.id && s.status === "pending") s.status = "closed";
    }
    need.status = "matched";
    need.matchedAt = nowIso();
    need.matchedBidId = bid.id;
    worker = db.workers.find((w) => w.id === bid.workerId);
  });
  if (!need || !bid) return res.status(400).json({ error: "Bid not pending / need not open" });
  if (worker?.userId) {
    notifyUser(worker.userId, {
      type: "match",
      title: "Bid accepted!",
      body: `${need.residentName} accepted your bid. Chat is unlocked.`,
      link: `/needs/${need.id}/chat`,
    });
  }
  const analysis = await analyzeZoneSkill(need.zoneId, need.skillCategory);
  res.json({ need, bid, analysis });
});

/** Cancel a matched booking — reopen need, reject accepted bid. */
router.post("/needs/:id/cancel", requireAuth, async (req, res) => {
  const reason = String(req.body?.reason || "Cancelled by user").slice(0, 200);
  let need;
  let worker;
  store.write((db) => {
    need = db.needs.find((n) => n.id === req.params.id);
    if (!need || need.status !== "matched" || need.jobDone) {
      need = null;
      return;
    }
    const isResidentOwner =
      need.residentUserId === req.user.id ||
      (!need.residentUserId && need.residentName === req.user.name);
    const accepted = db.bids.find((b) => b.id === need.matchedBidId);
    const matchedWorker = accepted ? db.workers.find((w) => w.id === accepted.workerId) : null;
    const isMatchedWorker = matchedWorker?.userId === req.user.id;
    if (!isResidentOwner && !isMatchedWorker) {
      need = null;
      return;
    }
    if (accepted) {
      accepted.status = "cancelled";
      accepted.cancelledAt = nowIso();
      accepted.cancelReason = reason;
    }
    for (const b of db.bids) {
      if (b.needId === need.id && b.status === "closed") b.status = "pending";
    }
    need.status = "open";
    need.matchedAt = null;
    need.matchedBidId = null;
    need.cancelledAt = nowIso();
    need.cancelReason = reason;
    worker = matchedWorker;
  });
  if (!need) return res.status(400).json({ error: "Cannot cancel this booking" });
  if (worker?.userId && worker.userId !== req.user.id) {
    notifyUser(worker.userId, {
      type: "cancel",
      title: "Booking cancelled",
      body: `${need.residentName || "Resident"} cancelled the matched job.`,
      link: `/needs/${need.id}`,
    });
  }
  if (need.residentUserId && need.residentUserId !== req.user.id) {
    notifyUser(need.residentUserId, {
      type: "cancel",
      title: "Booking cancelled",
      body: "The worker cancelled the matched job. Need is open again for bids.",
      link: `/needs/${need.id}`,
    });
  }
  const analysis = await analyzeZoneSkill(need.zoneId, need.skillCategory);
  res.json({ need, analysis });
});

router.post("/ratings", async (req, res) => {
  const { workerId, needId, bidId, stars, comment } = req.body || {};
  if (!workerId || !needId || !bidId || !stars) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  let worker;
  let need;
  let rating;
  store.write((db) => {
    need = db.needs.find((n) => n.id === needId);
    worker = db.workers.find((w) => w.id === workerId);
    if (!need || !worker || need.status !== "matched" || !need.jobDone) return;
    rating = {
      id: uuid(),
      workerId,
      needId,
      bidId,
      stars: Number(stars),
      comment: comment || null,
      ratedAt: nowIso(),
    };
    db.ratings.push(rating);
    const all = db.ratings.filter((r) => r.workerId === workerId);
    worker.rating = Number((all.reduce((s, r) => s + r.stars, 0) / all.length).toFixed(2));
    worker.completedJobs += 1;
    need.status = "completed";
  });
  if (!rating) {
    return res.status(400).json({ error: "Confirm job done before rating" });
  }
  const analysis = await analyzeZoneSkill(need.zoneId, need.skillCategory);
  res.status(201).json({ rating, worker, analysis });
});

router.post("/ai/analyze", async (req, res) => {
  const { zoneId, skillCategory } = req.body || {};
  if (!zoneId || !skillCategory) return res.status(400).json({ error: "zoneId and skillCategory required" });
  res.json(await analyzeZoneSkill(zoneId, skillCategory));
});

router.get("/ai/alerts", (_req, res) => {
  const db = store.read();
  res.json(
    db.alerts
      .filter((a) => a.isActive)
      .map((a) => ({ ...a, zone: db.zones.find((z) => z.id === a.zoneId) }))
  );
});

router.get("/ai/notice/:zoneId", (req, res) => {
  const skill = req.query.skill;
  let rows = store.read().alerts.filter((a) => a.zoneId === req.params.zoneId && a.isActive);
  if (skill) rows = rows.filter((a) => a.skillCategory === skill);
  const alert = rows.find((a) => a.gapLevel === "red") || rows[0];
  if (!alert) return res.status(404).json({ error: "No active alert" });
  res.json(alert);
});

router.get("/ai/alerts/:id", (req, res) => {
  const db = store.read();
  const alert = db.alerts.find((a) => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  res.json({ ...alert, zone: db.zones.find((z) => z.id === alert.zoneId) });
});

router.patch("/ai/alerts/:id/resolve", (req, res) => {
  store.write((db) => {
    const a = db.alerts.find((x) => x.id === req.params.id);
    if (a) {
      a.isActive = false;
      a.resolvedAt = nowIso();
    }
  });
  res.json({ ok: true });
});

router.get("/ai/price", async (req, res) => {
  try {
    const { zoneId, skill, urgency } = req.query;
    if (!zoneId || !skill || !urgency) return res.status(400).json({ error: "Missing parameters" });
    const zone = store.read().zones.find((z) => z.id === zoneId);
    const season = getSeasonForSkill(skill);
    const estimate = await suggestPrice(zone?.displayName || zoneId, skill, season, urgency);
    res.json(estimate);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---- Safe in-app chat (only after match) ----
router.get("/needs/:id/messages", (req, res) => {
  const db = store.read();
  const need = db.needs.find((n) => n.id === req.params.id);
  if (!need) return res.status(404).json({ error: "Need not found" });
  if (!["matched", "completed"].includes(need.status)) {
    return res.status(403).json({ error: "Chat unlocks after a bid is accepted" });
  }
  const accepted = db.bids.find((b) => b.id === need.matchedBidId);
  const worker = accepted ? db.workers.find((w) => w.id === accepted.workerId) : null;
  const zone = db.zones.find((z) => z.id === need.zoneId);
  const messages = (db.messages || [])
    .filter((m) => m.needId === need.id)
    .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
  res.json({ need, messages, worker, zone });
});

router.get("/chats", requireAuth, (req, res) => {
  const db = store.read();
  const user = req.user;
  let needs = [];
  if (user.role === "resident") {
    needs = db.needs.filter(
      (n) =>
        ["matched", "completed"].includes(n.status) &&
        (n.residentUserId === user.id || n.residentName === user.name)
    );
  } else if (user.role === "worker" && user.workerId) {
    const myAccepted = new Set(
      db.bids.filter((b) => b.workerId === user.workerId && b.status === "accepted").map((b) => b.needId)
    );
    needs = db.needs.filter((n) => myAccepted.has(n.id) && ["matched", "completed"].includes(n.status));
  }

  const rows = needs
    .map((n) => {
      const accepted = db.bids.find((b) => b.id === n.matchedBidId);
      const worker = accepted ? db.workers.find((w) => w.id === accepted.workerId) : null;
      const msgs = (db.messages || []).filter((m) => m.needId === n.id);
      const last = msgs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
      const partnerName =
        user.role === "resident" ? worker?.name || "Worker" : n.residentName || "Resident";
      return {
        needId: n.id,
        skillCategory: n.skillCategory,
        status: n.status,
        partnerName,
        preview: last?.body || null,
        updatedAt: last?.createdAt || n.matchedAt || n.createdAt,
      };
    })
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  res.json(rows);
});

router.post("/needs/:id/messages", (req, res) => {
  const { senderUserId, body } = req.body || {};
  if (!senderUserId || !body?.trim()) {
    return res.status(400).json({ error: "senderUserId and body required" });
  }
  const db = store.read();
  const need = db.needs.find((n) => n.id === req.params.id);
  if (!need || !["matched", "completed"].includes(need.status)) {
    return res.status(403).json({ error: "Chat unlocks after a bid is accepted" });
  }
  const user = findUserById(senderUserId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const accepted = db.bids.find((b) => b.id === need.matchedBidId);
  const worker = accepted ? db.workers.find((w) => w.id === accepted.workerId) : null;
  const isResident = need.residentUserId === senderUserId;
  const isWorker = worker && worker.userId === senderUserId;
  if (!isResident && !isWorker) {
    return res.status(403).json({ error: "Only matched parties can chat" });
  }

  const message = {
    id: uuid(),
    needId: need.id,
    senderUserId,
    senderRole: isWorker ? "worker" : "resident",
    senderName: user.name,
    body: String(body).trim().slice(0, 500),
    createdAt: nowIso(),
  };
  store.write((s) => {
    if (!s.messages) s.messages = [];
    s.messages.push(message);
  });
  res.status(201).json(message);
});

router.get("/forecast", (_req, res) => {
  res.json(buildForecast());
});

router.get("/zones/:id/top-workers", (req, res) => {
  const db = store.read();
  const zoneId = req.params.id;
  const rows = db.workers
    .filter((w) => w.zoneId === zoneId && w.isActive)
    .map((w) => {
      const ratings = db.ratings.filter((r) => r.workerId === w.id);
      return { ...w, ...computeTrust(w, ratings), zone: db.zones.find((z) => z.id === w.zoneId) };
    })
    .sort((a, b) => b.trustScore - a.trustScore || b.rating - a.rating)
    .slice(0, 5);
  res.json(rows);
});

router.patch("/workers/:id/availability", async (req, res) => {
  const availableThisWeek = Boolean(req.body?.availableThisWeek);
  let worker;
  store.write((db) => {
    worker = db.workers.find((w) => w.id === req.params.id);
    if (worker) worker.availableThisWeek = availableThisWeek;
  });
  if (!worker) return res.status(404).json({ error: "Worker not found" });
  await analyzeZoneSkill(worker.zoneId, worker.skillCategory);
  res.json(worker);
});

/** Upload worker profile photo as data URL (max ~600KB decoded). */
router.post("/workers/:id/photo", requireAuth, async (req, res) => {
  const { dataUrl } = req.body || {};
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    return res.status(400).json({ error: "dataUrl (image/*) required" });
  }
  if (dataUrl.length > 900_000) {
    return res.status(400).json({ error: "Image too large — use under ~600KB" });
  }

  const db = store.read();
  const worker = db.workers.find((w) => w.id === req.params.id);
  if (!worker) return res.status(404).json({ error: "Worker not found" });
  if (worker.userId && worker.userId !== req.user.id && req.user.workerId !== worker.id) {
    return res.status(403).json({ error: "Only the worker can update this photo" });
  }

  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return res.status(400).json({ error: "Invalid data URL" });
  const ext = match[1].includes("png") ? "png" : match[1].includes("webp") ? "webp" : "jpg";
  const buf = Buffer.from(match[2], "base64");
  const uploadsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const filename = `${worker.id}.${ext}`;
  fs.writeFileSync(path.join(uploadsDir, filename), buf);
  const photoUrl = `/api/uploads/${filename}?t=${Date.now()}`;

  store.write((s) => {
    const w = s.workers.find((x) => x.id === worker.id);
    if (w) w.photoUrl = photoUrl;
  });
  res.json({ ...worker, photoUrl });
});

router.get("/worker/:id/stats", (req, res) => {
  const db = store.read();
  const worker = db.workers.find((w) => w.id === req.params.id);
  if (!worker) return res.status(404).json({ error: "Worker not found" });
  const accepted = db.bids.filter((b) => b.workerId === worker.id && b.status === "accepted");
  const completedNeeds = accepted.filter((b) => {
    const n = db.needs.find((x) => x.id === b.needId);
    return n && n.status === "completed";
  });
  const earnings = completedNeeds.reduce((s, b) => s + (b.priceRs || 0), 0);
  const pendingBids = db.bids.filter((b) => b.workerId === worker.id && b.status === "pending");
  const bidNeedIds = new Set(db.bids.filter((b) => b.workerId === worker.id).map((b) => b.needId));
  res.json({
    earningsRs: earnings,
    completedJobs: completedNeeds.length,
    pendingBids: pendingBids.length,
    bidNeedIds: [...bidNeedIds],
    availableThisWeek: worker.availableThisWeek !== false,
  });
});

router.get("/worker/:id/demand-nearby", (req, res) => {
  const db = store.read();
  const worker = db.workers.find((w) => w.id === req.params.id);
  if (!worker) return res.status(404).json({ error: "Worker not found" });
  const adjacent = ADJACENT[worker.zoneId] || [worker.zoneId];
  const hot = db.alerts
    .filter(
      (a) =>
        a.isActive &&
        a.gapLevel === "red" &&
        a.skillCategory === worker.skillCategory &&
        adjacent.includes(a.zoneId) &&
        a.zoneId !== worker.zoneId
    )
    .map((a) => ({
      ...a,
      zone: db.zones.find((z) => z.id === a.zoneId),
      workerNotice: `📢 ${a.zoneId} ke paas ${a.skillCategory} ki demand zyada hai. Agar aap available ho, Hunar Naqsha par nearby needs dekhein.`,
      reasoning: a.reasoning,
    }));
  res.json(hot);
});

router.patch("/zones/:zoneId/skills/:skill/handle", (req, res) => {
  const skill = decodeURIComponent(req.params.skill);
  let status;
  store.write((db) => {
    status = db.zoneStatus.find((s) => s.zoneId === req.params.zoneId && s.skillCategory === skill);
    if (status) {
      status.communityHandled = true;
      status.handledAt = nowIso();
    }
    for (const a of db.alerts) {
      if (a.zoneId === req.params.zoneId && a.skillCategory === skill && a.isActive) {
        a.isActive = false;
        a.resolvedAt = nowIso();
        a.communityHandled = true;
      }
    }
  });
  if (!status) return res.status(404).json({ error: "Zone skill status not found" });
  res.json(status);
});

// ---- Map (zones + workers + open needs with lat/lng) ----
router.get("/map", (_req, res) => {
  const db = store.read();
  const rank = { red: 3, yellow: 2, green: 1 };
  const zones = db.zones.map((z) => {
    const zs = db.zoneStatus.filter((s) => s.zoneId === z.id);
    const gapLevel = zs.reduce(
      (acc, s) => ((rank[s.gapLevel] || 0) > (rank[acc] || 0) ? s.gapLevel : acc),
      "green"
    );
    return {
      id: z.id,
      displayName: z.displayName,
      urduName: z.urduName,
      lat: z.lat,
      lng: z.lng,
      gapLevel,
      openNeeds: db.needs.filter((n) => n.zoneId === z.id && n.status === "open").length,
    };
  });
  const workers = db.workers
    .filter((w) => w.isActive && w.lat != null)
    .map((w) => ({
      id: w.id,
      name: w.name,
      skillCategory: w.skillCategory,
      zoneId: w.zoneId,
      lat: w.lat,
      lng: w.lng,
      rating: w.rating,
    }));
  const needs = db.needs
    .filter((n) => n.status === "open" && n.lat != null)
    .map((n) => ({
      id: n.id,
      skillCategory: n.skillCategory,
      description: n.description.slice(0, 80),
      urgency: n.urgency,
      zoneId: n.zoneId,
      lat: n.lat,
      lng: n.lng,
    }));
  res.json({ center: MAP_CENTER, zones, workers, needs });
});

// ---- Favorites ----
router.get("/favorites", requireAuth, (req, res) => {
  const db = store.read();
  const ids = req.user.favorites || [];
  const workers = ids
    .map((id) => db.workers.find((w) => w.id === id))
    .filter(Boolean)
    .map((w) => {
      const ratings = db.ratings.filter((r) => r.workerId === w.id);
      return { ...w, ...computeTrust(w, ratings), zone: db.zones.find((z) => z.id === w.zoneId) };
    });
  res.json(workers);
});

router.post("/favorites/:workerId", requireAuth, (req, res) => {
  if (req.user.role !== "resident") {
    return res.status(403).json({ error: "Only residents can favorite workers" });
  }
  const workerId = req.params.workerId;
  const db = store.read();
  if (!db.workers.find((w) => w.id === workerId)) {
    return res.status(404).json({ error: "Worker not found" });
  }
  let favorites = [];
  store.write((s) => {
    const u = s.users.find((x) => x.id === req.user.id);
    if (!u.favorites) u.favorites = [];
    if (!u.favorites.includes(workerId)) u.favorites.push(workerId);
    favorites = u.favorites;
  });
  res.json({ favorites });
});

router.delete("/favorites/:workerId", requireAuth, (req, res) => {
  let favorites = [];
  store.write((s) => {
    const u = s.users.find((x) => x.id === req.user.id);
    if (!u.favorites) u.favorites = [];
    u.favorites = u.favorites.filter((id) => id !== req.params.workerId);
    favorites = u.favorites;
  });
  res.json({ favorites });
});

// ---- In-app notifications ----
router.get("/notifications", requireAuth, (req, res) => {
  const rows = (store.read().notifications || [])
    .filter((n) => n.userId === req.user.id)
    .slice(0, 40);
  res.json(rows);
});

router.patch("/notifications/:id/read", requireAuth, (req, res) => {
  let note;
  store.write((db) => {
    note = (db.notifications || []).find((n) => n.id === req.params.id && n.userId === req.user.id);
    if (note) note.read = true;
  });
  if (!note) return res.status(404).json({ error: "Not found" });
  res.json(note);
});

router.post("/notifications/read-all", requireAuth, (req, res) => {
  store.write((db) => {
    for (const n of db.notifications || []) {
      if (n.userId === req.user.id) n.read = true;
    }
  });
  res.json({ ok: true });
});

export default router;
