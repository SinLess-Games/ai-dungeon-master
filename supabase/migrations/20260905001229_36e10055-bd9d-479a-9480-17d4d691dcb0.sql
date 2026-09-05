REVOKE SELECT ON public.player_titles FROM anon;

DROP POLICY IF EXISTS "Anyone can view earned titles" ON public.player_titles;

CREATE POLICY "Players and admins can view earned titles" ON public.player_titles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));