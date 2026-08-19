-- ============================================================================
-- schema.sql — the shape of the database (Cloudflare D1, which is SQLite)
-- ----------------------------------------------------------------------------
-- Run this ONCE against your database to create the tables:
--   npx wrangler d1 execute studybuddy-db --remote --file schema.sql
-- Re-running is safe: every table uses "IF NOT EXISTS".
-- Three tables: profiles (people), matches (pairings), messages (chat).
-- ============================================================================

-- PROFILES — one row per person who signs up.
CREATE TABLE IF NOT EXISTS profiles (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,  -- unique number for this person
  name       TEXT    NOT NULL,
  email      TEXT    NOT NULL UNIQUE,            -- one signup per email
  age        INTEGER NOT NULL,                   -- used by the AGE GATE safety rule
  answers    TEXT    NOT NULL,                   -- all their survey answers, stored as JSON text
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- MATCHES — one row per pairing. profile_a is the person who asked to be matched,
-- profile_b is the buddy they were paired with. One match per person (see match.js).
CREATE TABLE IF NOT EXISTS matches (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_a  INTEGER NOT NULL,                   -- requester
  profile_b  INTEGER NOT NULL,                   -- their buddy
  score      INTEGER NOT NULL DEFAULT 0,         -- how strong the rule-based overlap was
  reason     TEXT    NOT NULL,                   -- plain-language "why you two"
  source     TEXT    NOT NULL DEFAULT 'rule',    -- 'rule' or 'ai' — which layer picked
  status     TEXT    NOT NULL DEFAULT 'matched', -- matched | confirmed
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (profile_a) REFERENCES profiles(id),
  FOREIGN KEY (profile_b) REFERENCES profiles(id)
);

-- MESSAGES — the conversation between two matched people.
CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id   INTEGER NOT NULL,                   -- which pairing this belongs to
  sender_id  INTEGER NOT NULL,                   -- which profile sent it
  body       TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (match_id) REFERENCES matches(id),
  FOREIGN KEY (sender_id) REFERENCES profiles(id)
);
