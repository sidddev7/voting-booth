-- Initial civic-vote schema

CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL REFERENCES proposals (id) ON DELETE CASCADE,
  voter_address TEXT NOT NULL,
  choice TEXT NOT NULL CHECK (choice IN ('yes', 'no', 'abstain')),
  tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (proposal_id, voter_address)
);

CREATE INDEX IF NOT EXISTS votes_proposal_id_idx ON votes (proposal_id);
CREATE INDEX IF NOT EXISTS votes_voter_address_idx ON votes (voter_address);
