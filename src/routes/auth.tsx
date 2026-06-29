import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ShieldCheck, Banknote, Smartphone, Mail } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

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
    if (data.user && !data.session) {
      toast.success("Check your email to confirm your account.");
    } else {
      toast.success("Account created!");
      navigate({ to: "/dashboard", replace: true });
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#00291C]">

      {/* Top header bar */}
      <div className="bg-[#003D2A] border-b border-[#005238] px-5 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-emerald-400 grid place-items-center shadow">
            <span className="text-[#00291C] font-black text-base leading-none">ES</span>
          </div>
          <div>
            <div className="text-white font-bold text-base leading-tight">Expert Solutions</div>
            <div className="text-emerald-400/70 text-[10px] leading-tight">Earning Platform</div>
          </div>
        </Link>
        <div className="flex items-center gap-1.5 text-emerald-400/60 text-xs">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Secure Login</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">

        {/* Trust badges */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-1.5 text-emerald-400/60 text-xs">
            <Banknote className="h-3.5 w-3.5" />
            <span>OPay &amp; Mashreq</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-1.5 text-emerald-400/60 text-xs">
            <Smartphone className="h-3.5 w-3.5" />
            <span>Instant Payouts</span>
          </div>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Card header */}
          <div className="bg-[#004B32] px-6 py-5">
            <h1 className="text-white text-xl font-bold">
              {tab === "signin" ? "Sign in to your account" : "Create your account"}
            </h1>
            <p className="text-emerald-300/70 text-sm mt-0.5">
              {tab === "signin" ? "Enter your credentials to continue" : "Join thousands earning daily"}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setTab("signin")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                tab === "signin"
                  ? "text-[#004B32] border-b-2 border-[#004B32] -mb-px"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab("signup")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                tab === "signup"
                  ? "text-[#004B32] border-b-2 border-[#004B32] -mb-px"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <div className="px-6 py-6">
            {tab === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="si-email" className="text-gray-700 text-sm font-medium">Email Address</Label>
                  <Input
                    id="si-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="border-gray-300 focus:border-[#004B32] focus:ring-[#004B32] h-11 text-gray-900"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="si-pw" className="text-gray-700 text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="si-pw"
                      type={showPw ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 border-gray-300 focus:border-[#004B32] focus:ring-[#004B32] h-11 text-gray-900"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPw((p) => !p)}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-[#004B32] hover:bg-[#003D28] text-white font-semibold rounded-xl mt-2"
                  disabled={loading}
                >
                  {loading ? "Signing in…" : "Sign In"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                {/* Personal email notice */}
                <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
                  <Mail className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Please use your personal email.</strong> We will send your tasks, activation keys, and work details to this address. Temporary or fake emails will not work.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="su-name" className="text-gray-700 text-sm font-medium">Full Name</Label>
                  <Input
                    id="su-name"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="border-gray-300 focus:border-[#004B32] focus:ring-[#004B32] h-11 text-gray-900"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-email" className="text-gray-700 text-sm font-medium">Personal Email Address</Label>
                  <Input
                    id="su-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.real@email.com"
                    className="border-gray-300 focus:border-[#004B32] focus:ring-[#004B32] h-11 text-gray-900"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-pw" className="text-gray-700 text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="su-pw"
                      type={showPw ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 border-gray-300 focus:border-[#004B32] focus:ring-[#004B32] h-11 text-gray-900"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPw((p) => !p)}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-[#004B32] hover:bg-[#003D28] text-white font-semibold rounded-xl mt-2"
                  disabled={loading}
                >
                  {loading ? "Creating account…" : "Create Account"}
                </Button>
              </form>
            )}
          </div>

          {/* Card footer */}
          <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#004B32] shrink-0" />
            <p className="text-xs text-gray-500">
              Your data is protected with 256-bit encryption
            </p>
          </div>
        </div>

        <p className="mt-6 text-xs text-white/30 text-center max-w-xs">
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>

      {/* Bottom bar */}
      <div className="bg-[#001F14] border-t border-[#003020] py-3 px-5 flex justify-center">
        <p className="text-[10px] text-white/20 text-center">
          © 2026 Expert Solutions · Secure Earning Platform
        </p>
      </div>
    </div>
  );
}
