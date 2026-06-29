import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, Banknote, Video, Briefcase, Clock, CheckCircle2, XCircle, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/earnings")({
  head: () => ({ meta: [{ title: "Earnings — Expert Solutions" }] }),
  component: EarningsPage,
});

function pkr(val: number) {
  return `₨${val.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

function relTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: days > 300 ? "numeric" : undefined });
}

function sourceIcon(source: string = ""): { Icon: any; color: string; bg: string } {
  const s = source.toLowerCase();
  if (s.includes("video")) return { Icon: Video,    color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10" };
  if (s.includes("task"))  return { Icon: Briefcase, color: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-500/10" };
  if (s.includes("bonus")) return { Icon: Star,      color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-500/10" };
  return                          { Icon: Banknote,  color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" };
}

const STATUS = {
  approved: { label: "Approved", classes: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20", Icon: CheckCircle2 },
  paid:     { label: "Paid ✓",   classes: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20", Icon: CheckCircle2 },
  pending:  { label: "Pending",  classes: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",         Icon: Clock },
  rejected: { label: "Rejected", classes: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",            Icon: XCircle },
} as const;

function groupByMonth(data: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  for (const e of data) {
    const key = new Date(e.created_at).toLocaleDateString("en-PK", { month: "long", year: "numeric" });
    (groups[key] ??= []).push(e);
  }
  return groups;
}

function EarningsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["earnings"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase
        .from("earnings")
        .select("*")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const total    = (data ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const approved = (data ?? []).filter((e) => e.status === "approved" || e.status === "paid").reduce((s, e) => s + Number(e.amount), 0);
  const pending  = (data ?? []).filter((e) => e.status === "pending").reduce((s, e) => s + Number(e.amount), 0);
  const rejected = (data ?? []).filter((e) => e.status === "rejected").reduce((s, e) => s + Number(e.amount), 0);

  const groups = groupByMonth(data ?? []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-2xl bg-emerald-500/10 grid place-items-center">
            <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          Earnings
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Your complete PKR earning history</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Lifetime Total" value={pkr(total)} sub={`${(data ?? []).length} transactions`}
          gradient="from-emerald-500 to-teal-500" textColor="text-emerald-700 dark:text-emerald-400" />
        <StatCard label="Approved" value={pkr(approved)} sub={`${(data ?? []).filter((e) => e.status === "approved" || e.status === "paid").length} tasks`}
          gradient="from-green-500 to-emerald-500" textColor="text-green-700 dark:text-green-400" />
        <StatCard label="Pending Review" value={pkr(pending)} sub={`${(data ?? []).filter((e) => e.status === "pending").length} tasks`}
          gradient="from-amber-500 to-orange-500" textColor="text-amber-700 dark:text-amber-400" />
        <StatCard label="Not Approved" value={pkr(rejected)} sub={`${(data ?? []).filter((e) => e.status === "rejected").length} tasks`}
          gradient="from-rose-500 to-red-500" textColor="text-rose-700 dark:text-rose-400" />
      </div>

      {/* History */}
      <Card className="glass">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Banknote className="h-4 w-4 text-primary" /> Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3 py-2">
              {[1,2,3].map((i) => <div key={i} className="h-14 rounded-xl bg-muted/40 animate-pulse" />)}
            </div>
          ) : !(data?.length) ? (
            <div className="py-14 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted grid place-items-center mx-auto mb-3">
                <Banknote className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">No earnings yet</p>
              <p className="text-xs text-muted-foreground mt-1">Complete and submit tasks to start earning PKR!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groups).map(([month, items]) => {
                const monthTotal = items.filter((e) => e.status === "approved" || e.status === "paid").reduce((s, e) => s + Number(e.amount), 0);
                return (
                  <div key={month}>
                    {/* Month header */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{month}</span>
                      <div className="flex-1 h-px bg-border/60" />
                      {monthTotal > 0 && (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">+{pkr(monthTotal)}</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {items.map((e: any) => {
                        const src = sourceIcon(e.source);
                        const SrcIcon = src.Icon;
                        const stat = STATUS[e.status as keyof typeof STATUS] ?? STATUS.pending;
                        const StatIcon = stat.Icon;
                        return (
                          <div
                            key={e.id}
                            className="flex items-center gap-3 rounded-2xl border bg-card/50 px-3.5 py-3 hover:bg-card transition-colors"
                          >
                            <div className={cn("h-10 w-10 rounded-xl grid place-items-center shrink-0", src.bg)}>
                              <SrcIcon className={cn("h-4.5 w-4.5", src.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                  +{pkr(Number(e.amount))}
                                </span>
                                <span className="text-xs text-muted-foreground capitalize hidden sm:block">
                                  {e.source?.replace(/_/g, " ")}
                                </span>
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {relTime(e.created_at)}
                              </div>
                            </div>
                            <span className={cn("hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0", stat.classes)}>
                              <StatIcon className="h-3 w-3" /> {stat.label}
                            </span>
                            <div className={cn("h-2 w-2 rounded-full shrink-0 sm:hidden",
                              e.status === "approved" || e.status === "paid" ? "bg-emerald-500" :
                              e.status === "rejected" ? "bg-rose-500" : "bg-amber-500")} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, sub, gradient, textColor }: { label: string; value: string; sub: string; gradient: string; textColor: string }) {
  return (
    <Card className="glass relative overflow-hidden">
      <div className={cn("absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r", gradient)} />
      <CardContent className="py-4 px-4">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">{label}</div>
        <div className={cn("text-xl sm:text-2xl font-extrabold", textColor)}>{value}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
      </CardContent>
    </Card>
  );
}
