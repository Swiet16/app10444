import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Wallet as WalletIcon, ArrowUpRight, Clock, TrendingUp,
  Banknote, Sparkles, CheckCircle2, XCircle, Loader2,
  Smartphone, Building2, Send,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({ meta: [{ title: "Wallet — Expert Solutions" }] }),
  component: WalletPage,
});

function pkr(val: number) {
  return `₨${val.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

function relTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const METHOD_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
  jazzcash:  { label: "JazzCash",     color: "text-red-600 dark:text-red-400",     bg: "bg-red-500/10",     Icon: Smartphone },
  easypaisa: { label: "Easypaisa",    color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", Icon: Smartphone },
  opay:      { label: "OPay",         color: "text-green-600 dark:text-green-400",  bg: "bg-green-500/10",   Icon: Send },
  bank:      { label: "Bank Transfer",color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-500/10",    Icon: Building2 },
  mashreq:   { label: "Mashreq Bank", color: "text-orange-600 dark:text-orange-400",bg: "bg-orange-500/10",  Icon: Building2 },
};

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  paid:     { label: "Paid ✓",    classes: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  approved: { label: "Approved",  classes: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" },
  rejected: { label: "Rejected",  classes: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" },
  pending:  { label: "Pending",   classes: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
};

function WalletPage() {
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["my-profile-wallet"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("full_name").eq("id", u.user.id).maybeSingle();
      return data;
    },
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("wallets").select("*").eq("user_id", u.user.id).maybeSingle();
      return data;
    },
  });

  const { data: withdrawals } = useQuery({
    queryKey: ["withdrawals"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const available = Number(wallet?.available_balance ?? 0);
  const pending   = Number(wallet?.pending_balance ?? 0);
  const earned    = Number(wallet?.total_earned ?? 0);
  const withdrawn = Number(wallet?.total_withdrawn ?? 0);

  const firstName = profile?.full_name?.split(" ")[0] ?? "Member";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const pendingWithdrawals = (withdrawals ?? []).filter((w) => w.status === "pending" || w.status === "approved");

  return (
    <div className="space-y-6">

      {/* Greeting */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Here's your wallet overview</p>
        </div>
        {pendingWithdrawals.length > 0 && (
          <div className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <Clock className="h-3.5 w-3.5" /> {pendingWithdrawals.length} withdrawal{pendingWithdrawals.length > 1 ? "s" : ""} pending
          </div>
        )}
      </div>

      {/* Hero balance card */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-primary-foreground shadow-xl bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-700">
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-semibold">
              <WalletIcon className="h-3.5 w-3.5" /> My Wallet
            </div>
            <div className="mt-5 text-sm text-white/70">Available Balance</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight">{pkr(available)}</span>
              <span className="text-sm text-white/60">PKR</span>
            </div>
            {pending > 0 && (
              <div className="mt-2 inline-flex items-center gap-1 text-xs text-white/60 bg-white/10 rounded-full px-2.5 py-1">
                <Clock className="h-3 w-3" /> {pkr(pending)} pending approval
              </div>
            )}
          </div>
          <WithdrawDialog max={available} onDone={() => qc.invalidateQueries()} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={TrendingUp}  label="Total Earned"  value={pkr(earned)}    tone="from-emerald-500/20 to-emerald-500/5"  />
        <StatCard icon={ArrowUpRight} label="Withdrawn"     value={pkr(withdrawn)} tone="from-blue-500/20 to-blue-500/5"        />
        <StatCard icon={Clock}       label="Pending"       value={pkr(pending)}   tone="from-amber-500/20 to-amber-500/5"      />
        <StatCard icon={Sparkles}    label="Available"     value={pkr(available)} tone="from-violet-500/25 to-violet-500/5"    />
      </div>

      {/* Withdrawal History */}
      <Card className="glass">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="h-4 w-4 text-primary" /> Withdrawal History
            </CardTitle>
            <span className="text-xs text-muted-foreground">{withdrawals?.length ?? 0} total requests</span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {!withdrawals?.length ? (
            <div className="py-12 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted grid place-items-center mx-auto mb-3">
                <WalletIcon className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">No withdrawals yet</p>
              <p className="text-xs text-muted-foreground mt-1">Your withdrawal requests will appear here once submitted.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {withdrawals.map((w: any) => {
                const method = METHOD_CONFIG[w.method] ?? { label: w.method, color: "text-muted-foreground", bg: "bg-muted", Icon: Banknote };
                const status = STATUS_CONFIG[w.status] ?? STATUS_CONFIG.pending;
                const MethodIcon = method.Icon;
                return (
                  <div
                    key={w.id}
                    className="flex items-center gap-3 rounded-2xl border bg-card/50 px-3.5 py-3 hover:bg-card transition-colors"
                  >
                    {/* Method icon */}
                    <div className={cn("h-10 w-10 rounded-xl grid place-items-center shrink-0", method.bg)}>
                      <MethodIcon className={cn("h-4.5 w-4.5", method.color)} />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{pkr(Number(w.amount))}</span>
                        <span className={cn("text-xs font-medium", method.color)}>{method.label}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-muted-foreground">{relTime(w.created_at)}</span>
                        {w.details?.account && (
                          <span className="text-[10px] text-muted-foreground">· {String(w.details.account).replace(/(\d{4})(\d+)(\d{4})/, "$1••••$3")}</span>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 hidden sm:block", status.classes)}>
                      {status.label}
                    </span>
                    <div className={cn("h-2 w-2 rounded-full shrink-0 sm:hidden", 
                      w.status === "paid" || w.status === "approved" ? "bg-emerald-500" : 
                      w.status === "rejected" ? "bg-rose-500" : "bg-amber-500")} />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips card */}
      <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 sm:p-5">
        <div className="text-sm font-semibold text-primary mb-2">💡 Payout Tips</div>
        <div className="grid sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
          <div className="flex items-start gap-2"><span className="text-base shrink-0">📱</span><span><strong className="text-foreground">OPay</strong> is the fastest — payouts in 2-4 hours</span></div>
          <div className="flex items-start gap-2"><span className="text-base shrink-0">⏱️</span><span><strong className="text-foreground">Bank / Mashreq</strong> takes 1-2 business days</span></div>
          <div className="flex items-start gap-2"><span className="text-base shrink-0">✅</span><span>Approved tasks credit your wallet within 24 hours</span></div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: string }) {
  return (
    <Card className={cn("glass relative overflow-hidden bg-gradient-to-br", tone)}>
      <CardContent className="py-4 px-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</span>
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="text-xl font-extrabold">{value}</div>
      </CardContent>
    </Card>
  );
}

function WithdrawDialog({ max, onDone }: { max: number; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("jazzcash");
  const [account, setAccount] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedMethod = METHOD_CONFIG[method] ?? METHOD_CONFIG.jazzcash;
  const MethodIcon = selectedMethod.Icon;

  async function submit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (amt > max) return toast.error(`Exceeds your available balance of ${pkr(max)}`);
    if (!account.trim()) return toast.error("Account number is required");
    if (!name.trim()) return toast.error("Account holder name is required");
    setSaving(true);
    const { data, error } = await supabase.rpc("request_withdrawal", {
      _amount: amt,
      _method: method,
      _details: { account, name } as any,
    });
    setSaving(false);
    if (error || !(data as any)?.success) {
      toast.error((data as any)?.error ?? error?.message ?? "Failed to submit withdrawal");
    } else {
      toast.success("Withdrawal request submitted! ✓", { description: "We'll process it within 24 hours." });
      setOpen(false);
      setAmount(""); setAccount(""); setName("");
      onDone();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-white text-indigo-700 hover:bg-white/90 shadow-lg gap-2 font-bold rounded-2xl shrink-0">
          <ArrowUpRight className="h-4 w-4" /> Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/10 grid place-items-center">
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </div>
            Withdraw Funds
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Balance indicator */}
          <div className="rounded-xl bg-muted/50 border px-3 py-2.5 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Available to withdraw</div>
            <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400">{pkr(max)}</div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Amount (PKR) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₨</span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 1000"
                className="pl-7 h-11 text-sm"
              />
            </div>
            {max >= 500 && (
              <div className="flex gap-1.5 mt-1">
                {[500, 1000, 2000, max].filter((v, i, a) => a.indexOf(v) === i && v <= max).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(String(preset))}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground font-medium transition-colors"
                  >
                    {pkr(preset)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Payment Method *</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="h-11">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <MethodIcon className={cn("h-4 w-4", selectedMethod.color)} />
                    {selectedMethod.label}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(METHOD_CONFIG).map(([key, cfg]) => {
                  const Icon = cfg.Icon;
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", cfg.color)} />
                        {cfg.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              {method === "bank" || method === "mashreq" ? "Bank Account Number *" : "Mobile Number *"}
            </Label>
            <Input
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder={method === "bank" || method === "mashreq" ? "Account number" : "03XX-XXXXXXX"}
              className="h-11 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Account Holder Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name as on account"
              className="h-11 text-sm"
            />
          </div>

          <Button onClick={submit} disabled={saving || !amount || !account || !name} className="w-full h-11 rounded-xl gap-2">
            {saving
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
              : <><CheckCircle2 className="h-4 w-4" /> Submit Withdrawal Request</>}
          </Button>

          <p className="text-[11px] text-center text-muted-foreground">
            Processing time: OPay 2-4h · JazzCash/Easypaisa same day · Bank 1-2 days
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
