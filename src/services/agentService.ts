import { AgentMessage, AgentResponse, PluginExecutionContext } from '../types';
import { GeminiService } from './geminiService';
import { MemoryService } from './memoryService';
import { VectorStore } from './vectorStore';
import { PluginManager } from '../plugins/pluginManager';

export class AgentService {
  private static instance: AgentService;
  private geminiService: GeminiService;
  private memoryService: MemoryService;
  private vectorStore: VectorStore;
  private pluginManager: PluginManager;

  private constructor() {
    this.geminiService = GeminiService.getInstance();
    this.memoryService = MemoryService.getInstance();
    this.vectorStore = VectorStore.getInstance();
    this.pluginManager = PluginManager.getInstance();
  }

  public static getInstance(): AgentService {
    if (!AgentService.instance) {
      AgentService.instance = new AgentService();
    }
    return AgentService.instance;
  }

  /**
   * Process agent message and generate response
   */
  public async processMessage(request: AgentMessage): Promise<AgentResponse> {
    const { message, session_id } = request;
    const timestamp = new Date().toISOString();

    try {
      console.log(`🤖 Processing message for session: ${session_id}`);
      
      // Add user message to memory
      this.memoryService.addMessage(session_id, 'user', message);

      // 1. Retrieve relevant context from vector store
      console.log('🔍 Retrieving relevant context...');
      let contextResults: any[] = [];
      try {
        contextResults = await this.vectorStore.searchSimilar(message, 3);
      } catch (error) {
        console.error('Context retrieval failed:', error);
        // Continue without context if vector search fails
      }
      const contextText = this.formatContextForPrompt(contextResults);

      // 2. Execute relevant plugins
      console.log('🔌 Checking for plugin execution...');
      const pluginContext: PluginExecutionContext = {
        query: message,
        user_message: message,
        session_id
      };
      const pluginResults = await this.pluginManager.executePlugins(pluginContext);
      const pluginText = this.pluginManager.formatPluginResults(pluginResults);

      // 3. Get conversation history
      const conversationHistory = this.memoryService.getRecentMessages(session_id, 4);
      const memoryText = this.memoryService.getConversationSummary(session_id);

      // 4. Generate system prompt
      const systemPrompt = this.generateSystemPrompt(memoryText, contextText, pluginText);

      // 5. Generate response from Gemini
      console.log('🧠 Generating AI response...');
      const aiResponse = await this.geminiService.generateChatCompletion(
        systemPrompt,
        message,
        conversationHistory.slice(0, -1) // Exclude the current message
      );

      // 6. Add AI response to memory
      this.memoryService.addMessage(session_id, 'assistant', aiResponse);

      const response: AgentResponse = {
        reply: aiResponse,
        session_id,
        timestamp,
        plugins_used: pluginResults.map(p => p.plugin_name),
        context_retrieved: contextResults.length > 0
      };

      console.log(`✅ Response generated for session: ${session_id}`);
      return response;

    } catch (error) {
      console.error('Agent processing error:', error);
      
      const errorResponse: AgentResponse = {
        reply: 'I apologize, but I encountered an error while processing your message. Please try again.',
        session_id,
        timestamp,
        plugins_used: [],
        context_retrieved: false
      };

      return errorResponse;
    }
  }

  /**
   * Generate comprehensive system prompt
   */
  private generateSystemPrompt(memoryText: string, contextText: string, pluginText: string): string {
    return `You are an intelligent AI assistant with access to a knowledge base and various tools.

## Core Instructions:
- Provide helpful, accurate, and conversational responses
- Use the provided context and plugin results to enhance your answers
- Maintain a professional yet friendly tone
- If you don't know something, admit it rather than making assumptions
- Be concise but comprehensive in your responses

## Technical Architecture:
- Chat responses and document embeddings powered by Google Gemini
- Real-time plugin execution for weather and math operations
- Session-based memory management with intelligent context injection

## Available Capabilities:
${this.pluginManager.getPluginCapabilities()}

## Conversation Context:
${memoryText}

## Retrieved Knowledge Base Context (via Gemini embeddings):
${contextText}

## Plugin Execution Results:
${pluginText}

## Guidelines:
1. If plugin results are available, incorporate them naturally into your response
2. Use the knowledge base context to provide more detailed and accurate information
3. Reference previous conversation when relevant
4. If asked about weather or math calculations, the plugin results will provide current data
5. Always be helpful and try to fully address the user's question

Please provide a helpful response based on all the available information above.`;
  }

  /**
   * Format context results for prompt inclusion
   */
  private formatContextForPrompt(results: any[]): string {
    if (results.length === 0) {
      return 'No relevant context found in knowledge base.';
    }

    let formatted = 'Relevant information from knowledge base:\\n\\n';
    
    results.forEach((result, index) => {
      const doc = result.document;
      formatted += `Context ${index + 1} (from ${doc.metadata.filename}):`;
      if (doc.metadata.title) {
        formatted += ` "${doc.metadata.title}"`;
      }
      formatted += `\\n${doc.content}\\n\\n`;
    });

    return formatted;
  }

  /**
   * Get agent health status
   */
  public async getHealthStatus(): Promise<{
    status: string;
    services: { [key: string]: boolean };
    documentCount: number;
    pluginStatus: { [key: string]: boolean };
  }> {
    try {
      // Test Gemini connection (for both chat and embeddings)
      const geminiStatus = await this.geminiService.testConnection();
      
      // Test plugins
      const pluginStatus = await this.pluginManager.testPlugins();
      
      // Get document count
      const documentCount = this.vectorStore.getDocumentCount();
      
      const allServicesHealthy = geminiStatus && Object.values(pluginStatus).every(status => status);
      
      return {
        status: allServicesHealthy ? 'healthy' : 'degraded',
        services: {
          gemini: geminiStatus,
          vectorStore: documentCount > 0,
          memory: true // Memory service is always available
        },
        documentCount,
        pluginStatus
      };
    } catch (error) {
      console.error('Health check error:', error);
      return {
        status: 'unhealthy',
        services: {
          gemini: false,
          vectorStore: false,
          memory: false
        },
        documentCount: 0,
        pluginStatus: {}
      };
    }
  }

  /**
   * Get session statistics
   */
  public getSessionStats(sessionId: string): any {
    return this.memoryService.getSessionStats(sessionId);
  }

  /**
   * Clear session memory
   */
  public clearSession(sessionId: string): void {
    this.memoryService.clearSession(sessionId);
  }
}
