import { Document, SearchResult } from '../types';
import { GeminiService } from './geminiService';

export class VectorStore {
  private static instance: VectorStore;
  private documents: Document[] = [];
  private geminiService: GeminiService;

  private constructor() {
    this.geminiService = GeminiService.getInstance();
  }

  public static getInstance(): VectorStore {
    if (!VectorStore.instance) {
      VectorStore.instance = new VectorStore();
    }
    return VectorStore.instance;
  }

  /**
   * Add existing documents (without re-generating embeddings)
   */
  public async addExistingDocuments(documents: Document[]): Promise<void> {
    console.log(`📚 Adding ${documents.length} existing documents to vector store...`);
    this.documents.push(...documents);
    console.log(`✅ Successfully added ${documents.length} existing documents`);
  }

  /**
   * Remove documents by filename
   */
  public removeDocumentsByFilename(filename: string): void {
    const initialCount = this.documents.length;
    this.documents = this.documents.filter(doc => doc.metadata.filename !== filename);
    const removedCount = initialCount - this.documents.length;
    if (removedCount > 0) {
      console.log(`🗑️ Removed ${removedCount} old chunks for ${filename}`);
    }
  }

  /**
   * Add documents to the vector store
   */
  public async addDocuments(documents: Document[]): Promise<void> {
    console.log(`📚 Adding ${documents.length} documents to vector store...`);
    
    for (const doc of documents) {
      try {
        // Generate embedding for the document using Gemini
        const embedding = await this.geminiService.generateEmbedding(doc.content);
        doc.embedding = embedding;
        this.documents.push(doc);
      } catch (error) {
        console.error(`Failed to generate embedding for document ${doc.id}:`, error);
        // Add document without embedding as fallback
        this.documents.push(doc);
      }
    }
    
    console.log(`✅ Successfully added ${documents.length} documents to vector store`);
  }

  /**
   * Search for similar documents using vector similarity
   */
  public async searchSimilar(query: string, topK: number = 3): Promise<SearchResult[]> {
    if (this.documents.length === 0) {
      return [];
    }

    try {
      // Generate embedding for the query using Gemini
      const queryEmbedding = await this.geminiService.generateEmbedding(query);
      
      // Calculate similarity scores
      const results: SearchResult[] = [];
      
      for (const doc of this.documents) {
        if (doc.embedding) {
          const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
          results.push({ document: doc, similarity });
        } else {
          // Fallback to simple text matching if no embedding
          const textSimilarity = this.simpleTextSimilarity(query.toLowerCase(), doc.content.toLowerCase());
          results.push({ document: doc, similarity: textSimilarity });
        }
      }

      // Sort by similarity and return top K
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
        
    } catch (error) {
      console.error('Error during vector search:', error);
      // Fallback to simple text search
      return this.fallbackTextSearch(query, topK);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }

  /**
   * Simple text similarity for fallback
   */
  private simpleTextSimilarity(query: string, text: string): number {
    const queryWords = query.split(/\\s+/);
    const textWords = text.split(/\\s+/);
    
    let matches = 0;
    for (const word of queryWords) {
      if (textWords.some(textWord => textWord.includes(word) || word.includes(textWord))) {
        matches++;
      }
    }
    
    return matches / queryWords.length;
  }

  /**
   * Fallback text search when embeddings fail
   */
  private fallbackTextSearch(query: string, topK: number): SearchResult[] {
    const queryLower = query.toLowerCase();
    const results: SearchResult[] = [];

    for (const doc of this.documents) {
      const similarity = this.simpleTextSimilarity(queryLower, doc.content.toLowerCase());
      results.push({ document: doc, similarity });
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Get all documents
   */
  public getAllDocuments(): Document[] {
    return this.documents;
  }

  /**
   * Get document count
   */
  public getDocumentCount(): number {
    return this.documents.length;
  }

  /**
   * Clear all documents
   */
  public clearDocuments(): void {
    this.documents = [];
  }

  /**
   * Get documents by filename
   */
  public getDocumentsByFilename(filename: string): Document[] {
    return this.documents.filter(doc => doc.metadata.filename === filename);
  }
}
