CREATE TABLE public.titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  rarity text NOT NULL DEFAULT 'common',
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  criteria_kind text NOT NULL DEFAULT 'manual',
  criteria_target integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.titles TO anon;
GRANT SELECT ON public.titles TO authenticated;
GRANT ALL ON public.titles TO service_role;

ALTER TABLE public.titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active titles" ON public.titles
  FOR SELECT USING (is_active OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage titles" ON public.titles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER titles_updated_at BEFORE UPDATE ON public.titles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.player_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title_id uuid NOT NULL REFERENCES public.titles(id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, title_id)
);

GRANT SELECT ON public.player_titles TO anon;
GRANT SELECT, INSERT ON public.player_titles TO authenticated;
GRANT ALL ON public.player_titles TO service_role;

ALTER TABLE public.player_titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view earned titles" ON public.player_titles
  FOR SELECT USING (true);

CREATE POLICY "Users can record their own earned titles" ON public.player_titles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage earned titles" ON public.player_titles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.titles (slug, name, description, rarity, icon, criteria_kind, criteria_target) VALUES
  ('first-steps', 'First Steps', 'Created your first hero.', 'common', 'sparkles', 'characters_created', 1),
  ('party-leader', 'Party Leader', 'Created five heroes.', 'uncommon', 'users', 'characters_created', 5),
  ('storyteller', 'Storyteller', 'Started your first campaign.', 'common', 'book', 'campaigns_created', 1),
  ('worldwright', 'Worldwright', 'Forged your first world.', 'uncommon', 'globe', 'worlds_created', 1),
  ('cartographer', 'Cartographer', 'Made five maps.', 'rare', 'map', 'maps_created', 5),
  ('lucky-hand', 'Lucky Hand', 'Rolled the dice one hundred times.', 'rare', 'dice', 'dice_rolled', 100),
  ('veteran', 'Veteran of the Codex', 'Thirty days since joining.', 'epic', 'crown', 'days_since_joined', 30);