CREATE TABLE public.admin_message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL,
  message_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (admin_id, campaign_id, message_id)
);

GRANT SELECT, INSERT, DELETE ON public.admin_message_reads TO authenticated;
GRANT ALL ON public.admin_message_reads TO service_role;

ALTER TABLE public.admin_message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read their own message marks"
  ON public.admin_message_reads FOR SELECT TO authenticated
  USING (auth.uid() = admin_id AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins add their own message marks"
  ON public.admin_message_reads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = admin_id AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins remove their own message marks"
  ON public.admin_message_reads FOR DELETE TO authenticated
  USING (auth.uid() = admin_id AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX admin_message_reads_admin_idx ON public.admin_message_reads (admin_id);