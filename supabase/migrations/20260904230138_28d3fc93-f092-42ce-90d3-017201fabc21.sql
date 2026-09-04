CREATE TABLE public.dev_blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Untitled entry',
  slug text NOT NULL,
  subtitle text,
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  cover_image_url text,
  cover_image_alt text,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL DEFAULT 'The Endless Codex',
  status text NOT NULL DEFAULT 'draft',
  category text NOT NULL DEFAULT 'Development',
  tags text[] NOT NULL DEFAULT '{}'::text[],
  seo_title text,
  seo_description text,
  og_image_url text,
  featured_as_update boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  scheduled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dev_blog_posts_slug_key UNIQUE (slug),
  CONSTRAINT dev_blog_posts_status_check CHECK (status IN ('draft','scheduled','published','archived'))
);

GRANT SELECT ON public.dev_blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dev_blog_posts TO authenticated;
GRANT ALL ON public.dev_blog_posts TO service_role;

ALTER TABLE public.dev_blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read live posts"
  ON public.dev_blog_posts FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    OR (status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= now())
  );

CREATE POLICY "Admins read every post"
  ON public.dev_blog_posts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins create posts"
  ON public.dev_blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update posts"
  ON public.dev_blog_posts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete posts"
  ON public.dev_blog_posts FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX dev_blog_posts_status_idx ON public.dev_blog_posts (status);
CREATE INDEX dev_blog_posts_published_at_idx ON public.dev_blog_posts (published_at DESC);
CREATE INDEX dev_blog_posts_author_idx ON public.dev_blog_posts (author_id);
CREATE INDEX dev_blog_posts_category_idx ON public.dev_blog_posts (category);

CREATE TRIGGER dev_blog_posts_updated_at
  BEFORE UPDATE ON public.dev_blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.dev_blog_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid,
  post_title text NOT NULL DEFAULT '',
  action text NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.dev_blog_audit TO authenticated;
GRANT ALL ON public.dev_blog_audit TO service_role;

ALTER TABLE public.dev_blog_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read audit history"
  ON public.dev_blog_audit FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins write audit history"
  ON public.dev_blog_audit FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND actor_id = auth.uid());

CREATE INDEX dev_blog_audit_post_idx ON public.dev_blog_audit (post_id, created_at DESC);