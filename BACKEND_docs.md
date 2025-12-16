# Backend Documentation & Setup

## 🎯 System Overview
A high-performance RAG (Retrieval-Augmented Generation) backend built with Next.js, OpenAI, Supabase (Vector Store), and Redis (Semantic Cache).

## 🏗 Architecture
- **API**: Next.js App Router (`/api/*`)
- **Vector Database**: Supabase (pgvector)
- **Caching**: Redis (Semantic Similarity Caching)
- **AI Model**: OpenAI GPT-4o / Embedding-3-small
- **Processing**: PDF parsing and automatic text chunking

## 🔧 Setup & Configuration

### 1. Environment Variables (`.env.local`)
Create this file and ensure it is **never committed** to Git.

```env
# OpenAI Environment
OPENAI_API_KEY=sk-...

# Supabase (Vector Store)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ey... (Service Role Key required for RAG)

# Redis (Semantic Cache)
# Use one or the other below:
REDIS_URL=redis://localhost:6379  # Local
# UPSTASH_REDIS_REST_URL=...      # Production
```

### 2. Database Migration (Supabase)
Run this SQL in your Supabase SQL Editor to enable vectors:

```sql
-- Enable pgvector extension
create extension if not exists vector;

-- Create documents table
create table documents (
  id uuid primary key default gen_random_uuid(),
  content text,
  metadata jsonb,
  embedding vector(1536), -- Matches OpenAI embedding-3-small
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Search function for RAG
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;
```

## 🔌 API Endpoints

### 1. Upload Document (Parse & Embed)
**POST** `/api/documents/upload`
- **Body**: `FormData` with a key `file` (PDF only).
- **Process**:
  1. Validates PDF & size (<10MB).
  2. Extracts text using `pdf-parse`.
  3. Chunks text into segments (500 chars, 50 overlap).
  4. Generates embeddings via OpenAI.
  5. Stores in Supabase.

**Curl Example**:
```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@./knowledge-base/manual.pdf"
```

### 2. Chat (RAG Pipeline)
The chat logic is handled via CopilotKit but internally flows as:
1. **User Request** -> **Generate Embedding**
2. **Redis Check**: Is there a similar question stored (sim > 088)?
   - **YES**: Return cached answer (Speed: ~50ms).
   - **NO**: Continue.
3. **Vector Search**: Query Supabase for relevant chunks.
4. **LLM Generation**: Send chunks + query to OpenAI.
5. **Cache Store**: Save result to Redis for future.

## 🐛 Debugging & Testing
- **Debugger**: Place `debugger;` in `route.ts`.
- **Logs**: Check terminal for `[RAG]`, `[Cache HIT]`, and `[PDF Processing]` tags.
- **Git Safety**: `.env` files are ignored via `.gitignore`.
