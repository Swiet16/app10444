import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, ListTodo, Video, Wallet, TrendingUp,
  User, Bell, Star, Shield, Crown, LogOut, Package,
  MoreHorizontal, ChevronRight, ShieldAlert, Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserContext } from "@/lib/auth.functions";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";
import { AppLoader } from "@/components/app-loader";
import { HelpCenter } from "@/components/help-center";

const BOTTOM_NAV = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/video-tasks", label: "Videos", icon: Video },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/profile", label: "Profile", icon: User },
] as const;

const SIDE_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/video-tasks", label: "Video Tasks", icon: Video },
  { to: "/packages", label: "Packages", icon: Package },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/earnings", label: "Earnings", icon: TrendingUp },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
] as const;

const MORE_NAV = [
  { to: "/packages", label: "Packages", icon: Package },
  { to: "/earnings", label: "Earnings", icon: TrendingUp },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/notifications", label: "Notifications", icon: Bell },
] as const;

function pkr(val: number) {
  return `₨${val.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

function useUnreadNotifications(enabled: boolean) {
  return useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return 0;
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", u.user.id)
        .is("read_at", null);
      return count ?? 0;
    },
    enabled,
    refetchInterval: 30000,
  });
}

export function AppShell({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const navigate = useNavigate();

  const { data: ctx } = useQuery({
    queryKey: ["me"],
    queryFn: getCurrentUserContext,
    enabled: authReady,
    retry: false,
  });

  const { data: unreadCount = 0 } = useUnreadNotifications(authReady);

  const { data: banStatus } = useQuery({
    queryKey: ["my-ban"],
    enabled: authReady,
    queryFn: async () => {
      const { data } = await supabase.rpc("get_my_ban_status");
      return data as any;
    },
    refetchInterval: 60000,
  });
  const isBanned = !!(banStatus && (banStatus.is_banned || banStatus.banned));

  const { data: strikes } = useQuery({
    queryKey: ["my-strikes"],
    enabled: authReady,
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase
        .from("strikes")
        .select("*")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const activeStrikeCount = (strikes ?? []).filter((s: any) => s.is_active !== false).length;

  const { data: pkgType } = useQuery({
    queryKey: ["my-package-type"],
    enabled: authReady,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      try {
        const { data } = await supabase.rpc("get_my_package_type" as any);
        return (data as string) ?? "both";
      } catch { return "both"; }
    },
  });

  const taskType = pkgType ?? "both";
  const filteredBottomNav = BOTTOM_NAV.filter((item) => {
    if (item.to === "/tasks" && taskType === "video") return false;
    if (item.to === "/video-tasks" && taskType === "task") return false;
    return true;
  });
  const filteredSideNav = SIDE_NAV.filter((item) => {
    if (item.to === "/tasks" && taskType === "video") return false;
    if (item.to === "/video-tasks" && taskType === "task") return false;
    return true;
  });

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => setMoreOpen(false), [pathname]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session?.access_token) setAuthReady(true);
      else navigate({ to: "/auth", replace: true });
    });
    return () => { mounted = false; };
  }, [navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  if (!authReady) return <AppLoader label="Preparing your workspace…" />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Mobile top header ─────────────────────────────── */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between gap-2 px-4 h-14 border-b bg-background/90 backdrop-blur-md">
        <Link to="/dashboard" aria-label="Home">
          <BrandLogo size="sm" showWordmark />
        </Link>
        <div className="flex items-center gap-2">
          {activeStrikeCount > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-destructive text-xs font-bold">
              <ShieldAlert className="h-3 w-3" /> {activeStrikeCount}
            </div>
          )}

          {/* Notification bell with badge */}
          <Link to="/notifications" aria-label="Notifications" className="relative">
            <div className="h-8 w-8 rounded-xl bg-muted/60 border border-border/50 grid place-items-center hover:bg-muted transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold grid place-items-center shadow-sm">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          <Link to="/profile" aria-label="Profile">
            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
              <AvatarImage src={ctx?.profile?.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                {(ctx?.profile?.full_name ?? "U")[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </header>

      {/* ── Desktop layout ──────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        <aside className="hidden lg:flex sticky top-0 h-screen w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground flex-col">
          <DesktopSidebar
            ctx={ctx}
            onSignOut={signOut}
            pathname={pathname}
            strikeCount={activeStrikeCount}
            onOpenHelp={() => setHelpOpen(true)}
            sideNav={filteredSideNav}
            unreadNotifications={unreadCount}
          />
        </aside>

        <main className="flex-1 min-w-0 pb-24 lg:pb-0">
          <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
            {isBanned ? <BannedScreen status={banStatus} onSignOut={signOut} /> : children}
          </div>
        </main>
        <HelpCenter userId={ctx?.userId} open={helpOpen} onOpenChange={setHelpOpen} />
      </div>

      {/* ── Mobile bottom nav ──────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 safe-area-bottom">
        <div className="relative bg-background/95 backdrop-blur-xl border-t border-border/60 shadow-[0_-4px_24px_rgba(0,0,0,0.15)]">
          <div className="flex items-stretch h-16">
            {filteredBottomNav.map((item) => {
              const active = pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex-1 flex flex-col items-center justify-center gap-1 relative group"
                >
                  <div className="flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-200">
                    {active && (
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-primary" />
                    )}
                    <div
                      className={cn(
                        "flex items-center justify-center h-8 w-8 rounded-xl transition-all duration-200",
                        active
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                          : "text-muted-foreground group-active:scale-95",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-medium leading-none transition-colors",
                        active ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}

            {/* ── More sheet trigger ── */}
            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
              <SheetTrigger asChild>
                <button className="flex-1 flex flex-col items-center justify-center gap-1 group">
                  <div className="flex items-center justify-center h-8 w-8 rounded-xl text-muted-foreground group-active:scale-95 transition-transform">
                    <MoreHorizontal className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-medium leading-none text-muted-foreground">More</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl px-0 pt-4 pb-0 max-h-[80vh]">
                <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-5" />

                {/* User card */}
                <div className="flex items-center gap-3 px-5 py-3 mb-2">
                  <Avatar className="h-11 w-11 ring-2 ring-primary/20">
                    <AvatarImage src={ctx?.profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {(ctx?.profile?.full_name ?? "U")[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{ctx?.profile?.full_name ?? "Member"}</div>
                    <div className="text-xs text-muted-foreground">
                      {pkr(Number(ctx?.wallet?.available_balance ?? 0))} available
                    </div>
                    {activeStrikeCount > 0 && (
                      <div className="text-xs text-destructive flex items-center gap-1 mt-0.5">
                        <ShieldAlert className="h-3 w-3" /> {activeStrikeCount} active strike{activeStrikeCount > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-3 pb-2 space-y-1">
                  {MORE_NAV.map((item) => {
                    const Icon = item.icon;
                    const active = pathname.startsWith(item.to);
                    const isNotif = item.to === "/notifications";
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-colors",
                          active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted",
                        )}
                      >
                        <div className="relative">
                          <Icon className="h-5 w-5" />
                          {isNotif && unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold grid place-items-center">
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                          )}
                        </div>
                        <span className="flex-1">{item.label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    );
                  })}

                  {/* Help & Support */}
                  <button
                    onClick={() => { setMoreOpen(false); setHelpOpen(true); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <Headphones className="h-5 w-5 text-violet-500" />
                    <span className="flex-1 text-left">Help & Support</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>

                  {ctx?.isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium text-foreground hover:bg-muted"
                    >
                      <Shield className="h-5 w-5" />
                      <span className="flex-1">Admin</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  )}
                  {ctx?.isSuperAdmin && (
                    <Link
                      to="/super-admin"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium text-foreground hover:bg-muted"
                    >
                      <Crown className="h-5 w-5" />
                      <span className="flex-1">Super Admin</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  )}
                </div>

                <div className="px-3 pt-1 pb-safe border-t mt-2">
                  <button
                    onClick={signOut}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium text-destructive w-full hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign out
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="h-[env(safe-area-inset-bottom)] bg-background" />
        </div>
      </nav>
    </div>
  );
}

function BannedScreen({ status, onSignOut }: { status: any; onSignOut: () => void }) {
  const until = status?.banned_until ? new Date(status.banned_until) : null;
  return (
    <div className="max-w-xl mx-auto mt-10">
      <div className="rounded-3xl overflow-hidden shadow-elegant bg-card border">
        <div className="bg-gradient-to-r from-destructive to-rose-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/20 grid place-items-center">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest opacity-80">Account restricted</div>
              <div className="text-xl font-extrabold">Your access is paused</div>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-3">
          {status?.reason && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reason</div>
              <p className="text-sm mt-1">{status.reason}</p>
            </div>
          )}
          {status?.admin_message && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin message</div>
              <p className="text-sm mt-1">{status.admin_message}</p>
            </div>
          )}
          {until && (
            <div className="text-sm text-muted-foreground">
              Restricted until <span className="font-medium text-foreground">{until.toLocaleString()}</span>
            </div>
          )}
          <Button onClick={onSignOut} variant="outline" className="w-full">
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}

function DesktopSidebar({
  ctx,
  onSignOut,
  pathname,
  strikeCount,
  onOpenHelp,
  sideNav,
  unreadNotifications,
}: {
  ctx: Awaited<ReturnType<typeof getCurrentUserContext>> | undefined;
  onSignOut: () => void;
  pathname: string;
  strikeCount: number;
  onOpenHelp: () => void;
  sideNav: typeof SIDE_NAV | typeof SIDE_NAV[number][];
  unreadNotifications: number;
}) {
  return (
    <div className="flex flex-col w-full h-full">
      <div className="px-5 py-5 border-b">
        <BrandLogo size="md" showTagline showWordmark />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {sideNav.map((item) => {
          const active = pathname.startsWith(item.to);
          const Icon = item.icon;
          const isNotif = item.to === "/notifications";
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors min-h-11",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60",
              )}
            >
              <div className="relative">
                <Icon className="h-4 w-4" />
                {isNotif && unreadNotifications > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold grid place-items-center shadow-sm">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </div>
              <span className="flex-1">{item.label}</span>
              {isNotif && unreadNotifications > 0 && (
                <span className="ml-auto rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-1.5 py-0.5">
                  {unreadNotifications}
                </span>
              )}
            </Link>
          );
        })}

        {ctx?.isAdmin && (
          <Link
            to="/admin"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-sidebar-accent/60 min-h-11"
          >
            <Shield className="h-4 w-4" /> Admin
          </Link>
        )}
        {ctx?.isSuperAdmin && (
          <Link
            to="/super-admin"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-sidebar-accent/60 min-h-11"
          >
            <Crown className="h-4 w-4" /> Super Admin
          </Link>
        )}
      </nav>

      <div className="border-t p-3 space-y-1">
        <button
          onClick={onOpenHelp}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors min-h-11"
        >
          <Headphones className="h-4 w-4 text-violet-500" />
          Help & Support
        </button>

        <div className="flex items-center gap-2 px-2 pt-1">
          <Avatar className="h-9 w-9">
            <AvatarImage src={ctx?.profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {(ctx?.profile?.full_name ?? "U")[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{ctx?.profile?.full_name ?? "Member"}</div>
            <div className="text-xs text-muted-foreground truncate">
              {pkr(Number(ctx?.wallet?.available_balance ?? 0))} available
            </div>
            {strikeCount > 0 && (
              <div className="text-[10px] text-destructive flex items-center gap-0.5">
                <ShieldAlert className="h-2.5 w-2.5" /> {strikeCount} strike{strikeCount > 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={onSignOut}>
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </Button>
      </div>
    </div>
  );
}
