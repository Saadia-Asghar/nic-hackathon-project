import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuid } from "uuid";
import { store } from "./store.js";
import { nowIso } from "./constants.js";

const DEMO_DAYS = Number(process.env.DEMO_DAYS_TO_EID || 11);
const FORCE_PRE_EID = process.env.DEMO_FORCE_PRE_EID !== "false";

export function getSeasonForSkill(skillCategory, date = new Date()) {
  const d = date.toISOString().slice(0, 10);
  const rows = store.read().seasonalContext;
  const hit = rows.find((r) => {
    const skills = JSON.parse(r.affectedSkills);
    return r.startDate <= d && r.endDate >= d && skills.includes(skillCategory);
  });

  if (
    FORCE_PRE_EID &&
    ["Tailoring & Stitching", "Baking & Home Food", "Beautician"].includes(skillCategory)
  ) {
    return {
      seasonFlag: "pre-eid",
      seasonName: hit?.seasonName || "pre-eid-demo",
      demandMultiplier: hit?.demandMultiplier || 3,
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
    demandMultiplier: hit.demandMultiplier,
    daysToEid: hit.seasonName.includes("eid") ? DEMO_DAYS : null,
  };
}

function collectZoneMetrics(zoneId, skillCategory) {
  const db = store.read();
  const openNeeds = db.needs.filter(
    (n) => n.zoneId === zoneId && n.skillCategory === skillCategory && n.status === "open"
  );
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
  const needIds = db.needs
    .filter((n) => n.zoneId === zoneId && n.skillCategory === skillCategory)
    .map((n) => n.id);
  const bids48 = db.bids.filter((b) => needIds.includes(b.needId) && b.createdAt >= since48);
  const since7 = new Date(Date.now() - 7 * 86400 * 1000).toISOString();
  const matchedWeek = db.needs.filter(
    (n) =>
      n.zoneId === zoneId &&
      n.skillCategory === skillCategory &&
      ["matched", "completed"].includes(n.status) &&
      n.matchedAt &&
      n.matchedAt >= since7
  );
  const historyPoints = db.aiHistory.filter(
    (h) => h.zoneId === zoneId && h.skillCategory === skillCategory
  ).length;

  const bidResponseRate =
    needs48.length === 0
      ? openNeeds.length === 0
        ? 1
        : bids48.length / Math.max(openNeeds.length, 1)
      : bids48.length / needs48.length;

  return {
    openNeeds: openNeeds.length,
    registeredWorkers: activeWorkers.length,
    registeredAll: registeredAll.length,
    unavailableWorkers: registeredAll.length - activeWorkers.length,
    bidsLast48hrs: bids48.length,
    needsLast48hrs: needs48.length,
    bidResponseRate: Number(bidResponseRate.toFixed(3)),
    matchedThisWeek: matchedWeek.length,
    historyPoints,
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
    bits.push(`${metrics.unavailableWorkers} worker(s) marked unavailable this week and excluded from supply`);
  }
  if (judgment.confidence === "high" && bits.length === 0) {
    return "Signals agree strongly: open needs, bid response, and season context all point the same way.";
  }
  if (bits.length === 0) {
    return "Judgment uses current snapshot; more history would raise confidence further.";
  }
  return `Confidence is ${judgment.confidence} because ${bits.join("; ")}.`;
}

function heuristicJudge(metrics, season) {
  const { openNeeds, registeredWorkers, bidResponseRate } = metrics;
  const elevated = season.demandMultiplier >= 1.8;
  const unavailNote =
    (metrics.unavailableWorkers || 0) > 0
      ? ` (${metrics.unavailableWorkers} more registered but marked unavailable)`
      : "";

  if (bidResponseRate < 0.2 && openNeeds > 2 && elevated) {
    return {
      gap_level: "red",
      reasoning: `${openNeeds} open requests with only ${registeredWorkers} available worker(s)${unavailNote} and bid response rate ${(bidResponseRate * 100).toFixed(0)}% in 48 hours. Combined with ${season.seasonFlag} demand (~${season.demandMultiplier}x)${season.daysToEid != null ? ` and Eid in ${season.daysToEid} days` : ""}, this is an acute shortage forming now — not after peak.`,
      action: "Share a community notice now to recruit 1–2 more workers in this zone before demand peaks.",
      confidence: "high",
    };
  }

  if (openNeeds > registeredWorkers && elevated) {
    return {
      gap_level: "yellow",
      reasoning: `${openNeeds} open needs vs ${registeredWorkers} available worker(s)${unavailNote} while season demand is elevated (${season.demandMultiplier}x). Bid response rate is ${(bidResponseRate * 100).toFixed(0)}%. Individually manageable, but the combination signals a gap forming.`,
      action: "Nudge nearby workers to bid on open needs and invite one more registration in this skill.",
      confidence: metrics.historyPoints < 3 ? "medium" : "high",
    };
  }

  if (bidResponseRate >= 0.7 && registeredWorkers >= openNeeds) {
    return {
      gap_level: "green",
      reasoning: `Supply is covering demand: ${registeredWorkers} available worker(s) for ${openNeeds} open need(s) with healthy bid response (${(bidResponseRate * 100).toFixed(0)}%). Season flag is ${season.seasonFlag}, but current matching looks stable.`,
      action: "Keep monitoring; no mobilization needed.",
      confidence: "high",
    };
  }

  if (openNeeds >= 2 && (registeredWorkers <= 2 || bidResponseRate < 0.4)) {
    return {
      gap_level: "yellow",
      reasoning: `${openNeeds} open needs, ${registeredWorkers} available workers, bid response ${(bidResponseRate * 100).toFixed(0)}%. Together these show early friction even if no single number is extreme.`,
      action: "See open needs and encourage bids from adjacent zones.",
      confidence: "medium",
    };
  }

  return {
    gap_level: "green",
    reasoning: `Zone looks balanced for now (${openNeeds} open / ${registeredWorkers} available workers, response ${(bidResponseRate * 100).toFixed(0)}%).`,
    action: "No action required.",
    confidence: metrics.historyPoints < 3 ? "medium" : "high",
  };
}

async function callGemini(zoneName, skillCategory, metrics, season) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `You are an AI analyzing skill supply and demand in a Pakistani neighborhood.
ZONE: ${zoneName}
SKILL: ${skillCategory}
TODAY: ${new Date().toISOString().slice(0, 10)}
CURRENT DATA:
- Open need posts: ${metrics.openNeeds}
- Registered active workers: ${metrics.registeredWorkers}
- Bids in last 48 hours: ${metrics.bidsLast48hrs}
- Bid response rate: ${(metrics.bidResponseRate * 100).toFixed(0)}%
- Needs matched this week: ${metrics.matchedThisWeek}
SEASONAL CONTEXT:
- Current season: ${season.seasonName}
- Days to next Eid: ${season.daysToEid ?? "not imminent"}
- Demand multiplier: ${season.demandMultiplier}x
Reason across ALL factors together. Return JSON only:
{"gap_level":"green|yellow|red","reasoning":"2-3 sentences naming specific numbers and combination","action":"one sentence","confidence":"low|medium|high"}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch (err) {
    console.warn("Gemini failed:", err.message);
    return null;
  }
}

function templateNotice(zoneName, skill, openNeeds, season) {
  return `📢 ${zoneName} mein ${skill} ki zaroorat hai — ${openNeeds} families ke orders pending hain aur response slow hai (${season.seasonFlag}). Agar aap ya aap ke mohalle mein koi yeh kaam karte hain, Hunar Naqsha par register karen ya yeh message share karen.`;
}

async function draftNotice(zoneName, skill, metrics, season, reasoning) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return templateNotice(zoneName, skill, metrics.openNeeds, season);
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Write a short Pakistani WhatsApp community notice (Urdu+English mix OK).
Zone: ${zoneName}; Skill: ${skill}; Open needs: ${metrics.openNeeds}; Season: ${season.seasonName}; Reason: ${reasoning}
Max 4 lines, one emoji max, one CTA. JSON: {"notice_text":"..."}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return templateNotice(zoneName, skill, metrics.openNeeds, season);
    return JSON.parse(match[0]).notice_text || templateNotice(zoneName, skill, metrics.openNeeds, season);
  } catch {
    return templateNotice(zoneName, skill, metrics.openNeeds, season);
  }
}

export async function analyzeZoneSkill(zoneId, skillCategory) {
  const zone = store.read().zones.find((z) => z.id === zoneId);
  if (!zone) throw new Error("Zone not found");

  const metrics = collectZoneMetrics(zoneId, skillCategory);
  const season = getSeasonForSkill(skillCategory);
  const judgment =
    (await callGemini(zone.displayName, skillCategory, metrics, season)) || heuristicJudge(metrics, season);
  const why = confidenceWhy(metrics, judgment);

  const existing = store
    .read()
    .zoneStatus.find((s) => s.zoneId === zoneId && s.skillCategory === skillCategory);

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
    communityHandled: existing?.communityHandled || false,
    lastAnalyzed: nowIso(),
  };

  let alertRow = null;
  store.write((db) => {
    const idx = db.zoneStatus.findIndex((s) => s.zoneId === zoneId && s.skillCategory === skillCategory);
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
      whatsappNotice: notice,
      isActive: true,
      createdAt: nowIso(),
      resolvedAt: null,
    };
    store.write((db) => {
      db.alerts.unshift(alertRow);
    });
  }

  const history = store
    .read()
    .aiHistory.filter((h) => h.zoneId === zoneId && h.skillCategory === skillCategory)
    .slice(0, 7)
    .reverse();

  return { ...payload, alert: alertRow, metrics, season, history };
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
