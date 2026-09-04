CREATE POLICY "Admins upload blog media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'blog-media' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins read blog media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'blog-media' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update blog media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'blog-media' AND public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'blog-media' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete blog media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'blog-media' AND public.has_role(auth.uid(), 'admin'::app_role));