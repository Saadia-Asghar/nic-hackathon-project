import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "hunar.json");

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

function load() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbPath)) {
    const data = empty();
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return data;
  }
  const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  if (!data.users) data.users = [];
  if (!data.messages) data.messages = [];
  if (!data.notifications) data.notifications = [];
  return data;
}

function save(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

let state = load();

export const store = {
  read: () => state,
  write(mutator) {
    mutator(state);
    save(state);
    return state;
  },
  replace(next) {
    state = next;
    if (!state.users) state.users = [];
    if (!state.notifications) state.notifications = [];
    save(state);
    return state;
  },
  reset() {
    state = empty();
    save(state);
    return state;
  },
  path: dbPath,
};
