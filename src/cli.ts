import { ToolSet, tool, streamText } from "ai";
import { z } from "zod";
import { A2AClient } from "./client.js";
import { createInterface } from "node:readline/promises";
import { google } from "@ai-sdk/google";

const client = new A2AClient("http://localhost:3000");
const agentCard = await client.agentCard();

// diceツールを定義
const dice = tool({
  description: "サイコロを振って1から6の数字を返します。",
  parameters: z.object({
    dice: z.number().min(1).describe("サイコロの面数").optional().default(6),
  }),
  execute: async ({ dice = 6 }) => {
    // 実行結果を文字列として返す
    const result = Math.floor(Math.random() * dice) + 1;
    return result.toString();
  },
});

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  while (true) {
    const input = await rl.question("あなた: ");
    if (input === "exit") {
      break;
    }

    const response = streamText({
      model: google("gemini-2.5-pro-exp-03-25"),
      tools: { dice },
      messages: [
        {
          role: "system",
          content: `あなたはサイコロを振るアシスタントです。
サイコロを振ってほしいという要望があった場合は、必ずdiceツールを使用してください。
diceツールの結果を使って、サイコロの目を伝えてください。
例：「サイコロを振った結果は{diceの結果}でした！」`
        },
        { role: "user", content: input }
      ],
      maxSteps: 5,
    });

    process.stdout.write("AI: ");
    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
    }
    process.stdout.write("\n");
  }
}

main()
  .catch((err) => {
    console.error("Error:", err);
  })
  .finally(() => {
    rl.close();
  });