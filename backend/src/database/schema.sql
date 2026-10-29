CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  email_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);

CREATE TABLE IF NOT EXISTS email_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS user_ai_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  base_url text NOT NULL,
  model text NOT NULL,
  api_key_ciphertext text NOT NULL,
  key_hint text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  cover_url text,
  tags text[] NOT NULL DEFAULT '{}',
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'unlisted', 'public')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  graph jsonb NOT NULL,
  estimated_minutes integer NOT NULL DEFAULT 10,
  ending_count integer NOT NULL DEFAULT 1,
  favorite_count integer NOT NULL DEFAULT 0,
  play_count integer NOT NULL DEFAULT 0,
  score numeric(4,2) NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stories_public_idx ON stories(status, visibility, published_at DESC);
CREATE INDEX IF NOT EXISTS stories_author_idx ON stories(author_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS story_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('image', 'audio', 'video')),
  original_name text NOT NULL,
  mime_type text NOT NULL,
  size bigint NOT NULL DEFAULT 0,
  storage_key text,
  source_url text,
  sha256 text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('pending', 'ready', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS story_assets_story_idx ON story_assets(story_id, created_at);

CREATE TABLE IF NOT EXISTS story_asset_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES story_assets(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('playback')),
  mime_type text NOT NULL,
  width integer,
  height integer,
  size bigint NOT NULL DEFAULT 0,
  storage_key text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'failed')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (asset_id, purpose)
);

CREATE INDEX IF NOT EXISTS story_asset_variants_asset_idx ON story_asset_variants(asset_id, purpose);

CREATE TABLE IF NOT EXISTS story_narration_settings (
  story_id uuid PRIMARY KEY REFERENCES stories(id) ON DELETE CASCADE,
  voice_id text NOT NULL DEFAULT 'alloy',
  speed numeric(3,2) NOT NULL DEFAULT 1,
  volume numeric(3,2) NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS story_narration_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  provider text NOT NULL,
  voice_id text NOT NULL,
  speed numeric(3,2) NOT NULL DEFAULT 1,
  volume numeric(3,2) NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  total_nodes integer NOT NULL DEFAULT 0,
  completed_nodes integer NOT NULL DEFAULT 0,
  failed_nodes integer NOT NULL DEFAULT 0,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS story_narration_jobs_story_idx ON story_narration_jobs(story_id, created_at DESC);

CREATE TABLE IF NOT EXISTS story_narrations (
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  node_id text NOT NULL,
  text_hash text NOT NULL,
  provider text NOT NULL,
  voice_id text NOT NULL,
  speed numeric(3,2) NOT NULL DEFAULT 1,
  asset_id uuid REFERENCES story_assets(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'failed')),
  duration_ms integer,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, node_id)
);

CREATE INDEX IF NOT EXISTS story_narrations_asset_idx ON story_narrations(asset_id);

CREATE TABLE IF NOT EXISTS favorites (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, story_id)
);

CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'discussion' CHECK (kind IN ('discussion', 'share')),
  story_id uuid REFERENCES stories(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_posts_status_idx ON community_posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS community_posts_author_idx ON community_posts(author_id, created_at DESC);

CREATE TABLE IF NOT EXISTS community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_comments_post_idx ON community_comments(post_id, created_at ASC);

CREATE TABLE IF NOT EXISTS story_ai_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_id uuid REFERENCES stories(id) ON DELETE SET NULL,
  phase text NOT NULL DEFAULT 'interview' CHECK (phase IN ('interview', 'outline', 'generated', 'applied')),
  provider text NOT NULL DEFAULT 'guided-template',
  brief jsonb NOT NULL DEFAULT '{}',
  preferences jsonb NOT NULL DEFAULT '{}',
  current_question jsonb,
  ready boolean NOT NULL DEFAULT false,
  outline jsonb,
  draft_graph jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS story_ai_sessions_user_idx ON story_ai_sessions(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS story_ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES story_ai_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS story_ai_messages_session_idx ON story_ai_messages(session_id, created_at ASC);
