// src/server/task.ts
import { Hono } from "hono";
import { Context } from "hono";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { tool, generateText } from "ai";
import { google } from "@ai-sdk/google";
import {
  Artifact,
  ErrorMessage,
  Task,
  TaskSendParams,
  TaskStatus,
  Message,
} from "../schema";

const taskApp = new Hono();

// --- メモリ上のタスクストア ---
interface TaskAndHistory {
  task: Task;
  history: Message[];
}
const taskStore = new Map<string, TaskAndHistory>();

// --- JSON-RPCのバリデーション ---
function isValidJsonRpcRequest(body: any) {
  return (
    typeof body === "object" &&
    body !== null &&
    body.jsonrpc === "2.0" &&
    typeof body.method === "string" &&
    (body.id === null ||
      typeof body.id === "string" ||
      typeof body.id === "number") &&
    (body.params === undefined ||
      typeof body.params === "object" ||
      Array.isArray(body.params))
  );
}

// --- Diceツールの定義 ---
const dice = tool({
  description: "入力された面数のサイコロを振ります。",
  parameters: z.object({
    dice: z.number().min(1).describe("サイコロの面数").optional().default(6),
  }),
  execute: async ({ dice = 6 }) => {
    return Math.floor(Math.random() * dice) + 1;
  },
});

// --- タスクの取得・作成 ---
function getOrCreateTask(taskId: string, initialMessage: Message): TaskAndHistory {
  let data = taskStore.get(taskId);
  if (!data) {
    const newTask: Task = {
      id: taskId,
      sessionId: randomUUID(),
      status: {
        state: "submitted",
        timestamp: new Date().toISOString(),
        message: undefined,
      },
      history: [],
      artifacts: [],
    };
    data = { task: newTask, history: [initialMessage] };
    taskStore.set(taskId, data);
  } else {
    const completedStates = ["completed", "canceled", "failed"];
    if (completedStates.includes(data.task.status.state)) {
      const errorResponse: ErrorMessage = {
        code: -32603,
        message: "Task already completed",
      };
      throw new Error(JSON.stringify(errorResponse));
    }
    data = {
      ...data,
      history: [...data.history, initialMessage],
    };
  }
  return data;
}

// --- tasks/send の処理 ---
async function handleSendTask(c: Context, body: any) {
  const params: TaskSendParams = body.params;
  if (!params || !params.id || !params.message) {
    const errorResponse: ErrorMessage = {
      code: -32602,
      message: "Invalid params",
    };
    return c.json(errorResponse, 400);
  }

  const getOrCreateTaskResult = getOrCreateTask(params.id, params.message);

  taskStore.set(params.id, {
    ...getOrCreateTaskResult,
    task: {
      ...getOrCreateTaskResult.task,
      status: {
        state: "working",
        timestamp: new Date().toISOString(),
      },
    },
  });

  const result = await generateText({
    model: google("gemini-2.5-pro-exp-03-25"),
    tools: { dice },
    maxSteps: 5,
    messages: params.message.parts.map((part) => ({
      role: params.message.role === "user" ? "user" : "system",
      content: part.type === "text" ? part.text : "",
    })),
  });

  const artifact: Artifact = {
    name: "dice",
    description: "サイコロの目",
    parts: [
      {
        type: "text",
        text: result.text,
        metadata: {},
      },
    ],
    metadata: {},
    index: 0,
  };

  const history = result.steps.map((step) => ({
    role: "agent",
    parts: [
      {
        type: "text",
        text: step.text,
        metadata: {},
      },
    ],
    metadata: {},
  })) as Message[];

  taskStore.set(params.id, {
    ...getOrCreateTaskResult,
    task: {
      ...getOrCreateTaskResult.task,
      status: {
        state: "completed",
        message: {
          role: "agent",
          parts: [
            {
              type: "text",
              text: result.text,
              metadata: {},
            },
          ],
        },
        timestamp: new Date().toISOString(),
      },
      artifacts: [artifact],
      history: [...getOrCreateTaskResult.history, ...history],
    },
  });

  return c.json({
    jsonrpc: "2.0",
    id: body.id,
    result: {
      id: params.id,
      sessionId: getOrCreateTaskResult.task.sessionId,
      status: "completed",
      artifacts: [artifact],
    },
  });
}

// --- tasks/get の処理 ---
async function handleGetTask(c: Context, body: any) {
  const params = body.params;
  if (!params || !params.id) {
    const errorResponse: ErrorMessage = {
      code: -32602,
      message: "Invalid params",
    };
    return c.json(errorResponse, 400);
  }

  const taskAndHistory = taskStore.get(params.id);
  if (!taskAndHistory) {
    const errorResponse: ErrorMessage = {
      code: -32603,
      message: "Task not found",
    };
    return c.json(errorResponse, 404);
  }

  return c.json({
    jsonrpc: "2.0",
    id: body.id,
    result: {
      id: taskAndHistory.task.id,
      sessionId: taskAndHistory.task.sessionId,
      status: taskAndHistory.task.status,
      artifacts: taskAndHistory.task.artifacts,
    },
  });
}

// --- POSTルーティング ---
taskApp.post("/", async (c) => {
  const body = await c.req.json();

  if (!isValidJsonRpcRequest(body)) {
    const errorResponse: ErrorMessage = {
      code: -32600,
      message: "Invalid Request",
    };
    return c.json(errorResponse, 400);
  }

  switch (body.method) {
    case "tasks/send":
      return await handleSendTask(c, body);
    case "tasks/get":
      return await handleGetTask(c, body);
    default:
      const errorResponse: ErrorMessage = {
        code: -32601,
        message: "Method not found",
      };
      return c.json(errorResponse, 404);
  }
});

export { taskApp };
