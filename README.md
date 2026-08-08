# Hunar Naqsha

Mobile-first Mohalla Mind app: neighborhood skill marketplace + AI gap detection.

## Docs

- [PRD](docs/PRD.md)
- [TRD](docs/TRD.md)
- [User Specs](docs/USER_SPECS.md)
- [Features](docs/FEATURES.md)

## Run locally

```bash
# terminal 1 — API (auto-seeds SQLite on first boot)
cd server
npm install
npm run dev

# terminal 2 — UI
cd client
npm install
npm run dev
```

Or from root after `npm install`:

```bash
npm run dev
```

- App: http://localhost:5173  
- API: http://localhost:3001/api/health  

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Resident | fatima@demo.com | demo123 |
| Worker | aisha@demo.com | demo123 |

After login you only see **your** dashboard (resident ≠ worker).
  

## Stack

React + Vite + Tailwind · Express · JSON file DB · Gemini GapDetectionAgent (heuristic fallback)  
