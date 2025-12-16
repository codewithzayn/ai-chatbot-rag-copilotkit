import type { Metadata } from "next";

import { CopilotKit } from "@copilotkit/react-core";
import "./globals.css";
import "@copilotkit/react-ui/styles.css";

export const metadata: Metadata = {
  title: "AI Customer Chatbot",
  description: "AI chatbot with RAG capabilities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={"antialiased"}>
        <CopilotKit 
          runtimeUrl="/api/copilotkit" 
          
          publicLicenseKey="ck_pub_3e7c97449db600e06738aa84458860ea"
          showDevConsole={false}
        >
          {children}
        </CopilotKit>
        
      </body>
    </html>
  );
}
