import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DatabaseSync } from "node:sqlite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "hunar.db");
const legacyJsonPath = path.join(dataDir, "hunar.json");

const empty = () => ({
  users: [],
  zones: [],
  needs: [],
  workers: [],
  bids: [],
  zoneStatus: [],
  alerts: [],
  ratings: [],
  seasonalContext: [],
  aiHistory: [],
  messages: [],
  notifications: [],
});

function ensureArrays(data) {
  if (!data.users) data.users = [];
  if (!data.messages) data.messages = [];
  if (!data.notifications) data.notifications = [];
  if (!data.zones) data.zones = [];
  if (!data.needs) data.needs = [];
  if (!data.workers) data.workers = [];
  if (!data.bids) data.bids = [];
  if (!data.zoneStatus) data.zoneStatus = [];
  if (!data.alerts) data.alerts = [];
  if (!data.ratings) data.ratings = [];
  if (!data.seasonalContext) data.seasonalContext = [];
  if (!data.aiHistory) data.aiHistory = [];
  return data;
}

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const sql = new DatabaseSync(dbPath);
sql.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  CREATE TABLE IF NOT EXISTS snapshot (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    payload TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

function loadFromSqlite() {
  const row = sql.prepare("SELECT payload FROM snapshot WHERE id = 1").get();
  if (!row?.payload) return null;
  try {
    return ensureArrays(JSON.parse(row.payload));
  } catch {
    return null;
  }
}

function persist(data) {
  const payload = JSON.stringify(data);
  const updatedAt = new Date().toISOString();
  sql
    .prepare(
      `INSERT INTO snapshot (id, payload, updated_at) VALUES (1, ?, ?)
       ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`
    )
    .run(payload, updatedAt);
}

function migrateLegacyJson() {
  if (!fs.existsSync(legacyJsonPath)) return null;
  try {
    const data = ensureArrays(JSON.parse(fs.readFileSync(legacyJsonPath, "utf8")));
    persist(data);
    const bak = `${legacyJsonPath}.migrated.bak`;
    if (!fs.existsSync(bak)) fs.renameSync(legacyJsonPath, bak);
    console.log("[store] Migrated hunar.json → SQLite (hunar.db)");
    return data;
  } catch (e) {
    console.warn("[store] Legacy JSON migrate failed:", e.message);
    return null;
  }
}

let state = loadFromSqlite();
if (!state) {
  state = migrateLegacyJson() || empty();
  persist(state);
}

/** Serialize mutations so concurrent async handlers cannot interleave corrupt writes. */
let writeChain = Promise.resolve();

export const store = {
  read: () => state,
  write(mutator) {
    mutator(state);
    persist(state);
    return state;
  },
  /** Async-safe write queue for handlers that await between mutations. */
  writeAsync(mutator) {
    writeChain = writeChain.then(() => {
      mutator(state);
      persist(state);
      return state;
    });
    return writeChain;
  },
  replace(next) {
    state = ensureArrays(next);
    persist(state);
    return state;
  },
  reset() {
    state = empty();
    persist(state);
    return state;
  },
  path: dbPath,
  engine: "sqlite",
};
