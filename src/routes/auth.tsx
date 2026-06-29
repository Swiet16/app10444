import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ShieldCheck, Mail } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

/* ── Mashreq-inspired Leaf SVG ────────────────────── */
function LeafDecoration() {
  return (
    <svg viewBox="0 0 420 560" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
      {/* Large back leaf – deep orange-red */}
      <path
        d="M210 520 C90 480 20 360 30 200 C40 80 120 20 210 10 C300 20 380 80 390 200 C400 360 330 480 210 520Z"
        fill="url(#leaf1)"
        opacity="0.18"
      />
      {/* Front leaf – bright orange, rotated */}
      <path
        d="M170 500 C60 450 10 330 30 170 C50 40 140 -20 220 20 C290 55 340 150 330 280 C318 400 270 480 170 500Z"
        fill="url(#leaf2)"
        opacity="0.22"
        transform="rotate(-18 210 260)"
      />
      {/* Small accent leaf top-right */}
      <path
        d="M360 180 C310 160 290 110 310 60 C328 20 370 10 400 30 C430 50 435 90 415 130 C398 165 380 185 360 180Z"
        fill="url(#leaf3)"
        opacity="0.30"
      />
      {/* Tiny leaf bottom-left */}
      <path
        d="M60 400 C35 375 30 340 50 310 C66 286 96 278 118 292 C140 308 143 340 128 366 C114 388 80 412 60 400Z"
        fill="url(#leaf2)"
        opacity="0.25"
      />
      <defs>
        <linearGradient id="leaf1" x1="210" y1="10" x2="210" y2="520" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF9966" />
          <stop offset="100%" stopColor="#C94A18" />
        </linearGradient>
        <linearGradient id="leaf2" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#FF7033" />
          <stop offset="100%" stopColor="#F15A22" />
        </linearGradient>
        <linearGradient id="leaf3" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#FFB380" />
          <stop offset="100%" stopColor="#F15A22" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Mashreq Logo Mark ───────────────────────────── */
function MashreqLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path
        d="M20 38 C8 33 2 22 4 10 C6 2 13 -1 20 1 C27 -1 34 2 36 10 C38 22 32 33 20 38Z"
        fill="#F15A22"
      />
      <path
        d="M15 36 C4 30 1 19 5 8 C8 1 15 -2 20 2 C25 -1 30 3 32 10 C35 21 30 32 18 37Z"
        fill="#C94A18"
        opacity="0.75"
      />
      <text x="20" y="26" textAnchor="middle" fontSize="11" fontWeight="800" fill="white" fontFamily="sans-serif">m</text>
    </svg>
  );
}

/* ── OPay Logo Mark ──────────────────────────────── */
function OPayLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#1DA357" />
      <text x="20" y="27" textAnchor="middle" fontSize="13" fontWeight="800" fill="white" fontFamily="sans-serif">O</text>
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/dashboard", replace: true });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data.user && !data.session) toast.success("Check your email to confirm your account.");
    else { toast.success("Account created!"); navigate({ to: "/dashboard", replace: true }); }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">

      {/* ── LEFT PANEL — Mashreq orange brand side ── */}
      <div className="relative lg:w-[52%] xl:w-[55%] bg-[#1C0A00] overflow-hidden flex flex-col justify-between px-8 py-10 lg:px-14 lg:py-14 min-h-[260px] lg:min-h-screen">

        {/* Leaf SVG background */}
        <LeafDecoration />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #2C1100 0%, #8B2E00 35%, #C94A18 65%, #F15A22 100%)",
            opacity: 0.88,
          }}
        />

        {/* Content over gradient */}
        <div className="relative z-10 flex flex-col h-full justify-between">

          {/* Top brand section */}
          <div>
            {/* Expert Solutions wordmark */}
            <div className="flex items-center gap-3 mb-8 lg:mb-0">
              <div
                className="h-11 w-11 rounded-2xl grid place-items-center shadow-lg shrink-0"
                style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,0.25)" }}
              >
                <span className="text-white font-black text-lg leading-none">ES</span>
              </div>
              <div>
                <div className="text-white font-extrabold text-lg leading-tight">Expert Solutions</div>
                <div className="text-orange-200/70 text-[11px] tracking-wide">Pakistan's Earning Platform</div>
              </div>
            </div>

            {/* Hero copy — desktop only */}
            <div className="hidden lg:block mt-16">
              <h1 className="text-white text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight">
                Earn daily.<br />
                <span style={{ color: "#FFB380" }}>Get paid fast.</span>
              </h1>
              <p className="text-orange-100/70 text-base mt-5 leading-relaxed max-w-sm">
                Complete tasks, watch videos and earn PKR — powered by Pakistan's most trusted financial partners.
              </p>

              {/* Stats */}
              <div className="flex gap-6 mt-10">
                {[
                  { val: "₨80+", label: "Per task" },
                  { val: "24 hrs", label: "Fast payout" },
                  { val: "10K+", label: "Members" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="text-white text-2xl font-extrabold">{s.val}</div>
                    <div className="text-orange-200/60 text-xs mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom — Co-powered by section */}
          <div className="hidden lg:block">
            <div className="text-orange-200/50 text-[10px] uppercase tracking-widest font-semibold mb-4">
              Co-powered by
            </div>
            <div className="flex items-center gap-4">
              {/* Mashreq brand */}
              <div
                className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5"
                style={{ background: "rgba(255,255,255,0.10)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.18)" }}
              >
                <MashreqLogo size={28} />
                <div>
                  <div className="text-white font-bold text-sm leading-tight">mashreq</div>
                  <div className="text-orange-200/60 text-[10px]">Banking Partner</div>
                </div>
              </div>
              {/* OPay brand */}
              <div
                className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5"
                style={{ background: "rgba(255,255,255,0.10)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.18)" }}
              >
                <OPayLogo size={28} />
                <div>
                  <div className="text-white font-bold text-sm leading-tight">OPay</div>
                  <div className="text-orange-200/60 text-[10px]">Payout Partner</div>
                </div>
              </div>
            </div>
            <p className="text-orange-200/40 text-[11px] mt-4 leading-relaxed max-w-xs">
              Payouts processed through Mashreq Bank & OPay — Pakistan's fastest growing digital payment partners.
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Login card ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 lg:py-16 bg-white">

        {/* Mobile-only header */}
        <div className="lg:hidden mb-8 text-center">
          <div
            className="h-14 w-14 rounded-2xl grid place-items-center shadow-lg mx-auto mb-3"
            style={{ background: "linear-gradient(135deg, #C94A18, #F15A22)" }}
          >
            <span className="text-white font-black text-xl">ES</span>
          </div>
          <div className="font-extrabold text-xl text-gray-900">Expert Solutions</div>
          <div className="text-gray-400 text-sm mt-0.5">Pakistan's Earning Platform</div>
        </div>

        <div className="w-full max-w-[400px]">

          {/* Form heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {tab === "signin" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-gray-500 text-sm mt-1.5">
              {tab === "signin"
                ? "Sign in to continue earning"
                : "Join thousands earning PKR daily"}
            </p>
          </div>

          {/* Tab switch */}
          <div className="flex rounded-2xl bg-gray-100 p-1 mb-7">
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                style={
                  tab === t
                    ? { background: "linear-gradient(135deg,#C94A18,#F15A22)", color: "white", boxShadow: "0 4px 14px rgba(241,90,34,0.35)" }
                    : { color: "#6b7280" }
                }
              >
                {t === "signin" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {tab === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="si-email" className="text-gray-700 text-sm font-semibold">Email Address</Label>
                <Input
                  id="si-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12 rounded-xl border-gray-200 text-gray-900 focus-visible:ring-[#F15A22] focus-visible:border-[#F15A22]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="si-pw" className="text-gray-700 text-sm font-semibold">Password</Label>
                <div className="relative">
                  <Input
                    id="si-pw"
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-11 h-12 rounded-xl border-gray-200 text-gray-900 focus-visible:ring-[#F15A22] focus-visible:border-[#F15A22]"
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPw((p) => !p)}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl text-white font-bold text-sm transition-all duration-200 mt-2 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#C94A18,#F15A22)", boxShadow: "0 4px 20px rgba(241,90,34,0.35)" }}
              >
                {loading ? "Signing in…" : "Sign In →"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Personal email notice */}
              <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3" style={{ background: "#FFF5EF", border: "1px solid #FECDB5" }}>
                <Mail className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#F15A22" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#7A2F0A" }}>
                  <strong>Use your personal email.</strong> We send tasks, activation keys and work details to this address. Temporary emails won't work.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="su-name" className="text-gray-700 text-sm font-semibold">Full Name</Label>
                <Input
                  id="su-name"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="h-12 rounded-xl border-gray-200 text-gray-900 focus-visible:ring-[#F15A22] focus-visible:border-[#F15A22]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-email" className="text-gray-700 text-sm font-semibold">Personal Email</Label>
                <Input
                  id="su-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.real@email.com"
                  className="h-12 rounded-xl border-gray-200 text-gray-900 focus-visible:ring-[#F15A22] focus-visible:border-[#F15A22]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-pw" className="text-gray-700 text-sm font-semibold">Password</Label>
                <div className="relative">
                  <Input
                    id="su-pw"
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-11 h-12 rounded-xl border-gray-200 text-gray-900 focus-visible:ring-[#F15A22] focus-visible:border-[#F15A22]"
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPw((p) => !p)}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl text-white font-bold text-sm transition-all duration-200 mt-1 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#C94A18,#F15A22)", boxShadow: "0 4px 20px rgba(241,90,34,0.35)" }}
              >
                {loading ? "Creating account…" : "Create Account →"}
              </button>
            </form>
          )}

          {/* Security note */}
          <div className="flex items-center gap-2 mt-7 text-gray-400">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <p className="text-xs">256-bit encrypted · Your data is safe</p>
          </div>

          {/* Mobile co-powered section */}
          <div className="lg:hidden mt-8 pt-6 border-t border-gray-100">
            <div className="text-gray-400 text-[10px] uppercase tracking-widest font-semibold mb-3 text-center">Co-powered by</div>
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                <MashreqLogo size={22} />
                <div>
                  <div className="text-xs font-bold text-gray-800 leading-tight">mashreq</div>
                  <div className="text-[9px] text-gray-400">Banking Partner</div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                <OPayLogo size={22} />
                <div>
                  <div className="text-xs font-bold text-gray-800 leading-tight">OPay</div>
                  <div className="text-[9px] text-gray-400">Payout Partner</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-10 text-xs text-gray-300 text-center">
          © 2026 Expert Solutions · All rights reserved
        </p>
      </div>
    </div>
  );
}
