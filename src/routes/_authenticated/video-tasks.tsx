import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/feature/file-upload";
import { SecureVideoPlayer } from "@/components/feature/secure-video-player";
import { toast } from "sonner";
import {
  Loader2, CheckCircle2, Key, ArrowRight, Camera,
  Play, Sparkles, Video, Upload, AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/video-tasks")({
  head: () => ({ meta: [{ title: "Video Tasks — Expert Solutions" }] }),
  component: VideoTasksPage,
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
        Purchase a plan and redeem your activation key to unlock video task assignments.
      </p>
      <Button asChild className="gap-2 rounded-2xl px-6">
        <Link to="/packages">
          <Sparkles className="h-4 w-4" /> Browse Plans <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function VideoTasksPage() {
  const { data: isClient, isLoading: rolesLoading } = useIsClient();
  const { data, isLoading } = useQuery({
    queryKey: ["video-tasks"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("assigned_to", u.user.id)
        .eq("task_type", "video")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!isClient,
  });

  if (rolesLoading) return (
    <div className="space-y-4">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Video Tasks</h1>
      <div className="py-8 text-center text-muted-foreground">Loading…</div>
    </div>
  );

  if (!isClient) return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Video Tasks</h1>
        <p className="text-muted-foreground mt-1">Watch videos to earn rewards.</p>
      </div>
      <NoKeyScreen />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Video Tasks</h1>
          <p className="text-muted-foreground mt-1">Watch all videos completely, then upload screenshot proof.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 text-xs text-violet-700 dark:text-violet-400 font-semibold">
          <Video className="h-3.5 w-3.5" /> Video Earning
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Loading…</div>
      ) : !data?.length ? (
        <Card className="glass">
          <CardContent className="py-14 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted grid place-items-center mx-auto mb-3">
              <Video className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-sm">No video tasks assigned yet. Check back soon.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {data.map((t) => <VideoTaskCard key={t.id} task={t} />)}
        </div>
      )}
    </div>
  );
}

function VideoTaskCard({ task }: { task: any }) {
  const videos: string[] = Array.isArray(task.video_links) ? task.video_links : [];

  return (
    <Card className="glass overflow-hidden">
      <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 to-indigo-500" />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">{task.title}</CardTitle>
            {task.description && (
              <CardDescription className="mt-1 line-clamp-2">{task.description}</CardDescription>
            )}
          </div>
          <div className="shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 text-center">
            <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">₨{Number(task.reward).toFixed(0)}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <VideoTaskBody task={task} videos={videos} />
      </CardContent>
    </Card>
  );
}

function VideoTaskBody({ task, videos }: { task: any; videos: string[] }) {
  const qc = useQueryClient();
  const { data: progress } = useQuery({
    queryKey: ["video-progress", task.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_video_watch_progress", { _task_id: task.id });
      return data as { watched: string[]; total: number };
    },
  });

  const watched = new Set(progress?.watched ?? []);
  const allWatched = videos.length > 0 && videos.every((v) => watched.has(v));
  const watchedCount = videos.filter((v) => watched.has(v)).length;

  async function markWatched(url: string) {
    await supabase.rpc("mark_video_watched" as any, { _task_id: task.id, _video_url: url });
    qc.invalidateQueries({ queryKey: ["video-progress", task.id] });
  }

  const isComplete = task.status === "submitted" || task.status === "approved";

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      {videos.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5">
          <div className="flex gap-1">
            {videos.map((url, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${watched.has(url) ? "bg-emerald-500" : "bg-muted-foreground/20"}`}
                style={{ width: `${Math.max(20, 80 / videos.length)}px` }}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-muted-foreground ml-1">
            {watchedCount}/{videos.length} watched
          </span>
          {allWatched && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> All complete
            </span>
          )}
        </div>
      )}

      {/* Video list */}
      {videos.map((url, i) => {
        const isWatched = watched.has(url);
        return (
          <div key={url} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              {isWatched ? (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Video {i + 1} — Watched ✓
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Play className="h-4 w-4" /> Video {i + 1}
                </span>
              )}
            </div>

            {/* Only show player if NOT yet watched */}
            {!isWatched && !isComplete && (
              <SecureVideoPlayer src={url} onComplete={() => markWatched(url)} />
            )}

            {/* Show completed state instead of replay */}
            {isWatched && (
              <div className="flex items-center gap-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 px-4 py-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 grid place-items-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Video {i + 1} Completed</div>
                  <div className="text-xs text-muted-foreground">Watch history recorded</div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Submit section — only shows after ALL videos watched */}
      {allWatched && !isComplete && (
        <div className="rounded-2xl border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 grid place-items-center">
              <Camera className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">All videos watched! 🎉</div>
              <div className="text-xs text-muted-foreground">Now take a screenshot and submit for verification</div>
            </div>
          </div>
          <SubmitDialog task={task} />
        </div>
      )}

      {task.status === "submitted" && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400 font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" /> Screenshot submitted — awaiting admin review
        </div>
      )}
      {task.status === "approved" && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Approved — ₨{Number(task.reward).toFixed(0)} credited to your wallet
        </div>
      )}
      {task.status === "rejected" && (
        <div className="space-y-2">
          {task.rejection_reason && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2.5">
              <div className="text-xs font-semibold text-rose-700 dark:text-rose-400 mb-0.5">Rejection reason</div>
              <p className="text-sm text-rose-700/80 dark:text-rose-300/80">{task.rejection_reason}</p>
            </div>
          )}
          {allWatched && <SubmitDialog task={task} resubmit />}
        </div>
      )}
    </div>
  );
}

function SubmitDialog({ task, resubmit = false }: { task: any; resubmit?: boolean }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [proof, setProof] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const { data, error } = await supabase.rpc("submit_task_v2", {
      _task_id: task.id, _text: text, _url: "",
      _proof_files: proof ? [proof] : [],
    });
    setSaving(false);
    if (error || !(data as any)?.success) toast.error((data as any)?.error ?? error?.message ?? "Failed");
    else { toast.success("Screenshot submitted! 🎉"); setOpen(false); qc.invalidateQueries(); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 rounded-xl w-full" variant={resubmit ? "outline" : "default"}>
          <Camera className="h-4 w-4" />
          {resubmit ? "Resubmit Screenshot" : "Submit Screenshot Proof"}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-violet-500/10 grid place-items-center">
              <Camera className="h-4 w-4 text-violet-600" />
            </div>
            Submit Watch Proof
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          {/* Info banner */}
          <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-3">
            <div className="font-semibold text-violet-700 dark:text-violet-400 text-xs mb-1">📸 Screenshot Required</div>
            <p className="text-violet-700/80 dark:text-violet-300/80 text-xs leading-relaxed">
              Take a screenshot of the YouTube video clearly showing the video title and that it is playing or completed. This is used to verify your watch history.
            </p>
          </div>

          <div>
            <Label className="text-xs font-semibold">Screenshot of YouTube Video *</Label>
            <p className="text-[11px] text-muted-foreground mb-2 mt-0.5">
              Must clearly show the video title and your watch progress.
            </p>
            <FileUpload
              bucket="proof-uploads"
              pathPrefix={`${task.assigned_to}/${task.id}`}
              value={proof}
              onChange={setProof}
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Note (optional)</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              placeholder="Any additional info…"
              className="mt-1 text-sm resize-none"
            />
          </div>

          <Button onClick={submit} disabled={saving || !proof} className="w-full rounded-xl gap-2 h-11">
            {saving
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
              : !proof
              ? <><Upload className="h-4 w-4" /> Upload screenshot to continue</>
              : <><CheckCircle2 className="h-4 w-4" /> Submit Proof</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
