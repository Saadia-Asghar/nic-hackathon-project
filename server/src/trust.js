/** Trust score inspired by Hunarkada — capped at 100, no phone/NGO required */
export function computeTrust(worker, ratings = []) {
  let score = 0;
  const breakdown = [];

  const profileComplete = Boolean(worker.bio && worker.skillCategory && worker.zoneId && worker.availability);
  if (profileComplete) {
    score += 20;
    breakdown.push({ label: "Profile complete", points: 20 });
  }

  if (worker.completedJobs >= 1 || ratings.length >= 1) {
    score += 10;
    breakdown.push({ label: "First completed job / review", points: 10 });
  }

  if (worker.completedJobs >= 5 || ratings.length >= 5) {
    score += 20;
    breakdown.push({ label: "5+ jobs or reviews", points: 20 });
  }

  const avg = Number(worker.rating) || 0;
  if (avg >= 4.5) {
    score += 25;
    breakdown.push({ label: "High star rating (4.5+)", points: 25 });
  } else if (avg >= 4) {
    score += 15;
    breakdown.push({ label: "Good star rating (4+)", points: 15 });
  } else if (avg >= 3) {
    score += 8;
    breakdown.push({ label: "Solid rating (3+)", points: 8 });
  }

  if (worker.isActive) {
    score += 10;
    breakdown.push({ label: "Active on platform", points: 10 });
  }

  if (worker.bio && worker.bio.length > 40) {
    score += 5;
    breakdown.push({ label: "Detailed bio", points: 5 });
  }

  score = Math.min(100, score);
  return { trustScore: score, trustBreakdown: breakdown };
}

export function trustTone(score) {
  if (score >= 80) return "high";
  if (score >= 55) return "mid";
  return "low";
}
