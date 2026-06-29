
-- Add attachment and due_date support to tasks
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS attachment_url  text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS due_date        timestamptz;

-- Task templates table for super admin efficiency
CREATE TABLE IF NOT EXISTS public.task_templates (
  id              uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text      NOT NULL,
  description     text,
  task_type       text      NOT NULL DEFAULT 'general',
  reward          numeric   NOT NULL DEFAULT 80,
  video_links     jsonb     DEFAULT '[]'::jsonb,
  attachment_url  text,
  attachment_name text,
  created_by      uuid      REFERENCES auth.users(id),
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage task templates" ON public.task_templates;
CREATE POLICY "admins manage task templates" ON public.task_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin','admin')
    )
  );
