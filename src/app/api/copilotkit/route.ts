import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import { chatRateLimiter } from "@/lib/rate-limit/ index";
import { searchKnowledgeBaseTool } from "@/lib/rag/tool";

/**
 * ============================
 * OpenAI Adapter
 * ============================
 */
const serviceAdapter = new OpenAIAdapter({
  model: "gpt-4o-mini",
});

/**
 * ============================
 * Copilot Runtime
 * ============================
 */
const runtime = new CopilotRuntime({
  actions: [searchKnowledgeBaseTool],
});

/**
 * ============================
 * POST Handler
 * ============================
 */
export const POST = async (req: NextRequest) => {
  try {
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Rate limiting (safe here)
    if (!chatRateLimiter.check(ip)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        { status: 429 }
      );
    }
    console.log('req.headers.get("x-forwarded-for")', req.headers.get("x-forwarded-for"))
    console.log('req.headers.get("x-forwarded-for")', req.headers.get("x-real-ip"))
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: "/api/copilotkit",
    });
    return handleRequest(req);
  } catch (error) {
    console.error("[CopilotKit API] Fatal error:", error);

    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
};
