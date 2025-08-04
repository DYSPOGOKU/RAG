export interface AgentMessage {
  message: string;
  session_id: string;
}

export interface AgentResponse {
  reply: string;
  session_id: string;
  timestamp: string;
  plugins_used?: string[];
  context_retrieved?: boolean;
}

export interface SessionMemory {
  session_id: string;
  messages: ConversationMessage[];
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Document {
  id: string;
  content: string;
  metadata: {
    filename: string;
    title?: string;
    author?: string;
    source?: string;
    chunk_index: number;
  };
  embedding?: number[];
}

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    filename: string;
    title?: string;
    author?: string;
    source?: string;
    chunk_index: number;
  };
}

export interface SearchResult {
  document: Document;
  similarity: number;
}

export interface PluginResult {
  plugin_name: string;
  result: any;
  success: boolean;
  error?: string;
}

export interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  wind_speed: number;
}

export interface MathResult {
  expression: string;
  result: number;
  success: boolean;
}

export interface PluginExecutionContext {
  query: string;
  user_message: string;
  session_id: string;
}
