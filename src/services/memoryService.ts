import { SessionMemory, ConversationMessage } from '../types';

export class MemoryService {
  private static instance: MemoryService;
  private sessions: Map<string, SessionMemory> = new Map();
  private readonly MAX_MESSAGES_PER_SESSION = 20; // Keep last 20 messages

  public static getInstance(): MemoryService {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService();
    }
    return MemoryService.instance;
  }

  /**
   * Add a message to session memory
   */
  public addMessage(sessionId: string, role: 'user' | 'assistant', content: string): void {
    const message: ConversationMessage = {
      role,
      content,
      timestamp: new Date().toISOString()
    };

    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        session_id: sessionId,
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    const session = this.sessions.get(sessionId)!;
    session.messages.push(message);
    session.updated_at = new Date().toISOString();

    // Keep only the last N messages to prevent memory bloat
    if (session.messages.length > this.MAX_MESSAGES_PER_SESSION) {
      session.messages = session.messages.slice(-this.MAX_MESSAGES_PER_SESSION);
    }
  }

  /**
   * Get conversation history for a session
   */
  public getSessionHistory(sessionId: string): ConversationMessage[] {
    const session = this.sessions.get(sessionId);
    return session ? session.messages : [];
  }

  /**
   * Get last N messages for context
   */
  public getRecentMessages(sessionId: string, limit: number = 4): ConversationMessage[] {
    const messages = this.getSessionHistory(sessionId);
    return messages.slice(-limit);
  }

  /**
   * Get conversation summary for prompt context
   */
  public getConversationSummary(sessionId: string): string {
    const recentMessages = this.getRecentMessages(sessionId, 4);
    
    if (recentMessages.length === 0) {
      return 'No previous conversation history.';
    }

    const summary = recentMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\\n');
    
    return `Recent conversation context:\\n${summary}`;
  }

  /**
   * Clear session memory
   */
  public clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Get all active sessions
   */
  public getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Get session statistics
   */
  public getSessionStats(sessionId: string): { messageCount: number; createdAt: string; updatedAt: string } | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    return {
      messageCount: session.messages.length,
      createdAt: session.created_at,
      updatedAt: session.updated_at
    };
  }
}
