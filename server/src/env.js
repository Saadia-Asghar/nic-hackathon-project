const DEFAULT_JWT = "hunar-naqsha-dev-secret-change-me";

export function validateEnv() {
  const warnings = [];
  const errors = [];
  const isProd = process.env.NODE_ENV === "production";

  const jwt = (process.env.JWT_SECRET || "").trim();
  if (!jwt) {
    warnings.push("JWT_SECRET missing — using insecure default (OK for local demo only)");
  } else if (jwt === DEFAULT_JWT) {
    warnings.push("JWT_SECRET is still the example default — change before any public deploy");
    if (isProd) errors.push("JWT_SECRET must not be the default in production");
  }

  if (!(process.env.OPENAI_API_KEY || "").trim() && !(process.env.GEMINI_API_KEY || "").trim()) {
    warnings.push("No OPENAI_API_KEY or GEMINI_API_KEY — GapDetectionAgent runs in heuristic mode");
  }

  if (!(process.env.SUPABASE_URL || "").trim() || !(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim()) {
    warnings.push("Supabase not fully configured — using local SQLite only");
  }

  return { warnings, errors, defaultJwt: DEFAULT_JWT };
}

export { DEFAULT_JWT };
