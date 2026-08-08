import { store } from "./store.js";
import { nowIso } from "./constants.js";

const BID_TTL_MS = Number(process.env.BID_TTL_MS || 72 * 60 * 60 * 1000);

/** Expire pending bids older than BID_TTL_MS (default 72h). */
export function expireStaleBids(now = Date.now()) {
  let expired = 0;
  store.write((db) => {
    for (const bid of db.bids || []) {
      if (bid.status !== "pending") continue;
      const created = Date.parse(bid.createdAt || 0);
      if (!created || now - created < BID_TTL_MS) continue;
      bid.status = "expired";
      bid.expiredAt = nowIso();
      expired += 1;
    }
  });
  if (expired) console.log(`[maintenance] expired ${expired} stale bid(s)`);
  return expired;
}
