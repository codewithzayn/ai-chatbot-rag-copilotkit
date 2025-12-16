import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import {
  retrieveContext,
  buildContextString,
  cacheQueryResponse,
} from "@/lib/rag/orchestrator";
import { searchSemanticCache } from "@/lib/redis/semantic-cache";
import { chatRateLimiter } from "@/lib/rate-limit";
import { generateEmbedding } from "@/lib/openai/client";

interface CopilotMessage {
  role: string;
  content: string;
}

if (!process.env.OPENAI_API_KEY) {
  console.error(
    "CRITICAL: OPENAI_API_KEY is missing in environment variables!"
  );
}

const serviceAdapter = new OpenAIAdapter({
  model: "gpt-4o-mini",
});

// Create the CopilotRuntime instance with RAG Tool
const runtime = new CopilotRuntime({
  actions: [
    {
      name: "search_knowledge_base",
      description:
        "Search the knowledge base for information to answer user questions. Always use this tool when the user asks about products, services, or support tips.",
      parameters: [
        {
          name: "query",
          type: "string",
          description: "The search query to find relevant documents.",
          required: true,
        },
      ],
      handler: async ({ query }) => {
        try {
          const queryEmbedding = await generateEmbedding(query);
          const cachedResponse = await searchSemanticCache(
            queryEmbedding,
            0.88
          );
          if (cachedResponse) {
            return cachedResponse;
          }

          const ragContext = await retrieveContext(
            query,
            3,
            0.7,
            queryEmbedding
          );
          const contextString = buildContextString(ragContext.relevantDocs);

          return contextString;
        } catch (error) {
          console.error(
            "[Tool Call Error] search_knowledge_base failed:",
            error
          );
          throw new Error(
            `Failed to search knowledge base: ${
              error instanceof Error ? error.message : JSON.stringify(error)
            }`
          );
        }
      },
    },
  ],
});

export const POST = async (req: NextRequest) => {
  const startTime = Date.now();
  console.log("[Copilotkit API] Request started");
  try {
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (!chatRateLimiter.check(ip)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please slow down." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const requestData = await req.json();
    console.log(`[Copilotkit API] Body parsed in ${Date.now() - startTime}ms`);

    const rawMessages = requestData.messages || requestData.body?.messages;

    // Explicitly check if messages is defined. If we force [] on undefined, we break non-chat requests.
    if (rawMessages) {
      const messages = rawMessages as CopilotMessage[];

      const systemInstruction = `You are an expert AI Assistant specialized in explaining "AI Agents" to clients.
      
      Your Knowledge Base & Core Definition:
      AI agents are autonomous systems powered by AI (often large language models) that can perceive their environment, reason, plan, use tools, and execute multi-step tasks with minimal human intervention. 
      They differ from simple chatbots by acting independently to achieve goals.
      
      You have access to a rich knowledge base containing:
      1. Curated Collections (e.g., 500 AI Agents Projects on GitHub).
      2. Real-World Examples (Netflix, Self-driving cars, Precision farming, etc.).
      3. Enterprise Use Cases (IBM, Oracle, AI21 examples in HR, Marketing, Finance).
      4. Learning Resources (IBM Guide, Hugging Face courses).
      
      INSTRUCTIONS:
      - When asked about what AI agents can do, uses can provide specific real-world examples from your knowledge base.
      - Emphasize their ability to "perceive, reason, plan, and execute".
      - ALWAYS use the 'search_knowledge_base' tool to retrieve specific details, examples, and links when answering user queries about these topics.
      - **CRITICAL: Be CONCISE. Keep answers short and to the point. Do not be verbose.**
      - Be professional, insightful, and helpful.`;

      if (messages.length === 0 || messages[0].role !== "system") {
        messages.unshift({
          role: "system",
          content: systemInstruction,
        });
        // Ensure specific request structure for runtime
        if (requestData.body) {
          requestData.body.messages = messages;
        } else {
          requestData.messages = messages;
        }
      }

      const lastUserMessage = [...messages]
        .reverse()
        .find((m) => m.role === "user");

      if (lastUserMessage) {
        const userQuery = lastUserMessage.content;
        try {
          console.log(`[Copilotkit API] Generating embedding...`);
          const embStart = Date.now();
          const queryEmbedding = await generateEmbedding(userQuery);
          console.log(
            `[Copilotkit API] Embedding generated in ${Date.now() - embStart}ms`
          );

          // Lower threshold to 0.88 for better semantic matching (e.g. typos, phrasing)
          const cacheStart = Date.now();
          const cachedResponse = await searchSemanticCache(
            queryEmbedding,
            0.88
          );
          console.log(
            `[Copilotkit API] Cache check completed in ${
              Date.now() - cacheStart
            }ms`
          );

          if (cachedResponse) {
            // Return raw cached SSE stream directly
            return new Response(cachedResponse, {
              status: 200,
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
              },
            });
          }
        } catch (embError) {
          console.error(
            "[Semantic Cache] Embedding/Check failed, proceeding to LLM:",
            embError
          );
        }
      }
    }

    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: "/api/copilotkit",
    });

    const newRequest = new NextRequest(req.url, {
      method: req.method,
      headers: req.headers,
      body: JSON.stringify({
        ...requestData,
        forwardedParameters: {
          ...requestData.forwardedParameters,
          maxTokens: 500,
        },
      }),
    });

    console.log(`[Copilotkit API] Calling CopilotKit handler...`);
    const handlerStart = Date.now();
    const response = await handleRequest(newRequest);
    console.log(
      `[Copilotkit API] CopilotKit handler completed in ${
        Date.now() - handlerStart
      }ms`
    );
    if (rawMessages && response.ok) {
      const messages = rawMessages as CopilotMessage[];
      const lastUserMessage = [...messages]
        .reverse()
        .find((m) => m.role === "user");

      if (lastUserMessage && lastUserMessage.role === "user") {
        const responseClone = response.clone();
        (async () => {
          try {
            const rawStreamData = await responseClone.text();
            if (rawStreamData) {
              await cacheQueryResponse(lastUserMessage.content, rawStreamData);
            }
          } catch (err) {
            console.error("Failed to process/cache response:", err);
          }
        })();
      }
    }

    return response;
  } catch (error: unknown) {
    console.error("CopilotKit API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
