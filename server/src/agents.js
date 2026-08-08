import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuid } from "uuid";
import { store } from "./store.js";
import { nowIso } from "./constants.js";
import { notifyUser } from "./notify.js";

const DEMO_DAYS = Number(process.env.DEMO_DAYS_TO_EID || 11);
const FORCE_PRE_EID = process.env.DEMO_FORCE_PRE_EID !== "false";
const GEMINI_MODELS = (process.env.GEMINI_MODEL || "gemini-2.0-flash,gemini-1.5-flash,gemini-flash-latest")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function agentMode() {
  const key = (process.env.GEMINI_API_KEY || "").trim();
  return {
    mode: key ? "gemini+heuristic" : "heuristic",
    geminiConfigured: Boolean(key),
    models: GEMINI_MODELS,
    forcePreEid: FORCE_PRE_EID,
    daysToEid: DEMO_DAYS,
  };
}

export function getSeasonForSkill(skillCategory, date = new Date()) {
  const d = date.toISOString().slice(0, 10);
  const rows = store.read().seasonalContext || [];
  const hit = rows.find((r) => {
    try {
      const skills = JSON.parse(r.affectedSkills);
      return r.startDate <= d && r.endDate >= d && skills.includes(skillCategory);
    } catch {
      return false;
    }
  });

  if (
    FORCE_PRE_EID &&
    ["Tailoring & Stitching", "Baking & Home Food", "Beautician"].includes(skillCategory)
  ) {
    return {
      seasonFlag: "pre-eid",
      seasonName: hit?.seasonName || "pre-eid-demo",
      demandMultiplier: Number(hit?.demandMultiplier || 3),
      daysToEid: DEMO_DAYS,
    };
  }

  if (!hit) {
    return { seasonFlag: "normal", seasonName: "normal", demandMultiplier: 1, daysToEid: null };
  }

  return {
    seasonFlag: hit.seasonName.includes("eid")
      ? "pre-eid"
      : hit.seasonName.includes("exam")
        ? "exam-season"
        : hit.seasonName.includes("ramadan")
          ? "ramadan"
          : hit.seasonName,
    seasonName: hit.seasonName,
    demandMultiplier: Number(hit.demandMultiplier) || 1,
    daysToEid: hit.seasonName.includes("eid") ? DEMO_DAYS : null,
  };
}

function collectZoneMetrics(zoneId, skillCategory) {
  const db = store.read();
  const openNeedsList = db.needs.filter(
    (n) => n.zoneId === zoneId && n.skillCategory === skillCategory && n.status === "open"
  );
  const openNeeds = openNeedsList.length;
  const openIds = new Set(openNeedsList.map((n) => n.id));

  const activeWorkers = db.workers.filter(
    (w) =>
      w.zoneId === zoneId &&
      w.skillCategory === skillCategory &&
      w.isActive &&
      w.availableThisWeek !== false
  );
  const registeredAll = db.workers.filter(
    (w) => w.zoneId === zoneId && w.skillCategory === skillCategory && w.isActive
  );

  const since48 = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  const needs48 = db.needs.filter(
    (n) => n.zoneId === zoneId && n.skillCategory === skillCategory && n.createdAt >= since48
  );
  // Bids only count toward response if they target currently open needs (demo-accurate)
  const bidsOnOpen = db.bids.filter((b) => openIds.has(b.needId) && b.createdAt >= since48);
  const bids48All = db.bids.filter((b) => {
    const need = db.needs.find((n) => n.id === b.needId);
    return (
      need &&
      need.zoneId === zoneId &&
      need.skillCategory === skillCategory &&
      b.createdAt >= since48
    );
  });

  const since7 = new Date(Date.now() - 7 * 86400 * 1000).toISOString();
  const matchedWeek = db.needs.filter(
    (n) =>
      n.zoneId === zoneId &&
      n.skillCategory === skillCategory &&
      ["matched", "completed"].includes(n.status) &&
      n.matchedAt &&
      n.matchedAt >= since7
  );
  const historyPoints = (db.aiHistory || []).filter(
    (h) => h.zoneId === zoneId && h.skillCategory === skillCategory
  ).length;

  const denom = Math.max(openNeeds, needs48.length, 1);
  const bidResponseRate =
    openNeeds === 0 ? 1 : Number((bidsOnOpen.length / Math.max(openNeeds, 1)).toFixed(3));

  return {
    openNeeds,
    registeredWorkers: activeWorkers.length,
    registeredAll: registeredAll.length,
    unavailableWorkers: registeredAll.length - activeWorkers.length,
    bidsLast48hrs: bidsOnOpen.length,
    bidsAll48hrs: bids48All.length,
    needsLast48hrs: needs48.length,
    bidResponseRate,
    matchedThisWeek: matchedWeek.length,
    historyPoints,
    supplyGap: openNeeds - activeWorkers.length,
  };
}

function confidenceWhy(metrics, judgment) {
  const bits = [];
  if ((metrics.historyPoints || 0) < 3) {
    bits.push(`fewer than 3 historical analyses for this skill×zone (${metrics.historyPoints || 0} so far)`);
  }
  if (metrics.openNeeds < 2 && judgment.gap_level !== "green") {
    bits.push("limited open-need sample size");
  }
  if ((metrics.unavailableWorkers || 0) > 0) {
    bits.push(
      `${metrics.unavailableWorkers} worker(s) marked unavailable this week and excluded from supply`
    );
  }
  if (judgment.confidence === "high" && bits.length === 0) {
    return "Signals agree strongly: open needs, bid response, and season context all point the same way.";
  }
  if (bits.length === 0) {
    return "Judgment uses current snapshot; more history would raise confidence further.";
  }
  return `Confidence is ${judgment.confidence} because ${bits.join("; ")}.`;
}

export function heuristicJudge(metrics, season) {
  const { openNeeds, registeredWorkers, bidResponseRate } = metrics;
  const elevated = season.demandMultiplier >= 1.8;
  const unavailNote =
    (metrics.unavailableWorkers || 0) > 0
      ? ` (${metrics.unavailableWorkers} more registered but marked unavailable)`
      : "";

  // Acute: many open needs, almost no bids, elevated season
  if (openNeeds > 2 && bidResponseRate < 0.25 && elevated) {
    return {
      gap_level: "red",
      reasoning: `${openNeeds} open requests with only ${registeredWorkers} available worker(s)${unavailNote} and bid response rate ${(bidResponseRate * 100).toFixed(0)}% in 48 hours. Combined with ${season.seasonFlag} demand (~${season.demandMultiplier}x)${season.daysToEid != null ? ` and Eid in ${season.daysToEid} days` : ""}, this is an acute shortage forming now — not after peak.`,
      action: "Share a community notice now to recruit 1–2 more workers in this zone before demand peaks.",
      confidence: "high",
      source: "heuristic",
    };
  }

  // Zero available workers with open demand in elevated season
  if (openNeeds >= 2 && registeredWorkers === 0 && elevated) {
    return {
      gap_level: "red",
      reasoning: `${openNeeds} open ${season.seasonFlag} needs and 0 available workers${unavailNote}. Demand multiplier is ${season.demandMultiplier}x — the mohalla has no live supply for this skill right now.`,
      action: "Share a community notice and invite workers from adjacent galis to register or turn availability on.",
      confidence: "high",
      source: "heuristic",
    };
  }

  if (openNeeds > registeredWorkers && elevated) {
    return {
      gap_level: "yellow",
      reasoning: `${openNeeds} open needs vs ${registeredWorkers} available worker(s)${unavailNote} while season demand is elevated (${season.demandMultiplier}x). Bid response rate is ${(bidResponseRate * 100).toFixed(0)}%. Individually manageable, but the combination signals a gap forming.`,
      action: "Nudge nearby workers to bid on open needs and invite one more registration in this skill.",
      confidence: metrics.historyPoints < 3 ? "medium" : "high",
      source: "heuristic",
    };
  }

  if (bidResponseRate >= 0.7 && registeredWorkers >= openNeeds) {
    return {
      gap_level: "green",
      reasoning: `Supply is covering demand: ${registeredWorkers} available worker(s) for ${openNeeds} open need(s) with healthy bid response (${(bidResponseRate * 100).toFixed(0)}%). Season flag is ${season.seasonFlag}, but current matching looks stable.`,
      action: "Keep monitoring; no mobilization needed.",
      confidence: "high",
      source: "heuristic",
    };
  }

  if (openNeeds >= 2 && (registeredWorkers <= 2 || bidResponseRate < 0.4)) {
    return {
      gap_level: "yellow",
      reasoning: `${openNeeds} open needs, ${registeredWorkers} available workers, bid response ${(bidResponseRate * 100).toFixed(0)}%. Together these show early friction even if no single number is extreme.`,
      action: "See open needs and encourage bids from adjacent zones.",
      confidence: "medium",
      source: "heuristic",
    };
  }

  return {
    gap_level: "green",
    reasoning: `Zone looks balanced for now (${openNeeds} open / ${registeredWorkers} available workers, response ${(bidResponseRate * 100).toFixed(0)}%).`,
    action: "No action required.",
    confidence: metrics.historyPoints < 3 ? "medium" : "high",
    source: "heuristic",
  };
}

function normalizeJudgment(raw, fallback) {
  if (!raw || typeof raw !== "object") return fallback;
  const level = String(raw.gap_level || raw.gapLevel || "")
    .toLowerCase()
    .trim();
  if (!["green", "yellow", "red"].includes(level)) return fallback;
  const confidence = String(raw.confidence || "medium").toLowerCase();
  return {
    gap_level: level,
    reasoning: String(raw.reasoning || fallback.reasoning).slice(0, 600),
    action: String(raw.action || fallback.action).slice(0, 240),
    confidence: ["low", "medium", "high"].includes(confidence) ? confidence : "medium",
    source: "gemini",
  };
}

async function callGemini(zoneName, skillCategory, metrics, season) {
  const key = (process.env.GEMINI_API_KEY || "").trim();
  if (!key) return null;

  const prompt = `You are GapDetectionAgent for Hunar Naqsha, a Pakistani mohalla skill marketplace.
Fuse ALL signals — do not only summarize one number. Same counts can be green or red depending on season.

ZONE: ${zoneName}
SKILL: ${skillCategory}
TODAY: ${new Date().toISOString().slice(0, 10)}

METRICS:
- open_needs: ${metrics.openNeeds}
- available_workers: ${metrics.registeredWorkers}
- unavailable_workers: ${metrics.unavailableWorkers}
- bids_on_open_needs_48h: ${metrics.bidsLast48hrs}
- bid_response_rate: ${(metrics.bidResponseRate * 100).toFixed(0)}%
- matched_this_week: ${metrics.matchedThisWeek}
- supply_gap (open - available): ${metrics.supplyGap}

SEASON:
- flag: ${season.seasonFlag}
- name: ${season.seasonName}
- demand_multiplier: ${season.demandMultiplier}x
- days_to_eid: ${season.daysToEid ?? "n/a"}

Rules of thumb:
- red = acute shortage needing community notice (many open needs + weak bids OR 0 available workers in elevated season)
- yellow = gap forming
- green = balanced

Return JSON only:
{"gap_level":"green|yellow|red","reasoning":"2-3 sentences with numbers + combination","action":"one concrete next step","confidence":"low|medium|high"}`;

  const genAI = new GoogleGenerativeAI(key);
  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) continue;
      const parsed = JSON.parse(match[0]);
      console.log(`[GapAgent] Gemini OK via ${modelName}`);
      return parsed;
    } catch (err) {
      console.warn(`[GapAgent] Gemini ${modelName} failed:`, err.message);
    }
  }
  return null;
}

function templateNotice(zoneName, skill, openNeeds, season) {
  return `📢 ${zoneName} mein ${skill} ki zaroorat hai — ${openNeeds} families ke orders pending hain aur response slow hai (${season.seasonFlag}). Agar aap ya aap ke mohalle mein koi yeh kaam karte hain, Hunar Naqsha par register karen ya yeh message share karen.`;
}

async function draftNotice(zoneName, skill, metrics, season, reasoning) {
  const key = (process.env.GEMINI_API_KEY || "").trim();
  if (!key) return templateNotice(zoneName, skill, metrics.openNeeds, season);

  const prompt = `Write a short Pakistani WhatsApp community notice (Urdu+English mix OK).
Zone: ${zoneName}; Skill: ${skill}; Open needs: ${metrics.openNeeds}; Season: ${season.seasonName}; Reason: ${reasoning}
Max 4 lines, one emoji max, one CTA to register on Hunar Naqsha. JSON: {"notice_text":"..."}`;

  const genAI = new GoogleGenerativeAI(key);
  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: 0.4, responseMimeType: "application/json" },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) continue;
      const notice = JSON.parse(match[0]).notice_text;
      if (notice) return String(notice).slice(0, 500);
    } catch (err) {
      console.warn(`[NoticeAgent] ${modelName} failed:`, err.message);
    }
  }
  return templateNotice(zoneName, skill, metrics.openNeeds, season);
}

function notifyResidentsOfAlert(zoneId, skillCategory, alert) {
  const db = store.read();
  const residents = (db.users || []).filter((u) => u.role === "resident" && u.zoneId === zoneId);
  for (const u of residents) {
    notifyUser(u.id, {
      type: "gap",
      title: `${alert.gapLevel === "red" ? "Acute shortage" : "Gap forming"} · ${skillCategory}`,
      body: alert.reasoning.slice(0, 140),
      link: `/alerts/${alert.id}`,
    });
  }
}

export async function analyzeZoneSkill(zoneId, skillCategory) {
  const zone = store.read().zones.find((z) => z.id === zoneId);
  if (!zone) throw new Error("Zone not found");

  const before = store
    .read()
    .zoneStatus.find((s) => s.zoneId === zoneId && s.skillCategory === skillCategory);

  const metrics = collectZoneMetrics(zoneId, skillCategory);
  const season = getSeasonForSkill(skillCategory);
  const heuristic = heuristicJudge(metrics, season);
  const geminiRaw = await callGemini(zone.displayName, skillCategory, metrics, season);
  const judgment = normalizeJudgment(geminiRaw, heuristic);
  const why = confidenceWhy(metrics, judgment);

  const payload = {
    id: uuid(),
    zoneId,
    skillCategory,
    gapLevel: judgment.gap_level,
    openNeedsCount: metrics.openNeeds,
    registeredWorkersCount: metrics.registeredWorkers,
    bidResponseRate: metrics.bidResponseRate,
    seasonFlag: season.seasonFlag,
    aiReasoning: judgment.reasoning,
    aiAction: judgment.action,
    confidence: judgment.confidence,
    confidenceWhy: why,
    agentSource: judgment.source || "heuristic",
    communityHandled: before?.communityHandled || false,
    lastAnalyzed: nowIso(),
  };

  let alertRow = null;
  store.write((db) => {
    if (!db.zoneStatus) db.zoneStatus = [];
    if (!db.aiHistory) db.aiHistory = [];
    if (!db.alerts) db.alerts = [];

    const idx = db.zoneStatus.findIndex(
      (s) => s.zoneId === zoneId && s.skillCategory === skillCategory
    );
    if (idx >= 0) {
      payload.id = db.zoneStatus[idx].id;
      payload.communityHandled = db.zoneStatus[idx].communityHandled || false;
      db.zoneStatus[idx] = payload;
    } else {
      db.zoneStatus.push(payload);
    }

    db.aiHistory.unshift({
      id: uuid(),
      zoneId,
      skillCategory,
      gapLevel: judgment.gap_level,
      reasoning: judgment.reasoning,
      action: judgment.action,
      confidence: judgment.confidence,
      confidenceWhy: why,
      agentSource: payload.agentSource,
      createdAt: nowIso(),
    });

    for (const a of db.alerts) {
      if (a.zoneId === zoneId && a.skillCategory === skillCategory && a.isActive) {
        a.isActive = false;
        a.resolvedAt = nowIso();
      }
    }
  });

  if (
    !payload.communityHandled &&
    (judgment.gap_level === "yellow" || judgment.gap_level === "red")
  ) {
    const notice =
      judgment.gap_level === "red"
        ? await draftNotice(zone.displayName, skillCategory, metrics, season, judgment.reasoning)
        : null;
    alertRow = {
      id: uuid(),
      zoneId,
      skillCategory,
      gapLevel: judgment.gap_level,
      reasoning: judgment.reasoning,
      action: judgment.action,
      confidence: judgment.confidence,
      confidenceWhy: why,
      agentSource: payload.agentSource,
      whatsappNotice: notice,
      isActive: true,
      createdAt: nowIso(),
      resolvedAt: null,
    };
    store.write((db) => {
      db.alerts.unshift(alertRow);
    });
    notifyResidentsOfAlert(zoneId, skillCategory, alertRow);
  }

  const history = store
    .read()
    .aiHistory.filter((h) => h.zoneId === zoneId && h.skillCategory === skillCategory)
    .slice(0, 7)
    .reverse();

  return {
    ...payload,
    alert: alertRow,
    metrics,
    season,
    history,
    before: before
      ? { gapLevel: before.gapLevel, openNeedsCount: before.openNeedsCount, registeredWorkersCount: before.registeredWorkersCount }
      : null,
    after: {
      gapLevel: payload.gapLevel,
      openNeedsCount: payload.openNeedsCount,
      registeredWorkersCount: payload.registeredWorkersCount,
    },
    agent: agentMode(),
  };
}

export function buildForecast() {
  const skills = [
    "Tailoring & Stitching",
    "Baking & Home Food",
    "Beautician",
    "Home Tutoring",
    "Cleaning",
  ];
  return skills
    .map((skill) => {
      const season = getSeasonForSkill(skill);
      if (season.demandMultiplier <= 1.1) return null;
      return {
        skillCategory: skill,
        seasonFlag: season.seasonFlag,
        demandMultiplier: season.demandMultiplier,
        daysToEid: season.daysToEid,
        headline:
          season.daysToEid != null
            ? `${skill.split(" ")[0]} demand ~${season.demandMultiplier}× before Eid (${season.daysToEid} days)`
            : `${skill.split(" ")[0]} demand elevated (~${season.demandMultiplier}×) — ${season.seasonFlag}`,
      };
    })
    .filter(Boolean);
}
