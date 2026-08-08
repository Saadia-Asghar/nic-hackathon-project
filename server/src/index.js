import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import router from "./routes.js";
import { seed } from "./seed.js";
import { store } from "./store.js";
import { analyzeZoneSkill, agentMode } from "./agents.js";
import { expireStaleBids } from "./maintenance.js";
import { validateEnv } from "./env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envReport = validateEnv();
const app = express();
const PORT = Number(process.env.PORT || 3001);
const SCAN_MS = Number(process.env.AI_SCAN_MS || 5 * 60 * 1000);
const isProd = process.env.NODE_ENV === "production";

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || !isProd || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX || 400),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests — try again shortly" },
  })
);
app.use(express.json({ limit: "3mb" }));

const uploadsDir = path.join(__dirname, "..", "data", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/api/uploads", express.static(uploadsDir));
app.use("/api", router);

const clientDist = process.env.CLIENT_DIST
  ? path.resolve(process.env.CLIENT_DIST)
  : path.resolve(__dirname, "..", "..", "client", "dist");

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    const indexHtml = path.join(clientDist, "index.html");
    if (fs.existsSync(indexHtml)) return res.sendFile(indexHtml);
    return next();
  });
  console.log("[static] Serving client from", clientDist);
} else {
  console.warn("[static] client/dist not found — API-only mode. Run `npm run build` for production UI.");
}

async function runGapScan() {
  expireStaleBids();
  const db = store.read();
  const pairs = new Set();
  for (const n of db.needs.filter((x) => x.status === "open")) {
    pairs.add(`${n.zoneId}|||${n.skillCategory}`);
  }
  for (const w of db.workers.filter((x) => x.isActive)) {
    pairs.add(`${w.zoneId}|||${w.skillCategory}`);
  }
  for (const key of pairs) {
    const [zoneId, skillCategory] = key.split("|||");
    try {
      await analyzeZoneSkill(zoneId, skillCategory);
    } catch (e) {
      console.warn("Gap scan failed", zoneId, skillCategory, e.message);
    }
  }
  console.log(`AI gap scan finished (${pairs.size} zone-skills)`);
}

async function boot() {
  console.log("[boot] store engine:", store.engine, "→", store.path);
  console.log("[boot] agent:", agentMode().mode);
  for (const w of envReport.warnings) console.warn("[env]", w);
  for (const e of envReport.errors) console.error("[env]", e);
  if (envReport.errors.length && isProd) {
    console.error("[boot] Refusing to start in production with invalid env");
    process.exit(1);
  }

  if (store.read().zones.length === 0) {
    console.log("No data — seeding demo dataset...");
    await seed();
  }

  expireStaleBids();

  app.listen(PORT, () => {
    console.log(`Hunar Naqsha API on http://localhost:${PORT}`);
  });

  setTimeout(() => {
    runGapScan().catch(console.error);
  }, 15_000);
  setInterval(() => {
    runGapScan().catch(console.error);
  }, SCAN_MS);
}

boot().catch((e) => {
  console.error(e);
  process.exit(1);
});
