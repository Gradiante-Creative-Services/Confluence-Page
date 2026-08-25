CREATE TABLE document_chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id TEXT NOT NULL REFERENCES artifact_files(id) ON DELETE CASCADE,
  artifact_id TEXT NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding TEXT NOT NULL, -- JSON number[]
  UNIQUE (file_id, chunk_index)
);

CREATE INDEX idx_document_chunks_artifact_id ON document_chunks(artifact_id);
CREATE INDEX idx_document_chunks_file_id ON document_chunks(file_id);

CREATE TABLE ingestion_jobs (
  file_id TEXT PRIMARY KEY REFERENCES artifact_files(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending','processing','done','failed')),
  chunk_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  updated_at TEXT NOT NULL
);
