import "dotenv/config";
import { v4 as uuid } from "uuid";
import { store } from "./store.js";
import { ZONES, hoursAgo, daysAgo, jitter } from "./constants.js";
import { analyzeZoneSkill } from "./agents.js";
import { hashPassword } from "./auth.js";
import { syncStoreToSupabase, supabaseEnabled } from "./supabase.js";

export async function seed() {
  store.reset();
  const db = store.read();

  db.zones = ZONES.map((z) => ({
    id: z.id,
    displayName: z.displayName,
    urduName: z.urduName,
    description: z.description,
    lat: z.lat,
    lng: z.lng,
  }));

  db.seasonalContext = [
    {
      id: 1,
      seasonName: "pre-eid-fitr-2026",
      startDate: "2026-03-10",
      endDate: "2026-03-31",
      affectedSkills: JSON.stringify([
        "Tailoring & Stitching",
        "Baking & Home Food",
        "Beautician",
      ]),
      demandMultiplier: 3,
    },
    {
      id: 2,
      seasonName: "exam-season-2026",
      startDate: "2026-02-15",
      endDate: "2026-05-15",
      affectedSkills: JSON.stringify(["Home Tutoring"]),
      demandMultiplier: 2,
    },
    {
      id: 3,
      seasonName: "ramadan-2026",
      startDate: "2026-02-28",
      endDate: "2026-03-29",
      affectedSkills: JSON.stringify(["Baking & Home Food", "Cleaning"]),
      demandMultiplier: 1.8,
    },
  ];

  const w = {
    aisha: uuid(),
    nadia: uuid(),
    bilal: uuid(),
    sara: uuid(),
    imran: uuid(),
    zara: uuid(),
  };

  const userFatima = uuid();
  const userAisha = uuid();
  const passHash = await hashPassword("demo123");

  const zById = Object.fromEntries(db.zones.map((z) => [z.id, z]));

  db.users = [
    {
      id: userFatima,
      name: "Fatima Bibi",
      email: "fatima@demo.com",
      passwordHash: passHash,
      role: "resident",
      zoneId: "Z3",
      workerId: null,
      favorites: [],
      createdAt: daysAgo(10),
    },
    {
      id: userAisha,
      name: "Aisha",
      email: "aisha@demo.com",
      passwordHash: passHash,
      role: "worker",
      zoneId: "Z2",
      workerId: w.aisha,
      favorites: [],
      createdAt: daysAgo(40),
    },
  ];

  function place(zoneId) {
    const z = zById[zoneId];
    return jitter(z.lat, z.lng);
  }

  db.workers = [
    {
      id: w.aisha,
      userId: userAisha,
      name: "Aisha",
      title: "Master Tailor",
      skillCategory: "Tailoring & Stitching",
      zoneId: "Z2",
      availability: "both",
      bio: "10 years silai, bridal specialty",
      photoUrl: null,
      rating: 4.9,
      completedJobs: 12,
      isActive: true,
      availableThisWeek: true,
      verified: true,
      tags: ["Womenswear", "Bridal", "Alterations"],
      services: [
        { name: "Simple Suit Stitching", detail: "Standard 2-piece shalwar kameez", price: "Rs. 1,500" },
        { name: "Fancy Suit (Embroidery)", detail: "Intricate designs, heavy fabric", price: "Rs. 3,500+" },
        { name: "Urgent Alterations", detail: "Same day service", price: "Rs. 500" },
      ],
      portfolio: [
        { title: "Bridal Suit", tone: "maroon" },
        { title: "Eid Collection", tone: "teal" },
      ],
      registeredAt: daysAgo(40),
      ...place("Z2"),
    },
    {
      id: w.nadia,
      name: "Nadia",
      skillCategory: "Tailoring & Stitching",
      zoneId: "Z3",
      availability: "weekdays",
      bio: "Everyday suits & alterations",
      photoUrl: null,
      rating: 4.2,
      completedJobs: 7,
      isActive: true,
      availableThisWeek: false,
      registeredAt: daysAgo(40),
      ...place("Z3"),
    },
    {
      id: w.bilal,
      name: "Bilal",
      skillCategory: "Baking & Home Food",
      zoneId: "Z2",
      availability: "both",
      bio: "Cakes, biryani, dawat trays",
      photoUrl: null,
      rating: 4.9,
      completedJobs: 23,
      isActive: true,
      availableThisWeek: true,
      registeredAt: daysAgo(40),
      ...place("Z2"),
    },
    {
      id: w.sara,
      name: "Sara",
      skillCategory: "Tailoring & Stitching",
      zoneId: "Z3",
      availability: "weekends",
      bio: "Student tailor, light embroidery",
      photoUrl: null,
      rating: 3.8,
      completedJobs: 3,
      isActive: false,
      availableThisWeek: false,
      registeredAt: daysAgo(40),
      ...place("Z3"),
    },
    {
      id: w.imran,
      name: "Imran",
      skillCategory: "Electrical Work",
      zoneId: "Z4",
      availability: "both",
      bio: "Fans, wiring, sockets",
      photoUrl: null,
      rating: 4.5,
      completedJobs: 18,
      isActive: true,
      availableThisWeek: true,
      registeredAt: daysAgo(40),
      ...place("Z4"),
    },
    {
      id: w.zara,
      name: "Zara",
      skillCategory: "Home Tutoring",
      zoneId: "Z1",
      availability: "weekdays",
      bio: "O/A level Physics & Math",
      photoUrl: null,
      rating: 5,
      completedJobs: 31,
      isActive: true,
      availableThisWeek: true,
      registeredAt: daysAgo(40),
      ...place("Z1"),
    },
    {
      id: uuid(),
      name: "Ali Raza",
      skillCategory: "Plumbing",
      zoneId: "Z5",
      availability: "both",
      bio: "Expert in leak fixing and motor installation",
      photoUrl: null,
      rating: 4.6,
      completedJobs: 15,
      isActive: true,
      availableThisWeek: true,
      registeredAt: daysAgo(20),
      ...place("Z5"),
    },
    {
      id: uuid(),
      name: "Shazia",
      skillCategory: "Beautician",
      zoneId: "Z6",
      availability: "weekends",
      bio: "Bridal makeup and mehndi expert",
      photoUrl: null,
      rating: 4.8,
      completedJobs: 25,
      isActive: true,
      availableThisWeek: true,
      registeredAt: daysAgo(10),
      ...place("Z6"),
    },
    {
      id: uuid(),
      name: "Bano",
      skillCategory: "Cleaning",
      zoneId: "Z1",
      availability: "weekdays",
      bio: "Deep cleaning and daily sweeping",
      photoUrl: null,
      rating: 4.3,
      completedJobs: 42,
      isActive: true,
      availableThisWeek: true,
      registeredAt: daysAgo(60),
      ...place("Z1"),
    },
  ];

  const n1 = uuid();
  const n2 = uuid();
  const n3 = uuid();
  const n4 = uuid();
  const n5 = uuid();
  const n6 = uuid();
  const n7 = uuid();
  const matchedBid = uuid();
  const fatimaMatchedBid = uuid();

  db.needs = [
    {
      id: n1,
      skillCategory: "Tailoring & Stitching",
      description: "2 shalwar suits, light embroidery, need before Eid",
      budgetRange: "1000-2000",
      urgency: "pre-eid",
      zoneId: "Z3",
      residentName: "Fatima Bibi",
      residentUserId: userFatima,
      status: "open",
      createdAt: hoursAgo(2),
      matchedAt: null,
      matchedBidId: null,
      ...place("Z3"),
    },
    {
      id: n7,
      skillCategory: "Tailoring & Stitching",
      description: "Eid suit alteration — measurements received, sleeves & piping",
      budgetRange: "1000-2000",
      urgency: "pre-eid",
      zoneId: "Z3",
      residentName: "Fatima Bibi",
      residentUserId: userFatima,
      status: "matched",
      createdAt: daysAgo(1),
      matchedAt: daysAgo(1),
      matchedBidId: fatimaMatchedBid,
      jobDone: false,
      ...place("Z3"),
    },
    {
      id: n2,
      skillCategory: "Tailoring & Stitching",
      description: "Kids Eid clothes — 3 sets, simple stitching",
      budgetRange: "1000-2000",
      urgency: "pre-eid",
      zoneId: "Z3",
      residentName: "Sana",
      status: "open",
      createdAt: hoursAgo(5),
      matchedAt: null,
      matchedBidId: null,
      ...place("Z3"),
    },
    {
      id: n3,
      skillCategory: "Tailoring & Stitching",
      description: "Alteration + dupatta work for wedding guest",
      budgetRange: "500-1000",
      urgency: "week",
      zoneId: "Z3",
      residentName: "Hira",
      status: "open",
      createdAt: hoursAgo(8),
      matchedAt: null,
      matchedBidId: null,
      ...place("Z3"),
    },
    {
      id: n4,
      skillCategory: "Baking & Home Food",
      description: "Chocolate cake for 12 people this weekend",
      budgetRange: "2000+",
      urgency: "week",
      zoneId: "Z2",
      residentName: "Omar",
      status: "open",
      createdAt: hoursAgo(10),
      matchedAt: null,
      matchedBidId: null,
      ...place("Z2"),
    },
    {
      id: n5,
      skillCategory: "Home Tutoring",
      description: "O-level Physics — 3x/week until exams",
      budgetRange: "open",
      urgency: "week",
      zoneId: "Z1",
      residentName: "Kashif",
      status: "matched",
      createdAt: daysAgo(3),
      matchedAt: daysAgo(2),
      matchedBidId: matchedBid,
      ...place("Z1"),
    },
    {
      id: n6,
      skillCategory: "Electrical Work",
      description: "Ceiling fan replacement + socket fix",
      budgetRange: "500-1000",
      urgency: "urgent",
      zoneId: "Z4",
      residentName: "Ali",
      status: "open",
      createdAt: hoursAgo(18),
      matchedAt: null,
      matchedBidId: null,
      ...place("Z4"),
    },
    {
      id: uuid(),
      skillCategory: "Plumbing",
      description: "Water motor making strange noise, needs urgent fix",
      budgetRange: "1000-2000",
      urgency: "urgent",
      zoneId: "Z5",
      residentName: "Tariq",
      status: "open",
      createdAt: hoursAgo(1),
      matchedAt: null,
      matchedBidId: null,
      ...place("Z5"),
    },
    {
      id: uuid(),
      skillCategory: "Beautician",
      description: "Mehndi for 3 girls tomorrow evening",
      budgetRange: "2000+",
      urgency: "urgent",
      zoneId: "Z6",
      residentName: "Amina",
      status: "open",
      createdAt: hoursAgo(4),
      matchedAt: null,
      matchedBidId: null,
      ...place("Z6"),
    },
    {
      id: uuid(),
      skillCategory: "Cleaning",
      description: "Pre-Eid deep cleaning for a 3-bedroom house",
      budgetRange: "2000+",
      urgency: "pre-eid",
      zoneId: "Z1",
      residentName: "Sadia",
      status: "open",
      createdAt: hoursAgo(24),
      matchedAt: null,
      matchedBidId: null,
      ...place("Z1"),
    },
  ];

  db.bids = [
    {
      id: matchedBid,
      needId: n5,
      workerId: w.zara,
      priceRs: 4500,
      timelineDays: 30,
      note: "Past papers included",
      status: "accepted",
      createdAt: daysAgo(2),
    },
    {
      id: fatimaMatchedBid,
      needId: n7,
      workerId: w.aisha,
      priceRs: 1800,
      timelineDays: 4,
      note: "Bridal specialty finish",
      status: "accepted",
      createdAt: daysAgo(2),
    },
  ];

  db.messages = [
    {
      id: uuid(),
      needId: n7,
      senderUserId: userAisha,
      senderRole: "worker",
      senderName: "Aisha",
      body: "Salam Fatima! I have received your measurements. Do you want the sleeves to be full length or three-quarters?",
      createdAt: hoursAgo(3),
    },
    {
      id: uuid(),
      needId: n7,
      senderUserId: userFatima,
      senderRole: "resident",
      senderName: "Fatima Bibi",
      body: "Walaikum Assalam. Full length please, with the simple piping we discussed.",
      createdAt: hoursAgo(2.5),
    },
  ];

  db.ratings = [
    {
      id: uuid(),
      workerId: w.aisha,
      needId: n7,
      bidId: fatimaMatchedBid,
      stars: 5,
      comment: "Aisha baji ne buhat achi stitching ki. Dupatta ka kaam perfect tha!",
      ratedAt: daysAgo(5),
      reviewerName: "Sara M.",
      reviewerZone: "Gali 5–7",
    },
    {
      id: uuid(),
      workerId: w.aisha,
      needId: uuid(),
      bidId: uuid(),
      stars: 5,
      comment: "On time for Eid suits. Trustworthy and careful with chiffon.",
      ratedAt: daysAgo(12),
      reviewerName: "Hina Ali",
      reviewerZone: "Gali 3–4",
    },
    {
      id: uuid(),
      workerId: w.aisha,
      needId: uuid(),
      bidId: uuid(),
      stars: 5,
      comment: "Bridal finishing was excellent. Will rehire.",
      ratedAt: daysAgo(20),
      reviewerName: "Mehwish",
      reviewerZone: "Main Market",
    },
  ];

  db.notifications = [
    {
      id: uuid(),
      userId: userFatima,
      type: "welcome",
      title: "Welcome to Hunar Naqsha",
      body: "Post a need — workers bid their own price. AI watches your gali for skill gaps.",
      read: false,
      link: "/needs/new",
      createdAt: hoursAgo(1),
    },
    {
      id: uuid(),
      userId: userAisha,
      type: "welcome",
      title: "Worker account ready",
      body: "Nearby open jobs for your skill will show on your Jobs tab.",
      read: false,
      link: "/app",
      createdAt: hoursAgo(1),
    },
  ];

  store.replace(db);

  for (const [z, s] of [
    ["Z3", "Tailoring & Stitching"],
    ["Z2", "Baking & Home Food"],
    ["Z1", "Home Tutoring"],
    ["Z4", "Electrical Work"],
    ["Z2", "Tailoring & Stitching"],
    ["Z5", "Plumbing"],
    ["Z6", "Beautician"],
    ["Z1", "Cleaning"],
  ]) {
    await analyzeZoneSkill(z, s);
  }

  if (supabaseEnabled()) {
    const sync = await syncStoreToSupabase(store.read());
    console.log("Supabase sync →", sync.ok ? "ok" : sync.reason || sync.errors?.[0] || "failed");
  }

  console.log("Seed complete →", store.path);
}

if (process.argv[1] && process.argv[1].includes("seed.js")) {
  seed().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
