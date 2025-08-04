import OpenAI from 'openai';

export class OpenAIService {
  private static instance: OpenAIService;
  private openai: OpenAI;

  private constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  /**
   * Generate chat completion with GPT-3.5-turbo (more widely available)
   */
  public async generateChatCompletion(
    systemPrompt: string,
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<string> {
    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(msg => ({ role: msg.role, content: msg.content }) as OpenAI.Chat.Completions.ChatCompletionMessageParam),
        { role: 'user', content: userMessage }
      ];

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      });

      return completion.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate response from OpenAI');
    }
  }

  /**
   * Generate embeddings for text
   */
  public async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('OpenAI Embedding API error:', error);
      throw new Error('Failed to generate embedding from OpenAI');
    }
  }

  /**
   * Generate embeddings for multiple texts
   */
  public async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: texts,
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('OpenAI Batch Embedding API error:', error);
      throw new Error('Failed to generate embeddings from OpenAI');
    }
  }

  /**
   * Test API connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      await this.generateEmbedding('test');
      return true;
    } catch (error) {
      return false;
    }
  }
}
