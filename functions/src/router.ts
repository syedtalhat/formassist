import { Router } from 'express';
import { requireAuth, optionalAuth } from './middleware/auth';
import { rateLimit } from './middleware/rate-limit';
import { analyzeFormHandler } from './routes/analyze-form';
import { explainFieldHandler } from './routes/explain-field';
import { chatHandler } from './routes/chat';
import { getPreferencesHandler, setPreferencesHandler } from './routes/preferences';
import { deleteChatHistoryHandler } from './routes/chat-history';

export const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'formassist-api', timestamp: new Date().toISOString() });
});

// FR-EXTRACT / FR-EXPLAIN / FR-RISK: Analyze Form
// Optional auth allows guest/unauthenticated use (FR-ACC.3)
router.post('/analyze-form', optionalAuth, rateLimit(30, 60 * 1000), analyzeFormHandler);

// Single field explanation
router.post('/explain-field', optionalAuth, rateLimit(60, 60 * 1000), explainFieldHandler);

// Context-aware chat (FR-CHAT.1 - FR-CHAT.4)
// Optional auth allows guest/unauthenticated use without saving history (FR-ACC.3)
router.post('/chat', optionalAuth, rateLimit(20, 60 * 1000), chatHandler);

// User preferences (FR-ACC.2)
router.get('/preferences', requireAuth, getPreferencesHandler);
router.put('/preferences', requireAuth, setPreferencesHandler);

// Delete chat history (FR-CHAT.5, NFR-DATA.3)
router.delete('/chat-history', requireAuth, deleteChatHistoryHandler);
