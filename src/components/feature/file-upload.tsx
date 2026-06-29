import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Loader2, FileText, Film, Image as ImageIcon, File } from "lucide-react";
import { toast } from "sonner";

interface Props {
  bucket: string;
  pathPrefix: string;
  accept?: string;
  maxSizeMB?: number;
  value?: string | null;
  onChange: (url: string | null) => void;
}

interface AnyFileProps {
  bucket: string;
  pathPrefix: string;
  maxSizeMB?: number;
  value?: string | null;
  fileName?: string;
  onChange: (url: string | null, name?: string) => void;
}

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg","jpeg","png","gif","webp","svg","bmp"].includes(ext)) return <ImageIcon className="h-5 w-5 text-blue-500" />;
  if (["mp4","mov","avi","mkv","webm"].includes(ext)) return <Film className="h-5 w-5 text-purple-500" />;
  if (["pdf","doc","docx","txt","xls","xlsx"].includes(ext)) return <FileText className="h-5 w-5 text-amber-500" />;
  return <File className="h-5 w-5 text-muted-foreground" />;
}

function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url);
}

export function FileUpload({ bucket, pathPrefix, accept = "image/*", maxSizeMB = 5, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) { toast.error(`Max ${maxSizeMB}MB`); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${pathPrefix}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Uploaded ✓");
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative inline-block">
          <img src={value} alt="" className="h-32 w-32 rounded-xl object-cover border shadow-sm" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground grid place-items-center shadow"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <label>
        <input type="file" accept={accept} className="hidden" onChange={handle} disabled={uploading} />
        <Button type="button" variant="outline" disabled={uploading} asChild>
          <span className="cursor-pointer gap-2">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {value ? "Replace file" : "Upload file"}
          </span>
        </Button>
      </label>
    </div>
  );
}

export function AnyFileUpload({ bucket, pathPrefix, maxSizeMB = 20, value, fileName, onChange }: AnyFileProps) {
  const [uploading, setUploading] = useState(false);
  const [localName, setLocalName] = useState(fileName ?? "");

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) { toast.error(`Max ${maxSizeMB}MB`); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${pathPrefix}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      setLocalName(file.name);
      onChange(data.publicUrl, file.name);
      toast.success("File uploaded ✓");
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const name = localName || fileName || "";

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative">
          {isImageUrl(value) ? (
            <div className="relative inline-block">
              <img src={value} alt="" className="h-32 w-32 rounded-xl object-cover border shadow-sm" />
              <button
                type="button"
                onClick={() => { onChange(null, ""); setLocalName(""); }}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground grid place-items-center shadow"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border bg-muted/40 px-3 py-2.5 pr-2">
              <div className="h-10 w-10 rounded-lg bg-background border grid place-items-center shrink-0">
                {fileIcon(name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{name || "Uploaded file"}</div>
                <a href={value} target="_blank" rel="noreferrer" className="text-[11px] text-primary underline">
                  View / Download
                </a>
              </div>
              <button
                type="button"
                onClick={() => { onChange(null, ""); setLocalName(""); }}
                className="h-7 w-7 rounded-lg hover:bg-destructive/10 grid place-items-center text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {!value && (
        <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-muted/20 px-6 py-8 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group">
          <input type="file" accept="*/*" className="hidden" onChange={handle} disabled={uploading} />
          <div className="h-12 w-12 rounded-2xl bg-muted grid place-items-center group-hover:bg-primary/10 transition-colors">
            {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />}
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-foreground">
              {uploading ? "Uploading…" : "Click to upload"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Any file — image, video, PDF, document (max {maxSizeMB}MB)
            </div>
          </div>
        </label>
      )}

      {value && (
        <label>
          <input type="file" accept="*/*" className="hidden" onChange={handle} disabled={uploading} />
          <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
            <span className="cursor-pointer gap-2">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Replace file
            </span>
          </Button>
        </label>
      )}
    </div>
  );
}
