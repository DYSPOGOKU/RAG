import { Router, Request, Response } from 'express';
import { AgentService } from '../services/agentService';
import { DocumentLoader } from '../services/documentLoader';
import { PersistentVectorStore } from '../services/persistentVectorStore';
import { validateAgentMessage, requestLogger } from '../middleware/errorHandler';
import { AgentMessage } from '../types';

export const agentRouter = Router();
const agentService = AgentService.getInstance();

// Apply middleware
agentRouter.use(requestLogger);

/**
 * POST /agent/message
 * Main endpoint for agent communication
 */
agentRouter.post('/message', validateAgentMessage, async (req: Request, res: Response) => {
  try {
    const agentMessage: AgentMessage = {
      message: req.body.message,
      session_id: req.body.session_id
    };

    const response = await agentService.processMessage(agentMessage);
    
    res.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('Agent message error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to process message',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * GET /agent/health
 * Health check endpoint with detailed status
 */
agentRouter.get('/health', async (req: Request, res: Response) => {
  try {
    const healthStatus = await agentService.getHealthStatus();
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 206 : 503;
    
    res.status(statusCode).json({
      success: true,
      data: healthStatus
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      success: false,
      error: {
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * GET /agent/session/:sessionId/stats
 * Get session statistics
 */
agentRouter.get('/session/:sessionId/stats', (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId;
    const stats = agentService.getSessionStats(sessionId);
    
    if (!stats) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Session not found',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }
    
    res.json({
      success: true,
      data: {
        session_id: sessionId,
        ...stats
      }
    });
    
  } catch (error) {
    console.error('Session stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get session stats',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * DELETE /agent/session/:sessionId
 * Clear session memory
 */
agentRouter.delete('/session/:sessionId', (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId;
    agentService.clearSession(sessionId);
    
    res.json({
      success: true,
      message: `Session ${sessionId} cleared successfully`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Clear session error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to clear session',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * POST /agent/rebuild-vector-store
 * Force rebuild vector store cache
 */
agentRouter.post('/rebuild-vector-store', async (req: Request, res: Response) => {
  try {
    console.log('🔄 Rebuilding vector store cache...');
    const documentLoader = new DocumentLoader();
    await documentLoader.forceRebuild('./');
    
    res.json({
      success: true,
      message: 'Vector store rebuilt successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Vector store rebuild error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to rebuild vector store',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * GET /agent/vector-store-info
 * Get vector store information
 */
agentRouter.get('/vector-store-info', async (req: Request, res: Response) => {
  try {
    const info = await PersistentVectorStore.getVectorStoreInfo();
    
    res.json({
      success: true,
      data: info
    });
    
  } catch (error) {
    console.error('Vector store info error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get vector store info',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * GET /agent/capabilities
 * Get agent capabilities and available plugins
 */
agentRouter.get('/capabilities', (req: Request, res: Response) => {
  try {
    const capabilities = {
      features: [
        'Conversational AI with memory',
        'Retrieval-Augmented Generation (RAG)',
        'Plugin system for weather and math',
        'Session-based conversation history'
      ],
      plugins: [
        {
          name: 'weather',
          description: 'Provides current weather information for any location',
          triggers: ['weather', 'temperature', 'forecast', 'climate']
        },
        {
          name: 'math',
          description: 'Performs mathematical calculations and evaluations',
          triggers: ['calculate', 'math', 'solve', 'equation', '+', '-', '*', '/']
        }
      ],
      endpoints: [
        'POST /agent/message - Send message to agent',
        'GET /agent/health - Check system health',
        'GET /agent/session/:id/stats - Get session statistics',
        'DELETE /agent/session/:id - Clear session memory',
        'POST /agent/rebuild-vector-store - Force rebuild vector store cache',
        'GET /agent/vector-store-info - Get vector store information',
        'GET /agent/capabilities - Get this information'
      ]
    };
    
    res.json({
      success: true,
      data: capabilities
    });
    
  } catch (error) {
    console.error('Capabilities error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get capabilities',
        timestamp: new Date().toISOString()
      }
    });
  }
});
