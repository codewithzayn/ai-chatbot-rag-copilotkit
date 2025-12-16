"use client";

import { CopilotChat } from "@copilotkit/react-ui";

export default function CopilotKitPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 sm:p-8">
      <div className="w-full max-w-5xl h-[85vh] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 ring-1 ring-black/5">
        <CopilotChat
          labels={{
            title: "AI Assistant",
            initial: "Hello! I'm your AI assistant. How can I help you today?",
          }}
          className="h-full"
        />
      </div>
    </main>
  );
}
