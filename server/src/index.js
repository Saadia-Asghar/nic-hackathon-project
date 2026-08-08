import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes.js";
import { seed } from "./seed.js";
import { store } from "./store.js";
import { analyzeZoneSkill } from "./agents.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3001);
const SCAN_MS = Number(process.env.AI_SCAN_MS || 5 * 60 * 1000);

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/api", router);

const clientDist = path.join(__dirname, "..", "..", "client", "dist");
app.use(express.static(clientDist));

async function runGapScan() {
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
  if (store.read().zones.length === 0) {
    console.log("No data — seeding demo dataset...");
    await seed();
  }
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
