import * as fs from 'fs';
import * as path from 'path';
import { Document, DocumentChunk } from '../types';
import { VectorStore } from './vectorStore';
import { PersistentVectorStore, DocumentMetadata } from './persistentVectorStore';
import { v4 as uuidv4 } from 'uuid';

export class DocumentLoader {
  private vectorStore: VectorStore;
  private readonly CHUNK_SIZE = 1000; // Characters per chunk
  private readonly CHUNK_OVERLAP = 200; // Character overlap between chunks
  private documentMetadata: { [filename: string]: DocumentMetadata } = {};

  constructor() {
    this.vectorStore = VectorStore.getInstance();
  }

  /**
   * Load all markdown files from a directory with intelligent caching
   */
  public async loadDocumentsFromDirectory(directoryPath: string): Promise<void> {
    try {
      console.log('📂 Checking for existing vector store...');
      
      // Try to load existing vector store
      const existingStore = await PersistentVectorStore.loadVectorStore();
      
      if (existingStore) {
        // Check which files need processing
        const fileStatus = PersistentVectorStore.getFilesToProcess(directoryPath, existingStore.metadata);
        
        console.log(`� File analysis:
  - New files: ${fileStatus.newFiles.length}
  - Changed files: ${fileStatus.changedFiles.length}
  - Unchanged files: ${fileStatus.unchangedFiles.length}`);
        
        // Load existing documents first
        if (fileStatus.unchangedFiles.length > 0) {
          const unchangedDocs = existingStore.documents.filter(doc => 
            fileStatus.unchangedFiles.some(filePath => 
              path.basename(filePath) === doc.metadata.filename
            )
          );
          await this.vectorStore.addExistingDocuments(unchangedDocs);
          this.documentMetadata = { ...existingStore.metadata };
        }
        
        // Process only new and changed files
        const filesToProcess = [...fileStatus.newFiles, ...fileStatus.changedFiles];
        
        if (filesToProcess.length > 0) {
          console.log(`� Processing ${filesToProcess.length} new/changed files...`);
          await this.processFiles(filesToProcess);
        } else {
          console.log('✅ All files are up to date, no processing needed');
        }
      } else {
        // No existing store, process all files
        const files = fs.readdirSync(directoryPath);
        const markdownFiles = files.filter(file => file.endsWith('.md'));
        const filePaths = markdownFiles.map(file => path.join(directoryPath, file));
        
        console.log(`📂 Found ${markdownFiles.length} markdown files to process (fresh start)`);
        await this.processFiles(filePaths);
      }
      
      // Save the updated vector store
      const allDocuments = this.vectorStore.getAllDocuments();
      await PersistentVectorStore.saveVectorStore(allDocuments, this.documentMetadata);
      
      console.log(`✅ Vector store ready with ${allDocuments.length} document chunks`);
      
    } catch (error) {
      console.error('Error loading documents from directory:', error);
      throw error;
    }
  }

  /**
   * Process a list of files
   */
  private async processFiles(filePaths: string[]): Promise<void> {
    const allDocuments: Document[] = [];
    
    for (const filePath of filePaths) {
      const filename = path.basename(filePath);
      console.log(`📄 Processing: ${filename}`);
      
      // Remove old documents for this file if they exist
      this.vectorStore.removeDocumentsByFilename(filename);
      
      const documents = await this.loadDocument(filePath);
      allDocuments.push(...documents);
      
      // Update metadata
      this.documentMetadata[filename] = PersistentVectorStore.createFileMetadata(filePath, documents.length);
    }
    
    if (allDocuments.length > 0) {
      await this.vectorStore.addDocuments(allDocuments);
    }
  }

  /**
   * Load and chunk a single document
   */
  public async loadDocument(filePath: string): Promise<Document[]> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const filename = path.basename(filePath);
      
      // Extract metadata from content
      const metadata = this.extractMetadata(content, filename);
      
      // Split content into chunks
      const chunks = this.chunkText(content);
      
      // Create document objects
      const documents: Document[] = chunks.map((chunk, index) => ({
        id: uuidv4(),
        content: chunk,
        metadata: {
          ...metadata,
          filename,
          chunk_index: index
        }
      }));
      
      return documents;
      
    } catch (error) {
      console.error(`Error loading document ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Extract metadata from markdown content
   */
  private extractMetadata(content: string, filename: string): Partial<Document['metadata']> {
    const metadata: Partial<Document['metadata']> = {};
    
    // Extract title (first # heading)
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }
    
    // Extract author
    const authorMatch = content.match(/\\*\\*Author:\\*\\*\s*(.+)$/m);
    if (authorMatch) {
      metadata.author = authorMatch[1].trim();
    }
    
    // Extract source
    const sourceMatch = content.match(/\*\*Source:\*\*\s*\[([^\]]+)\]\(([^)]+)\)/);
    if (sourceMatch) {
      metadata.source = sourceMatch[2]; // URL
    }
    
    return metadata;
  }

  /**
   * Split text into overlapping chunks
   */
  private chunkText(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      let end = start + this.CHUNK_SIZE;
      
      // If we're not at the end, try to break at a natural boundary
      if (end < text.length) {
        // Look for the last sentence boundary in the chunk
        const lastSentence = text.lastIndexOf('.', end);
        const lastNewline = text.lastIndexOf('\\n\\n', end);
        const lastParagraph = Math.max(lastSentence, lastNewline);
        
        if (lastParagraph > start + this.CHUNK_SIZE / 2) {
          end = lastParagraph + 1;
        }
      }
      
      const chunk = text.slice(start, end).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }
      
      // Move start position with overlap
      start = Math.max(start + this.CHUNK_SIZE - this.CHUNK_OVERLAP, end);
    }
    
    return chunks;
  }

  /**
   * Force rebuild of vector store (ignores cache)
   */
  public async forceRebuild(directoryPath: string): Promise<void> {
    console.log('🔄 Force rebuilding vector store...');
    
    // Clear existing store
    await PersistentVectorStore.clearVectorStore();
    this.vectorStore.clearDocuments();
    this.documentMetadata = {};
    
    // Process all files
    const files = fs.readdirSync(directoryPath);
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    const filePaths = markdownFiles.map(file => path.join(directoryPath, file));
    
    console.log(`📂 Processing ${markdownFiles.length} files from scratch...`);
    await this.processFiles(filePaths);
    
    // Save the new vector store
    const allDocuments = this.vectorStore.getAllDocuments();
    await PersistentVectorStore.saveVectorStore(allDocuments, this.documentMetadata);
    
    console.log(`✅ Force rebuild complete with ${allDocuments.length} document chunks`);
  }

  /**
   * Get document statistics
   */
  public getLoadedDocumentStats(): { 
    totalDocuments: number; 
    totalChunks: number; 
    fileNames: string[] 
  } {
    const documents = this.vectorStore.getAllDocuments();
    const fileNames = [...new Set(documents.map(doc => doc.metadata.filename))];
    
    return {
      totalDocuments: fileNames.length,
      totalChunks: documents.length,
      fileNames
    };
  }
}
