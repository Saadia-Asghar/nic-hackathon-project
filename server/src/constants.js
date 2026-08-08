export const SKILLS = [
  "Tailoring & Stitching",
  "Baking & Home Food",
  "Home Tutoring",
  "Beautician",
  "Electrical Work",
  "Plumbing",
  "Cleaning",
  "Other",
];

export const ADJACENT = {
  Z1: ["Z1", "Z2", "Z6"],
  Z2: ["Z2", "Z1", "Z3"],
  Z3: ["Z3", "Z2", "Z4"],
  Z4: ["Z4", "Z3", "Z5"],
  Z5: ["Z5", "Z4", "Z6"],
  Z6: ["Z6", "Z5", "Z1"],
};

/** Model Town, Lahore — real OSM coordinates for demo zones */
export const ZONES = [
  {
    id: "Z1",
    displayName: "Gali 1–2",
    urduName: "گلی ۱–۲",
    description: "Residential lanes near park",
    lat: 31.4832,
    lng: 74.3318,
  },
  {
    id: "Z2",
    displayName: "Gali 3–4",
    urduName: "گلی ۳–۴",
    description: "Dense home-worker pocket",
    lat: 31.4808,
    lng: 74.3365,
  },
  {
    id: "Z3",
    displayName: "Gali 5–7",
    urduName: "گلی ۵–۷",
    description: "Demo critical shortage zone",
    lat: 31.4785,
    lng: 74.3412,
  },
  {
    id: "Z4",
    displayName: "Gali 8–9",
    urduName: "گلی ۸–۹",
    description: "Quieter residential edge",
    lat: 31.4762,
    lng: 74.346,
  },
  {
    id: "Z5",
    displayName: "Main Market Area",
    urduName: "مین بازار",
    description: "Shops + foot traffic",
    lat: 31.4815,
    lng: 74.3505,
  },
  {
    id: "Z6",
    displayName: "Back Streets",
    urduName: "پچھلی گلیاں",
    description: "Inner mohalla streets",
    lat: 31.485,
    lng: 74.3388,
  },
];

export const MAP_CENTER = { lat: 31.4805, lng: 74.3405 };

export function jitter(lat, lng, amount = 0.0012) {
  return {
    lat: lat + (Math.random() - 0.5) * amount * 2,
    lng: lng + (Math.random() - 0.5) * amount * 2,
  };
}

export function nowIso() {
  return new Date().toISOString();
}

export function hoursAgo(h) {
  return new Date(Date.now() - h * 3600 * 1000).toISOString();
}

export function daysAgo(d) {
  return new Date(Date.now() - d * 86400 * 1000).toISOString();
}
