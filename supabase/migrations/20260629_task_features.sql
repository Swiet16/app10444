-- =================================================================
-- Expert Solutions — Full Feature Migration
-- Run this entire script in your Supabase SQL Editor
-- =================================================================

-- ─── 1. Extend tasks table ──────────────────────────────────────
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS attachment_url  text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS due_date        timestamptz;

-- ─── 2. Task templates (for Super Admin reuse) ──────────────────
CREATE TABLE IF NOT EXISTS public.task_templates (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text        NOT NULL,
  description     text,
  task_type       text        NOT NULL DEFAULT 'general',
  reward          numeric     NOT NULL DEFAULT 80,
  video_links     jsonb       NOT NULL DEFAULT '[]'::jsonb,
  attachment_url  text,
  attachment_name text,
  created_by      uuid        REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins manage task templates" ON public.task_templates;
CREATE POLICY "admins manage task templates" ON public.task_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'admin')
    )
  );

-- ─── 3. Activation keys table (ensure structure) ────────────────
-- If activation_keys doesn't exist yet, create it:
CREATE TABLE IF NOT EXISTS public.activation_keys (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text        NOT NULL UNIQUE,
  package_id  uuid        REFERENCES public.packages(id),
  used_by     uuid        REFERENCES auth.users(id),
  used_at     timestamptz,
  is_active   boolean     NOT NULL DEFAULT true,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activation_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins read keys" ON public.activation_keys;
CREATE POLICY "admins read keys" ON public.activation_keys
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin'))
  );

DROP POLICY IF EXISTS "admins insert keys" ON public.activation_keys;
CREATE POLICY "admins insert keys" ON public.activation_keys
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin'))
  );

DROP POLICY IF EXISTS "users read own key" ON public.activation_keys;
CREATE POLICY "users read own key" ON public.activation_keys
  FOR SELECT USING (used_by = auth.uid());

DROP POLICY IF EXISTS "users redeem key" ON public.activation_keys;
CREATE POLICY "users redeem key" ON public.activation_keys
  FOR UPDATE USING (is_active = true AND used_by IS NULL);

-- ─── 4. Storage bucket policies (run if buckets exist) ──────────
-- Ensure these buckets are created in the Supabase Dashboard → Storage:
--   • proof-uploads   (public)
--   • task-attachments (public)
--   • avatars          (public)

-- Allow authenticated users to upload proof files:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'proof-uploads'
  ) THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('proof-uploads', 'proof-uploads', true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'task-attachments'
  ) THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('task-attachments', 'task-attachments', true);
  END IF;
END $$;

-- Storage RLS for proof-uploads
DROP POLICY IF EXISTS "auth users upload proofs" ON storage.objects;
CREATE POLICY "auth users upload proofs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'proof-uploads');

DROP POLICY IF EXISTS "public read proofs" ON storage.objects;
CREATE POLICY "public read proofs" ON storage.objects
  FOR SELECT USING (bucket_id = 'proof-uploads');

-- Storage RLS for task-attachments
DROP POLICY IF EXISTS "admins upload attachments" ON storage.objects;
CREATE POLICY "admins upload attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin'))
  );

DROP POLICY IF EXISTS "public read attachments" ON storage.objects;
CREATE POLICY "public read attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'task-attachments');

-- ─── 5. Quick verification query ────────────────────────────────
-- Run this after to confirm columns were added:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'tasks' AND column_name IN ('attachment_url','attachment_name','due_date');

-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name = 'task_templates';
