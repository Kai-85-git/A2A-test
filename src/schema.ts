// src/schema.ts

// AgentCard ----------------------------------------------------
export interface AgentCard {
    name: string;
    description: string;
    url: string;
    provider?: {
      organization: string;
      url: string;
    };
    version: string;
    documentationUrl?: string;
    capabilities: {
      streaming?: boolean;
      pushNotifications?: boolean;
      stateTransitionHistory?: boolean;
    };
    authentication: {
      schemes: string[];
      credentials?: string;
    };
    defaultInputModes: string[];
    defaultOutputModes: string[];
    skills: {
      id: string;
      name: string;
      description: string;
      tags: string[];
      examples?: string[];
      inputModes?: string[];
      outputModes?: string[];
    }[];
  }
  
  // Task --------------------------------------------------------
  export interface Task {
    id: string;
    sessionId: string;
    status: TaskStatus;
    history?: Message[];
    artifacts?: Artifact[];
    metadata?: Record<string, any>;
  }
  
  export interface TaskStatus {
    state: TaskState;
    message?: Message;
    timestamp?: string;
  }
  
  export interface TaskSendParams {
    id: string;
    sessionId?: string;
    message: Message;
    historyLength?: number;
    pushNotification?: PushNotificationConfig;
    metadata?: Record<string, any>;
  }
  
  export type TaskState =
    | "submitted"
    | "working"
    | "input-required"
    | "completed"
    | "canceled"
    | "failed"
    | "unknown";
  
  interface PushNotificationConfig {
    url: string;
    token?: string;
    authentication?: {
      schemes: string[];
      credentials?: string;
    };
  }
  
  export interface Message {
    role: "user" | "agent";
    parts: Part[];
    metadata?: Record<string, any>;
  }
  
  interface TextPart {
    type: "text";
    text: string;
  }
  
  interface FilePart {
    type: "file";
    file: {
      name?: string;
      mimeType?: string;
      bytes?: string;
      uri?: string;
    };
  }
  
  interface DataPart {
    type: "data";
    data: Record<string, any>;
  }
  
  export type Part = (TextPart | FilePart | DataPart) & {
    metadata: Record<string, any>;
  };
  
  // Artifact ---------------------------------------------------
  export interface Artifact {
    name?: string;
    description?: string;
    parts: Part[];
    metadata?: Record<string, any>;
    index: number;
    append?: boolean;
    lastChunk?: boolean;
  }
  
  // ErrorMessage -----------------------------------------------
  export interface ErrorMessage {
    code: number;
    message: string;
    data?: any;
  }
  