import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnyFileUpload } from "@/components/feature/file-upload";
import { toast } from "sonner";
import {
  Loader2, Key, ArrowRight, Download, Calendar,
  Clock, CheckCircle2, XCircle, AlertCircle, Upload,
  Briefcase, Sparkles, FileText,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({ meta: [{ title: "Tasks — Expert Solutions" }] }),
  component: TasksPage,
});

function useIsClient() {
  return useQuery({
    queryKey: ["my-roles"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      return (data ?? []).some((r: any) => r.role === "client");
    },
  });
}

function daysLeft(due: string | null): { text: string; urgent: boolean } | null {
  if (!due) return null;
  const ms = new Date(due).getTime() - Date.now();
  const days = Math.ceil(ms / 86400000);
  if (days < 0) return { text: "Overdue!", urgent: true };
  if (days === 0) return { text: "Due today!", urgent: true };
  if (days === 1) return { text: "Due tomorrow", urgent: true };
  return { text: `${days} days left`, urgent: false };
}

function NoKeyScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="relative mb-6">
        <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 grid place-items-center shadow-inner ring-1 ring-primary/20">
          <Key className="h-12 w-12 text-primary" />
        </div>
        <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-amber-400 grid place-items-center shadow">
          <span className="text-white text-xs font-bold">!</span>
        </div>
      </div>
      <h2 className="text-xl font-bold tracking-tight mb-2">Activation Key Required</h2>
      <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
        Purchase a plan and redeem your activation key to unlock task assignments and start earning PKR daily.
      </p>
      <Button asChild className="gap-2 rounded-2xl px-6">
        <Link to="/packages">
          <Sparkles className="h-4 w-4" /> Browse Plans <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function TasksPage() {
  const { data: isClient, isLoading } = useIsClient();
  if (isLoading) return <Loading />;
  if (!isClient) return (
    <div className="space-y-4">
      <PageHeader />
      <NoKeyScreen />
    </div>
  );
  return (
    <div className="space-y-6">
      <PageHeader />
      <Tabs defaultValue="mine">
        <TabsList className="rounded-xl">
          <TabsTrigger value="mine" className="rounded-lg">My Tasks</TabsTrigger>
          <TabsTrigger value="open" className="rounded-lg">Open Tasks</TabsTrigger>
        </TabsList>
        <TabsContent value="mine"><MyTasks /></TabsContent>
        <TabsContent value="open"><OpenTasks /></TabsContent>
      </Tabs>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground mt-1">Complete assigned tasks and submit proof to earn PKR.</p>
      </div>
      <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
        <Briefcase className="h-3.5 w-3.5" /> Earning Mode
      </div>
    </div>
  );
}

function MyTasks() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-tasks"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("assigned_to", u.user.id)
        .not("task_type", "eq", "video")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  if (isLoading) return <Loading />;
  if (!data?.length) return <Empty msg="No tasks assigned to you yet. Check back soon." />;
  return (
    <div className="grid gap-4 mt-4">
      {data.map((t) => <TaskCard key={t.id} task={t} />)}
    </div>
  );
}

function OpenTasks() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["open-tasks"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_open_tasks");
      return (data as any[]) ?? [];
    },
  });
  async function claim(id: string) {
    const { data, error } = await supabase.rpc("claim_open_task", { _task_id: id });
    if (error || !(data as any)?.success) toast.error((data as any)?.error ?? error?.message ?? "Failed");
    else { toast.success("Task claimed! 🎯"); qc.invalidateQueries(); }
  }
  if (isLoading) return <Loading />;
  if (!data?.length) return <Empty msg="No open tasks available right now." />;
  return (
    <div className="grid gap-4 mt-4">
      {data.map((t) => (
        <Card key={t.id} className="glass overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <h3 className="font-bold text-base">{t.title}</h3>
                {t.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>}
              </div>
              <div className="shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-center">
                <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">₨{Number(t.reward).toFixed(0)}</div>
              </div>
            </div>
            <Button onClick={() => claim(t.id)} size="sm" className="rounded-xl gap-2">
              <ArrowRight className="h-3.5 w-3.5" /> Claim Task
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const STATUS_CONFIG: Record<string, { label: string; bar: string; badge: string; Icon: any }> = {
  assigned:  { label: "Assigned",  bar: "from-blue-500 to-indigo-500",   badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300",    Icon: Clock },
  submitted: { label: "In Review", bar: "from-amber-500 to-orange-500",  badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300",  Icon: AlertCircle },
  approved:  { label: "Approved",  bar: "from-emerald-500 to-teal-500",  badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", Icon: CheckCircle2 },
  rejected:  { label: "Rejected",  bar: "from-rose-500 to-red-500",      badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300",     Icon: XCircle },
};

function TaskCard({ task }: { task: any }) {
  const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.assigned;
  const due = daysLeft(task.due_date ?? null);

  return (
    <Card className="glass overflow-hidden">
      <div className={`h-1.5 w-full bg-gradient-to-r ${cfg.bar}`} />
      <CardContent className="pt-4 pb-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base leading-snug">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
            )}
          </div>
          <div className="shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-right">
            <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">₨{Number(task.reward).toFixed(0)}</div>
            <div className="text-[10px] text-muted-foreground">{task.currency ?? "PKR"}</div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.badge}`}>
            <cfg.Icon className="h-3 w-3" /> {cfg.label}
          </span>
          {due && (
            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${due.urgent ? "bg-rose-500/10 text-rose-700 dark:text-rose-300" : "bg-muted text-muted-foreground"}`}>
              <Calendar className="h-3 w-3" /> {due.text}
            </span>
          )}
          {task.due_date && (
            <span className="text-[11px] text-muted-foreground">
              Deadline: {new Date(task.due_date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>

        {/* Attachment download */}
        {task.attachment_url && (
          <a
            href={task.attachment_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 px-3 py-3 transition-colors group"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/10 group-hover:bg-primary/20 grid place-items-center shrink-0 transition-colors">
              <Download className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-primary truncate">{task.attachment_name || "Download Task File"}</div>
              <div className="text-[11px] text-muted-foreground">Tap to download · complete this task using the file</div>
            </div>
            <ArrowRight className="h-4 w-4 text-primary/50 shrink-0" />
          </a>
        )}

        {/* Rejection */}
        {task.status === "rejected" && task.rejection_reason && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2.5">
            <div className="text-xs font-semibold text-rose-700 dark:text-rose-400 mb-0.5">Rejection reason</div>
            <p className="text-sm text-rose-700/80 dark:text-rose-300/80">{task.rejection_reason}</p>
          </div>
        )}

        {/* Action */}
        {(task.status === "assigned" || task.status === "rejected") && (
          <SubmitDialog task={task} />
        )}
        {task.status === "submitted" && (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-medium">
            <AlertCircle className="h-4 w-4" /> Proof submitted — awaiting admin review
          </div>
        )}
        {task.status === "approved" && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="h-4 w-4" /> Approved — ₨{Number(task.reward).toFixed(0)} credited to your wallet
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SubmitDialog({ task }: { task: any }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofName, setProofName] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const { data, error } = await supabase.rpc("submit_task_v2", {
      _task_id: task.id, _text: text, _url: url,
      _proof_files: proofUrl ? [proofUrl] : [],
    });
    setSaving(false);
    if (error || !(data as any)?.success) toast.error((data as any)?.error ?? error?.message ?? "Failed");
    else { toast.success("Proof submitted! 🎉"); setOpen(false); qc.invalidateQueries(); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 rounded-xl">
          <Upload className="h-3.5 w-3.5" /> Submit Proof
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/10 grid place-items-center">
              <Upload className="h-4 w-4 text-primary" />
            </div>
            Submit Proof
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          {/* Task info */}
          <div className="rounded-xl bg-muted/50 border px-3 py-2.5">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">Task</div>
            <div className="font-semibold text-sm mt-0.5">{task.title}</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">₨{Number(task.reward).toFixed(0)} reward on approval</div>
          </div>

          {/* Attachment reminder */}
          {task.attachment_url && (
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3">
              <p className="text-blue-700 dark:text-blue-400 font-semibold text-xs mb-1">📎 Task file available</p>
              <a href={task.attachment_url} target="_blank" rel="noreferrer" className="text-primary underline text-xs font-medium">
                Download task file first →
              </a>
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold">Upload Your Work / Proof *</Label>
            <p className="text-[11px] text-muted-foreground mb-2 mt-0.5">
              Any file accepted — image, video, PDF, document, screenshot, etc.
            </p>
            <AnyFileUpload
              bucket="proof-uploads"
              pathPrefix={`${task.assigned_to}/${task.id}`}
              value={proofUrl}
              fileName={proofName}
              onChange={(u, n) => { setProofUrl(u); setProofName(n ?? ""); }}
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Note (optional)</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              placeholder="Any info for the admin reviewing your work…"
              className="mt-1 text-sm resize-none"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Reference URL (optional)</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="mt-1 text-sm"
            />
          </div>

          <Button onClick={submit} disabled={saving || !proofUrl} className="w-full rounded-xl gap-2 h-11">
            {saving
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
              : !proofUrl
              ? <><FileText className="h-4 w-4" /> Upload a file to continue</>
              : <><CheckCircle2 className="h-4 w-4" /> Submit Proof</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Loading() { return <div className="py-12 text-center text-muted-foreground">Loading…</div>; }
function Empty({ msg }: { msg: string }) {
  return (
    <Card className="glass mt-4">
      <CardContent className="py-14 text-center">
        <div className="h-16 w-16 rounded-2xl bg-muted grid place-items-center mx-auto mb-3">
          <Briefcase className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground text-sm">{msg}</p>
      </CardContent>
    </Card>
  );
}
