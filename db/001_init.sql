-- Kashan portfolio: content storage.
-- The existing site keeps ALL of its content (profile + projects) as one document,
-- so it is stored as a single JSONB row. `version` is used for optimistic locking so two
-- browser tabs cannot silently overwrite each other.
CREATE TABLE IF NOT EXISTS site_content (
  id         text PRIMARY KEY,
  data       jsonb       NOT NULL,
  version    integer     NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Block Supabase's public API from this table (no policies = no access for anon/authenticated roles).
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
