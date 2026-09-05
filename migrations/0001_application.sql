-- Application data only. User IDs are verified by Supabase Auth in the Worker.
-- Ownership and admin access are enforced by the server, not SQLite RLS.

CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT 'Adventurer',
  avatar_url TEXT,
  title TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE user_roles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-8' || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (user_id, role)
);

CREATE TABLE characters (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-8' || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Unnamed hero',
  data TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE worlds (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-8' || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'New world',
  data TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE campaigns (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-8' || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  user_id TEXT NOT NULL,
  world_id TEXT REFERENCES worlds(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'New campaign',
  data TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE game_maps (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-8' || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  user_id TEXT NOT NULL,
  world_id TEXT REFERENCES worlds(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'New map',
  data TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE dice_rolls (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-8' || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  user_id TEXT NOT NULL,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  data TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE feedback (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-8' || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  user_id TEXT NOT NULL,
  kind text NOT NULL DEFAULT 'bug',
  title text NOT NULL,
  details text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  admin_note text,
  page_url text,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-8' || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  user_id TEXT NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start TEXT,
  current_period_end TEXT,
  cancel_at_period_end INTEGER NOT NULL DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE titles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-8' || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  rarity text NOT NULL DEFAULT 'common',
  icon text,
  is_active INTEGER NOT NULL DEFAULT true,
  criteria_kind text NOT NULL DEFAULT 'manual',
  criteria_target integer NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE player_titles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-8' || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  user_id TEXT NOT NULL,
  title_id TEXT NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  awarded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (user_id, title_id)
);

CREATE TABLE dev_blog_posts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-8' || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  title text NOT NULL DEFAULT 'Untitled entry',
  slug text NOT NULL,
  subtitle text,
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  cover_image_url text,
  cover_image_alt text,
  author_id TEXT,
  author_name text NOT NULL DEFAULT 'The Endless Codex',
  status text NOT NULL DEFAULT 'draft',
  category text NOT NULL DEFAULT 'Development',
  tags TEXT NOT NULL DEFAULT '[]',
  seo_title text,
  seo_description text,
  og_image_url text,
  featured_as_update INTEGER NOT NULL DEFAULT false,
  published_at TEXT,
  scheduled_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CONSTRAINT dev_blog_posts_slug_key UNIQUE (slug),
  CONSTRAINT dev_blog_posts_status_check CHECK (status IN ('draft','scheduled','published','archived'))
);

CREATE TABLE dev_blog_audit (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-8' || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  post_id TEXT,
  post_title text NOT NULL DEFAULT '',
  action text NOT NULL,
  actor_id TEXT,
  actor_name text NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE admin_message_reads (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-8' || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  admin_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  message_id text NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (admin_id, campaign_id, message_id)
);

CREATE INDEX characters_user_idx ON characters(user_id);

CREATE INDEX worlds_user_idx ON worlds(user_id);

CREATE INDEX campaigns_user_idx ON campaigns(user_id);

CREATE INDEX game_maps_user_idx ON game_maps(user_id);

CREATE INDEX dice_rolls_user_idx ON dice_rolls(user_id, created_at DESC);

CREATE INDEX feedback_created_at_idx ON feedback (created_at DESC);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

CREATE INDEX dev_blog_posts_status_idx ON dev_blog_posts (status);

CREATE INDEX dev_blog_posts_published_at_idx ON dev_blog_posts (published_at DESC);

CREATE INDEX dev_blog_posts_author_idx ON dev_blog_posts (author_id);

CREATE INDEX dev_blog_posts_category_idx ON dev_blog_posts (category);

CREATE INDEX dev_blog_audit_post_idx ON dev_blog_audit (post_id, created_at DESC);

CREATE INDEX admin_message_reads_admin_idx ON admin_message_reads (admin_id);

INSERT INTO titles (slug, name, description, rarity, icon, criteria_kind, criteria_target) VALUES
  ('first-steps', 'First Steps', 'Created your first hero.', 'common', 'sparkles', 'characters_created', 1),
  ('party-leader', 'Party Leader', 'Created five heroes.', 'uncommon', 'users', 'characters_created', 5),
  ('storyteller', 'Storyteller', 'Started your first campaign.', 'common', 'book', 'campaigns_created', 1),
  ('worldwright', 'Worldwright', 'Forged your first world.', 'uncommon', 'globe', 'worlds_created', 1),
  ('cartographer', 'Cartographer', 'Made five maps.', 'rare', 'map', 'maps_created', 5),
  ('lucky-hand', 'Lucky Hand', 'Rolled the dice one hundred times.', 'rare', 'dice', 'dice_rolled', 100),
  ('veteran', 'Veteran of the Codex', 'Thirty days since joining.', 'epic', 'crown', 'days_since_joined', 30);
