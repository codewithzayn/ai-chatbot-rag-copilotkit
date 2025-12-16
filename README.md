# AI Customer Chatbot with RAG

Production-ready AI chatbot with **Retrieval-Augmented Generation (RAG)** capabilities, built with CopilotKit, Next.js 14, and designed for scalability.

## 🚀 Features

- ✅ **CopilotKit Integration** - AI-powered chat interface with streaming responses
- ✅ **Next.js 14 + React 18** - Avoiding known vulnerabilities in Next.js 15/React 19
- ✅ **TypeScript** - Full type safety
- ✅ **Tailwind CSS** - Modern, responsive UI
- 🔄 **RAG Pipeline** - Semantic search with Supabase pgvector (coming next)
- 🔄 **Redis Semantic Caching** - Ultra-fast response times (coming next)
- 🔄 **OpenAI Integration** - Embeddings and chat completions (coming next)

## 📋 Prerequisites

- Node.js 18+
- npm, pnpm, yarn, or bun
- OpenAI API Key (for LLM responses)
- Supabase Account (for vector database) - *optional for now*
- Upstash Redis Account (for semantic caching) - *optional for now*

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd customer-chatbot
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.local.example agent/.env
```

Then edit `agent/.env` and add your API keys:

```env
OPENAI_API_KEY=your-openai-api-key-here
```

*Note: Supabase and Redis configuration will be added when implementing RAG backend.*

### 3. Start the Development Server

**Frontend Only** (recommended for testing UI):
```bash
npm run dev:ui
```

The app will be available at **http://localhost:3000**

**Full Stack** (requires Python and uv package manager):
```bash
npm run dev
```

This starts both the Next.js UI (port 3000) and LangGraph Python agent (port 8123).

## 🎨 Current Frontend Features

The chatbot UI is now ready with:

- **AI Chat Sidebar** - Powered by CopilotKit with streaming responses
- **Dynamic Theme** - Ask the AI to change colors (try: "Set the theme to blue")
- **Shared State** - Add customer support tips (try: "Add a tip about customer service")
- **Generative UI** - Weather cards and interactive components
- **Responsive Design** - Beautiful glassmorphism effects

## 🔜 Next Steps (Backend Implementation)

1. **Supabase Setup**
   - Create Supabase project
   - Enable pgvector extension
   - Create documents table with embeddings
   - Implement vector similarity search

2. **Redis Semantic Caching**
   - Set up Upstash Redis
   - Implement embedding-based cache
   - Add cache hit/miss logic

3. **RAG Pipeline**
   - Document ingestion endpoint
   - Embedding generation
   - Semantic search integration
   - Context aggregation for LLM

4. **Integration**
   - Connect frontend to RAG backend
   - Add document upload UI
   - Implement streaming with RAG context

## 📁 Project Structure

```
customer-chatbot/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── copilotkit/
│   │   │       └── route.ts          # CopilotKit API endpoint
│   │   ├── layout.tsx                # Root layout with CopilotKit provider
│   │   ├── page.tsx                  # Main chat interface
│   │   └── globals.css               # Global styles
│   └── lib/                          # Utility functions (to be added)
├── agent/                            # Python LangGraph agent
├── public/                           # Static assets
├── .env.local.example                # Environment variables template
├── next.config.js                    # Next.js configuration
├── tailwind.config.ts                # Tailwind CSS configuration
└── package.json                      # Dependencies and scripts
```

## 🧪 Testing the Frontend

1. Open http://localhost:3000
2. The chat sidebar should open automatically
3. Try these commands:
   - "Change the theme color to purple"
   - "Add a tip about being helpful to customers"
   - "Get the weather in San Francisco"

## 📚 Documentation

- [CopilotKit Docs](https://docs.copilotkit.ai)
- [Next.js 14 Docs](https://nextjs.org/docs)
- [LangGraph Docs](https://langchain-ai.github.io/langgraph/)

## 🔐 Security Notes

- Never commit `.env` files to version control
- All API keys are stored server-side only
- Frontend uses public license key only
- Backend API routes handle sensitive operations

## 📝 License

MIT License - See LICENSE file for details

---

**Status**: ✅ Frontend Complete | 🔄 Backend In Progress

Ready to test the frontend! Let me know when you're ready to proceed with the backend implementation (Supabase + Redis + RAG).