ALTER TABLE documents ADD COLUMN IF NOT EXISTS source_hash TEXT;
CREATE INDEX IF NOT EXISTS documents_source_hash_idx ON documents(source_hash);
UPDATE documents
SET source_hash = metadata->>'source_hash'
WHERE source_hash IS NULL AND metadata ? 'source_hash';
