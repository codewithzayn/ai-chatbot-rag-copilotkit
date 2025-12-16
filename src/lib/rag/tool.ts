import { generateEmbedding } from "@/lib/openai/client";
import {
  retrieveContext,
  buildContextString,
} from "@/lib/rag/orchestrator";
import {
  searchSemanticCache,
  storeInSemanticCache,
} from "@/lib/redis/semantic-cache";

/**
 * ============================
 * Knowledge Base Search Tool
 * ============================
 *
 * IMPORTANT:
 * - CopilotKit parameter typing is strict
 * - We intentionally avoid defining parameters schema
 * - Arguments are still passed correctly at runtime
 */
export const searchKnowledgeBaseTool = {
  name: "search_knowledge_base",
  description: "Search the knowledge base to retrieve relevant documents",
  parameters: [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (args: { query?: string; messages?: any[] }) => {
        console.log("=== Tool Handler Called ===");
    let query = args.query;
    if (!query && args.messages?.length) {
      const lastUserMessage = [...args.messages].reverse().find(
        (m) => m.role === "user"
      );
      query = lastUserMessage?.content;
      console.log('lastUserMessage', lastUserMessage);
    }

    if (!query) {
      throw new Error("search_knowledge_base: query is required");
    }

    const embedding = await generateEmbedding(query);
    console.log('embedding', embedding);
    const cached = await searchSemanticCache(embedding, 0.88);
    if (cached) return { role: "tool", content: cached }; // ✅ wrap as message

    const context = await retrieveContext(query, 3, 0.7, embedding);
    console.log('context', context);
    const contextString = buildContextString(context.relevantDocs);
    console.log('contextString', contextString);

    await storeInSemanticCache(query, embedding, contextString);

    return { role: "tool", content: contextString }; // ✅ wrap as message
  },
};


