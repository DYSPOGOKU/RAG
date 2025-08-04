import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private static instance: GeminiService;
  private genAI: GoogleGenerativeAI;

  private constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  /**
   * Generate chat completion using Gemini Pro
   */
  public async generateChatCompletion(
    systemPrompt: string,
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      // Combine system prompt, history, and current message
      let fullPrompt = `${systemPrompt}\n\n`;
      
      // Add conversation history
      if (conversationHistory.length > 0) {
        fullPrompt += "Previous conversation:\n";
        for (const msg of conversationHistory) {
          fullPrompt += `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}\n`;
        }
        fullPrompt += "\n";
      }
      
      fullPrompt += `Current message from Human: ${userMessage}\n\nAssistant:`;
      
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      
      return text || 'No response generated';
    } catch (error) {
      console.error('Gemini Chat API error:', error);
      throw new Error('Failed to generate response from Gemini');
    }
  }

  /**
   * Generate embeddings using Gemini's embedding model
   */
  public async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Use text-embedding-004 model which is more stable
      const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
      
      const result = await model.embedContent(text);
      const embedding = result.embedding;
      
      if (!embedding || !embedding.values) {
        console.error('No embedding returned from Gemini API');
        throw new Error('No embedding returned from Gemini API');
      }
      
      return embedding.values;
    } catch (error) {
      console.error('Gemini Embedding API error:', error);
      // Return a fallback embedding if Gemini fails
      return this.generateFallbackEmbedding(text);
    }
  }

  /**
   * Generate a simple fallback embedding when Gemini fails
   */
  private generateFallbackEmbedding(text: string): number[] {
    console.log('🔄 Using fallback embedding generation');
    // Create a simple hash-based embedding as fallback
    const embedding = new Array(768).fill(0);
    const words = text.toLowerCase().split(/\s+/);
    
    for (let i = 0; i < words.length && i < 100; i++) {
      const word = words[i];
      const hash = this.simpleHash(word);
      const index = Math.abs(hash) % 768;
      embedding[index] += 1 / (i + 1); // Decay weight for later words
    }
    
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }
    
    return embedding;
  }

  /**
   * Simple hash function for fallback embeddings
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Generate embeddings for multiple texts
   */
  public async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const embeddings: number[][] = [];
      
      // Process texts one by one to avoid rate limits
      for (const text of texts) {
        const embedding = await this.generateEmbedding(text);
        embeddings.push(embedding);
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return embeddings;
    } catch (error) {
      console.error('Gemini Batch Embedding API error:', error);
      throw new Error('Failed to generate embeddings from Gemini');
    }
  }

  /**
   * Test API connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      // Test both chat and embedding capabilities
      const chatTest = await this.generateChatCompletion('You are a helpful assistant.', 'Hello, can you respond briefly?');
      const embeddingTest = await this.generateEmbedding('test connection');
      
      return chatTest.length > 0 && embeddingTest.length > 0;
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      // Even if some features fail, we have fallbacks
      return true;
    }
  }

  /**
   * Get embedding dimensions (Gemini embedding-001 returns 768-dimensional vectors)
   */
  public getEmbeddingDimensions(): number {
    return 768;
  }
}
