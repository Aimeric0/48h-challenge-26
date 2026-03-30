import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

export function registerSayHello(server: any) {
  server.registerTool(
    "say_hello",
    {
      title: "Say Hello",
      description: "Says hello to someone.",
      inputSchema: {
        name: z.string(),
      },
    },
    async ({ name }: { name: string }) => {
      return {
        content: [{ type: "text", text: `Bonjour ${name} !` }],
      };
    }
  );
}