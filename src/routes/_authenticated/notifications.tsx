import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Bell, CheckCheck, DollarSign, CheckCircle2, XCircle,
  ArrowUpRight, Upload, RefreshCw, Clock,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Expert Solutions" }] }),
  component: NotificationsPage,
});

type NType = "earning" | "approved" | "rejected" | "withdrawal" | "submitted" | "general";

const TYPES: Record<NType, {
  Icon: any; label: string; bar: string; iconBg: string; iconColor: string; rowBg: string;
}> = {
  earning:    { Icon: DollarSign,   label: "Payment",    bar: "bg-emerald-500", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400", rowBg: "border-emerald-500/20 bg-emerald-500/[0.03]" },
  approved:   { Icon: CheckCircle2, label: "Approved",   bar: "bg-green-500",   iconBg: "bg-green-500/10",   iconColor: "text-green-600 dark:text-green-400",     rowBg: "border-green-500/20 bg-green-500/[0.03]" },
  rejected:   { Icon: XCircle,      label: "Rejected",   bar: "bg-rose-500",    iconBg: "bg-rose-500/10",    iconColor: "text-rose-600 dark:text-rose-400",       rowBg: "border-rose-500/20 bg-rose-500/[0.03]" },
  withdrawal: { Icon: ArrowUpRight, label: "Withdrawal", bar: "bg-violet-500",  iconBg: "bg-violet-500/10",  iconColor: "text-violet-600 dark:text-violet-400",   rowBg: "border-violet-500/20 bg-violet-500/[0.03]" },
  submitted:  { Icon: Upload,       label: "Submitted",  bar: "bg-amber-500",   iconBg: "bg-amber-500/10",   iconColor: "text-amber-600 dark:text-amber-400",     rowBg: "border-amber-500/20 bg-amber-500/[0.03]" },
  general:    { Icon: Bell,         label: "Notice",     bar: "bg-blue-500",    iconBg: "bg-blue-500/10",    iconColor: "text-blue-600 dark:text-blue-400",       rowBg: "border-blue-500/20 bg-blue-500/[0.03]" },
};

function detectType(n: any): NType {
  const text = `${n.title ?? ""} ${n.body ?? ""}`.toLowerCase();
  if (text.includes("approved") && !text.includes("withdraw")) return "approved";
  if (text.includes("rejected")) return "rejected";
  if (text.includes("withdraw")) return "withdrawal";
  if (text.includes("submitted") || text.includes("review")) return "submitted";
  if (text.includes("earned") || text.includes("credited") || text.includes("payment") || text.includes("reward") || n.body?.includes("₨")) return "earning";
  return "general";
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: days > 180 ? "numeric" : undefined });
}

function groupByDate(notifications: any[]): Record<string, any[]> {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
  const groups: Record<string, any[]> = {};
  for (const n of notifications) {
    const d = new Date(n.created_at); d.setHours(0, 0, 0, 0);
    const key = d >= now ? "Today" : d >= yesterday ? "Yesterday" : d >= weekAgo ? "This Week" : "Earlier";
    (groups[key] ??= []).push(n);
  }
  return groups;
}

const GROUP_ORDER = ["Today", "Yesterday", "This Week", "Earlier"];

function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const unread = (data ?? []).filter((n) => !n.read_at).length;

  async function markAll() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", u.user.id)
      .is("read_at", null);
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
  }

  async function markOne(id: string) {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .is("read_at", null);
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
  }

  const groups = groupByDate(data ?? []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2.5">
            <div className="relative">
              <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 grid place-items-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold grid place-items-center shadow">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </div>
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {unread > 0 ? `${unread} unread notification${unread > 1 ? "s" : ""}` : "You're all caught up!"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 rounded-xl h-9" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          {unread > 0 && (
            <Button size="sm" className="gap-1.5 rounded-xl h-9" onClick={markAll}>
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Summary chips */}
      {(data?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(
            (data ?? []).reduce((acc, n) => {
              const t = detectType(n);
              acc[t] = (acc[t] ?? 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).map(([type, count]) => {
            const cfg = TYPES[type as NType] ?? TYPES.general;
            const Icon = cfg.Icon;
            return (
              <span key={type} className={cn("inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium", cfg.iconBg, cfg.iconColor, "border-current/20")}>
                <Icon className="h-3 w-3" />
                {count} {cfg.label}
              </span>
            );
          })}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : !(data?.length) ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {GROUP_ORDER.filter((g) => groups[g]?.length).map((group) => (
            <div key={group}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{group}</span>
                <div className="flex-1 h-px bg-border/60" />
                <span className="text-[10px] text-muted-foreground">{groups[group].length} item{groups[group].length > 1 ? "s" : ""}</span>
              </div>
              <div className="space-y-2">
                {groups[group].map((n: any) => (
                  <NotifCard key={n.id} n={n} onRead={markOne} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotifCard({ n, onRead }: { n: any; onRead: (id: string) => void }) {
  const type = detectType(n);
  const cfg = TYPES[type];
  const Icon = cfg.Icon;
  const isUnread = !n.read_at;

  return (
    <button
      onClick={() => isUnread && onRead(n.id)}
      className={cn(
        "w-full text-left rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-md group",
        isUnread ? cfg.rowBg : "bg-card/60 border-border/50 opacity-80 hover:opacity-100",
        isUnread && "ring-1 ring-inset ring-current/10",
      )}
    >
      <div className="flex gap-0">
        {/* Left color strip */}
        <div className={cn("w-1 shrink-0 self-stretch rounded-l-xl", cfg.bar)} />

        <div className="flex items-start gap-3 px-3.5 py-3.5 flex-1 min-w-0">
          {/* Icon */}
          <div className={cn("h-9 w-9 rounded-xl grid place-items-center shrink-0 mt-0.5", cfg.iconBg)}>
            <Icon className={cn("h-4 w-4", cfg.iconColor)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className={cn("text-sm font-semibold leading-snug truncate", isUnread ? "text-foreground" : "text-muted-foreground")}>
                  {n.title}
                </div>
                {n.body && (
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                    {n.body}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {isUnread && <span className="h-2 w-2 rounded-full bg-rose-500" />}
                <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {relativeTime(n.created_at)}
                </span>
              </div>
            </div>

            {/* Type badge */}
            <div className="mt-1.5">
              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md", cfg.iconBg, cfg.iconColor)}>
                {cfg.label}
              </span>
              {isUnread && (
                <span className="ml-1.5 text-[10px] text-muted-foreground">
                  · Tap to mark read
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-6">
        <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/15 to-primary/5 grid place-items-center shadow-inner ring-1 ring-primary/10">
          <Bell className="h-12 w-12 text-primary/40" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-xl bg-emerald-500 grid place-items-center shadow-lg">
          <CheckCheck className="h-4 w-4 text-white" />
        </div>
      </div>
      <h3 className="text-lg font-bold mb-1">All caught up!</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        No notifications yet. Complete tasks to receive payment confirmations and updates here.
      </p>
    </div>
  );
}
