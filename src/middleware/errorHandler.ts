import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);

  // Default error
  let status = 500;
  let message = 'Internal Server Error';

  // OpenAI API errors
  if (error.message.includes('OpenAI')) {
    status = 503;
    message = 'AI service temporarily unavailable';
  }

  // Validation errors
  if (error.message.includes('validation')) {
    status = 400;
    message = 'Invalid request data';
  }

  // Rate limiting errors
  if (error.message.includes('rate limit')) {
    status = 429;
    message = 'Too many requests';
  }

  res.status(status).json({
    error: {
      message,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
};

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path}`);
  next();
};

export const validateAgentMessage = (req: Request, res: Response, next: NextFunction): void => {
  const { message, session_id } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({
      error: {
        message: 'Message is required and must be a string',
        timestamp: new Date().toISOString()
      }
    });
    return;
  }

  if (!session_id || typeof session_id !== 'string') {
    res.status(400).json({
      error: {
        message: 'Session ID is required and must be a string',
        timestamp: new Date().toISOString()
      }
    });
    return;
  }

  if (message.length > 2000) {
    res.status(400).json({
      error: {
        message: 'Message too long (max 2000 characters)',
        timestamp: new Date().toISOString()
      }
    });
    return;
  }

  next();
};
