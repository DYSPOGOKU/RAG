import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Document } from '../types';

export interface DocumentMetadata {
  filename: string;
  fileHash: string;
  lastModified: number;
  chunkCount: number;
  processedAt: string;
}

export interface VectorStoreData {
  documents: Document[];
  metadata: { [filename: string]: DocumentMetadata };
  version: string;
  createdAt: string;
  lastUpdated: string;
}

export class PersistentVectorStore {
  private static readonly STORE_FILE = './vector_store.json';
  private static readonly VERSION = '1.0.0';

  /**
   * Save vector store to disk
   */
  public static async saveVectorStore(documents: Document[], documentMetadata: { [filename: string]: DocumentMetadata }): Promise<void> {
    const storeData: VectorStoreData = {
      documents,
      metadata: documentMetadata,
      version: this.VERSION,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    try {
      await fs.promises.writeFile(this.STORE_FILE, JSON.stringify(storeData, null, 2));
      console.log(`💾 Vector store saved to ${this.STORE_FILE}`);
    } catch (error) {
      console.error('Failed to save vector store:', error);
    }
  }

  /**
   * Load vector store from disk
   */
  public static async loadVectorStore(): Promise<VectorStoreData | null> {
    try {
      if (!fs.existsSync(this.STORE_FILE)) {
        console.log('📂 No existing vector store found');
        return null;
      }

      const data = await fs.promises.readFile(this.STORE_FILE, 'utf-8');
      const storeData: VectorStoreData = JSON.parse(data);
      
      // Version compatibility check
      if (storeData.version !== this.VERSION) {
        console.log(`🔄 Vector store version mismatch (${storeData.version} vs ${this.VERSION}), rebuilding...`);
        return null;
      }

      console.log(`📚 Loaded existing vector store with ${storeData.documents.length} document chunks`);
      return storeData;
    } catch (error) {
      console.error('Failed to load vector store:', error);
      return null;
    }
  }

  /**
   * Get file hash for change detection
   */
  public static getFileHash(filePath: string): string {
    try {
      const content = fs.readFileSync(filePath);
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
      console.error(`Failed to hash file ${filePath}:`, error);
      return '';
    }
  }

  /**
   * Check if file has changed since last processing
   */
  public static hasFileChanged(filePath: string, metadata: DocumentMetadata): boolean {
    try {
      const stats = fs.statSync(filePath);
      const currentHash = this.getFileHash(filePath);
      
      return (
        currentHash !== metadata.fileHash ||
        stats.mtimeMs !== metadata.lastModified
      );
    } catch (error) {
      // If we can't check, assume it changed
      return true;
    }
  }

  /**
   * Get files that need processing
   */
  public static getFilesToProcess(directoryPath: string, existingMetadata: { [filename: string]: DocumentMetadata }): {
    newFiles: string[];
    changedFiles: string[];
    unchangedFiles: string[];
  } {
    const files = fs.readdirSync(directoryPath);
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    
    const newFiles: string[] = [];
    const changedFiles: string[] = [];
    const unchangedFiles: string[] = [];

    for (const filename of markdownFiles) {
      const filePath = path.join(directoryPath, filename);
      
      if (!existingMetadata[filename]) {
        newFiles.push(filePath);
      } else if (this.hasFileChanged(filePath, existingMetadata[filename])) {
        changedFiles.push(filePath);
      } else {
        unchangedFiles.push(filePath);
      }
    }

    return { newFiles, changedFiles, unchangedFiles };
  }

  /**
   * Create metadata for a file
   */
  public static createFileMetadata(filePath: string, chunkCount: number): DocumentMetadata {
    const stats = fs.statSync(filePath);
    const filename = path.basename(filePath);
    
    return {
      filename,
      fileHash: this.getFileHash(filePath),
      lastModified: stats.mtimeMs,
      chunkCount,
      processedAt: new Date().toISOString()
    };
  }

  /**
   * Clean up vector store file
   */
  public static async clearVectorStore(): Promise<void> {
    try {
      if (fs.existsSync(this.STORE_FILE)) {
        await fs.promises.unlink(this.STORE_FILE);
        console.log('🗑️ Vector store cleared');
      }
    } catch (error) {
      console.error('Failed to clear vector store:', error);
    }
  }

  /**
   * Get vector store info
   */
  public static async getVectorStoreInfo(): Promise<{
    exists: boolean;
    size?: number;
    documentCount?: number;
    lastUpdated?: string;
  }> {
    try {
      if (!fs.existsSync(this.STORE_FILE)) {
        return { exists: false };
      }

      const stats = fs.statSync(this.STORE_FILE);
      const data = await this.loadVectorStore();
      
      return {
        exists: true,
        size: stats.size,
        documentCount: data?.documents.length || 0,
        lastUpdated: data?.lastUpdated
      };
    } catch (error) {
      return { exists: false };
    }
  }
}
