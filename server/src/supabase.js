import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = (process.env.SUPABASE_URL || "").trim();
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const anonKey = (process.env.SUPABASE_ANON_KEY || "").trim();

export function supabaseEnabled() {
  return Boolean(url && (serviceKey || anonKey));
}

export function getSupabase() {
  if (!supabaseEnabled()) return null;
  return createClient(url, serviceKey || anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function supabaseStatus() {
  return {
    configured: supabaseEnabled(),
    url: url || null,
    usingServiceRole: Boolean(serviceKey),
  };
}

/** Push current JSON store snapshot into Supabase (best-effort). */
export async function syncStoreToSupabase(db) {
  const sb = getSupabase();
  if (!sb || !db) return { ok: false, reason: "supabase_not_configured" };

  const errors = [];

  async function upsert(table, rows, onConflict = "id") {
    if (!rows?.length) return;
    const { error } = await sb.from(table).upsert(rows, { onConflict });
    if (error) errors.push(`${table}: ${error.message}`);
  }

  try {
    await upsert(
      "zones",
      (db.zones || []).map((z) => ({
        id: z.id,
        display_name: z.displayName,
        urdu_name: z.urduName,
        description: z.description,
        lat: z.lat,
        lng: z.lng,
      }))
    );

    await upsert(
      "app_users",
      (db.users || []).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        password_hash: u.passwordHash,
        role: u.role,
        zone_id: u.zoneId,
        worker_id: u.workerId,
        favorites: u.favorites || [],
        created_at: u.createdAt,
      }))
    );

    await upsert(
      "workers",
      (db.workers || []).map((w) => ({
        id: w.id,
        user_id: w.userId || null,
        name: w.name,
        title: w.title || null,
        skill_category: w.skillCategory,
        zone_id: w.zoneId,
        availability: w.availability,
        bio: w.bio,
        photo_url: w.photoUrl,
        rating: w.rating,
        completed_jobs: w.completedJobs,
        is_active: w.isActive,
        available_this_week: w.availableThisWeek !== false,
        verified: Boolean(w.verified),
        tags: w.tags || [],
        services: w.services || [],
        portfolio: w.portfolio || [],
        lat: w.lat,
        lng: w.lng,
        registered_at: w.registeredAt,
      }))
    );

    await upsert(
      "needs",
      (db.needs || []).map((n) => ({
        id: n.id,
        skill_category: n.skillCategory,
        description: n.description,
        budget_range: n.budgetRange,
        urgency: n.urgency,
        zone_id: n.zoneId,
        resident_name: n.residentName,
        resident_user_id: n.residentUserId || null,
        status: n.status,
        matched_at: n.matchedAt,
        matched_bid_id: n.matchedBidId,
        job_done: Boolean(n.jobDone),
        job_done_at: n.jobDoneAt || null,
        lat: n.lat,
        lng: n.lng,
        created_at: n.createdAt,
      }))
    );

    await upsert(
      "bids",
      (db.bids || []).map((b) => ({
        id: b.id,
        need_id: b.needId,
        worker_id: b.workerId,
        price_rs: b.priceRs,
        timeline_days: b.timelineDays,
        note: b.note,
        status: b.status,
        created_at: b.createdAt,
      }))
    );

    await upsert(
      "zone_status",
      (db.zoneStatus || []).map((s) => ({
        id: s.id,
        zone_id: s.zoneId,
        skill_category: s.skillCategory,
        gap_level: s.gapLevel,
        open_needs_count: s.openNeedsCount,
        registered_workers_count: s.registeredWorkersCount,
        bid_response_rate: s.bidResponseRate,
        season_flag: s.seasonFlag,
        ai_reasoning: s.aiReasoning,
        ai_action: s.aiAction,
        confidence: s.confidence,
        confidence_why: s.confidenceWhy,
        agent_source: s.agentSource,
        community_handled: Boolean(s.communityHandled),
        last_analyzed: s.lastAnalyzed,
      })),
      "zone_id,skill_category"
    );

    await upsert(
      "alerts",
      (db.alerts || []).map((a) => ({
        id: a.id,
        zone_id: a.zoneId,
        skill_category: a.skillCategory,
        gap_level: a.gapLevel,
        reasoning: a.reasoning,
        action: a.action,
        confidence: a.confidence,
        confidence_why: a.confidenceWhy,
        agent_source: a.agentSource,
        whatsapp_notice: a.whatsappNotice,
        is_active: a.isActive,
        created_at: a.createdAt,
        resolved_at: a.resolvedAt,
      }))
    );

    await upsert(
      "ratings",
      (db.ratings || []).map((r) => ({
        id: r.id,
        worker_id: r.workerId,
        need_id: r.needId,
        bid_id: r.bidId,
        stars: r.stars,
        comment: r.comment,
        reviewer_name: r.reviewerName,
        reviewer_zone: r.reviewerZone,
        rated_at: r.ratedAt,
      }))
    );

    await upsert(
      "messages",
      (db.messages || []).map((m) => ({
        id: m.id,
        need_id: m.needId,
        sender_user_id: m.senderUserId,
        sender_role: m.senderRole,
        sender_name: m.senderName,
        body: m.body,
        created_at: m.createdAt,
      }))
    );

    await upsert(
      "notifications",
      (db.notifications || []).map((n) => ({
        id: n.id,
        user_id: n.userId,
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        read: Boolean(n.read),
        created_at: n.createdAt,
      }))
    );

    await upsert(
      "ai_history",
      (db.aiHistory || []).slice(0, 100).map((h) => ({
        id: h.id,
        zone_id: h.zoneId,
        skill_category: h.skillCategory,
        gap_level: h.gapLevel,
        reasoning: h.reasoning,
        action: h.action,
        confidence: h.confidence,
        confidence_why: h.confidenceWhy,
        agent_source: h.agentSource,
        created_at: h.createdAt,
      }))
    );

    if (errors.length) {
      console.warn("[Supabase sync] partial errors:", errors.slice(0, 5));
      return { ok: false, errors };
    }
    console.log("[Supabase sync] snapshot pushed");
    return { ok: true };
  } catch (e) {
    console.warn("[Supabase sync] failed:", e.message);
    return { ok: false, reason: e.message };
  }
}
