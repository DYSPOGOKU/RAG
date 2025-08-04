import express from 'express';
import './loadenv'
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { agentRouter } from './routes/agent';
import { errorHandler } from './middleware/errorHandler';
import { VectorStore } from './services/vectorStore';
import { DocumentLoader } from './services/documentLoader';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://your-vercel-app.vercel.app']
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
console.log(process.env.OPENAI_API_KEY); // should not be undefined

// Routes
app.use('/agent', agentRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling
app.use(errorHandler);

// Initialize services and start server
async function startServer() {
  try {
    console.log('🚀 Initializing AI Agent Server...');
    
    // Initialize vector store with documents
    const documentLoader = new DocumentLoader();
    const vectorStore = VectorStore.getInstance();
    
    console.log('📚 Loading documents for RAG...');
    await documentLoader.loadDocumentsFromDirectory('./');
    
    console.log('🎯 Vector store initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`🌟 AI Agent Server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🤖 Agent endpoint: http://localhost:${PORT}/agent/message`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
