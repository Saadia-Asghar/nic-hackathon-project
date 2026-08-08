import { Link, Navigate } from "react-router-dom";
import { ArrowRight, BadgeCheck, MapPinned, Search, Sparkles, Scissors, ChefHat, BookOpen } from "lucide-react";
import { useAuth } from "../auth";
import { SKILLS, SKILL_EMOJI } from "../api";

const icons = {
  "Tailoring & Stitching": Scissors,
  "Baking & Home Food": ChefHat,
  "Home Tutoring": BookOpen,
};

export default function Landing() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="app-shell px-4 pt-10 text-[var(--muted)]">Loading…</div>;
  if (user) return <Navigate to="/app" replace />;

  return (
    <div className="app-shell px-4 pt-7 pb-10">
      <div className="pill mb-4">
        <MapPinned size={12} /> Hyperlocal · Trust-first · Pakistan
      </div>

      <p className="text-xs font-semibold tracking-[0.16em] uppercase text-[var(--rose)] m-0 mb-2">
        ہنر نقشہ
      </p>
      <h1 className="font-display text-[2.15rem] leading-[1.05] m-0 mb-3">Hunar Naqsha</h1>
      <p className="text-[var(--muted)] leading-relaxed m-0 mb-5">
        Home skills in your gali — with trust scores, safe chat after match, and AI that warns when a shortage is forming before Eid.
      </p>

      <div className="hero-panel mb-5">
        <div className="relative z-10">
          <div className="text-xs uppercase tracking-[0.14em] text-white/55 font-semibold mb-2">
            Invisible workers. Visible now.
          </div>
          <div className="font-display text-[1.45rem] leading-tight mb-3">
            Apni gali ka hunar,<br />apni marzi ka daam
          </div>
          <p className="text-sm text-white/70 m-0 leading-relaxed">
            Residents post needs. Workers bid their own price. No commission. Chat stays in-app — no phone numbers exposed.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-6">
        <Link className="btn btn-primary w-full" to="/signup">
          Get started <ArrowRight size={16} />
        </Link>
        <Link className="btn btn-ghost w-full" to="/login">
          Log in
        </Link>
      </div>

      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Skills nearby</div>
      <div className="flex flex-wrap gap-2 mb-6">
        {SKILLS.slice(0, 6).map((s) => {
          const Icon = icons[s] || Sparkles;
          return (
            <span key={s} className="cat-chip">
              <Icon size={14} /> {SKILL_EMOJI[s]} {s.split("&")[0].trim()}
            </span>
          );
        })}
      </div>

      <div className="card p-4 mb-4">
        <div className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-[var(--rose)]" /> How it works
        </div>
        <div className="space-y-3">
          {[
            [Search, "Post or offer", "Resident posts a need — or worker joins with skill + gali."],
            [BadgeCheck, "Bid + trust", "Workers set price. Trust score shows reviews & reliability."],
            [MapPinned, "AI watches gaps", "Needs + season + bid silence → shortage alert for the mohalla."],
          ].map(([Icon, t, d], i) => (
            <div key={t} className="flex gap-3">
              <div className="step-dot">{i + 1}</div>
              <div>
                <div className="font-semibold text-sm flex items-center gap-1.5">
                  <Icon size={14} /> {t}
                </div>
                <div className="text-xs text-[var(--muted)] leading-relaxed mt-0.5">{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pattern-surface p-4 mb-4">
        <div className="text-sm font-semibold mb-2">One role. One dashboard.</div>
        <p className="text-xs text-[var(--muted)] m-0 leading-relaxed">
          Sign up as Resident <strong>or</strong> Worker — never both screens. Safe contact opens only after a bid is accepted.
        </p>
      </div>

      <div className="card p-4 text-xs text-[var(--muted)] leading-relaxed">
        <div className="font-semibold text-[var(--ink)] mb-1">Demo</div>
        Resident: fatima@demo.com / demo123
        <br />
        Worker: aisha@demo.com / demo123
      </div>
    </div>
  );
}
