import { generateEmbedding } from "@/lib/openai/client";
import { retrieveContext, buildContextString } from "@/lib/rag/orchestrator";
import {
  searchSemanticCache,
  storeInSemanticCache,
} from "@/lib/redis/semantic-cache";

export const searchKnowledgeBaseTool = {
  name: "search_knowledge_base",
  description:
    "Always search the knowledge base for AI agent use cases and resources.",
  parameters: [
    {
      name: "query",
      description: "The user's exact question or keyword for the search",
      type: "string" as const, // just 'as const'
      required: true,
    },
  ],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (args: { query?: string; messages?: any[] }) => {
    console.log("=== Tool Handler Called ===");

    let query = args.query;
    if (!query && args.messages?.length) {
      const lastUserMessage = [...args.messages]
        .reverse()
        .find((m) => m.role === "user");
      query = lastUserMessage?.content;
    }

    if (!query) throw new Error("search_knowledge_base: query required");

    console.log("Query:", query);

    const embedding = await generateEmbedding(query);
    const cached = await searchSemanticCache(embedding, 0.88);
    if (cached) {
      console.log("Returning cached result");
      return cached; // raw string only
    }

    const context = await retrieveContext(query, 3, 0.7, embedding);
    const contextString = buildContextString(context.relevantDocs);

    await storeInSemanticCache(query, embedding, contextString);

    console.log("Returning KB context");
    return contextString; // raw string only
  },
};
