"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const auth_1 = require("./middleware/auth");
const rate_limit_1 = require("./middleware/rate-limit");
const analyze_form_1 = require("./routes/analyze-form");
const explain_field_1 = require("./routes/explain-field");
const chat_1 = require("./routes/chat");
const preferences_1 = require("./routes/preferences");
const chat_history_1 = require("./routes/chat-history");
exports.router = (0, express_1.Router)();
// Health check endpoint
exports.router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'formassist-api', timestamp: new Date().toISOString() });
});
// FR-EXTRACT / FR-EXPLAIN / FR-RISK: Analyze Form
// Optional auth allows guest/unauthenticated use (FR-ACC.3)
exports.router.post('/analyze-form', auth_1.optionalAuth, (0, rate_limit_1.rateLimit)(30, 60 * 1000), analyze_form_1.analyzeFormHandler);
// Single field explanation
exports.router.post('/explain-field', auth_1.optionalAuth, (0, rate_limit_1.rateLimit)(60, 60 * 1000), explain_field_1.explainFieldHandler);
// Context-aware chat (FR-CHAT.1 - FR-CHAT.4)
// Optional auth allows guest/unauthenticated use without saving history (FR-ACC.3)
exports.router.post('/chat', auth_1.optionalAuth, (0, rate_limit_1.rateLimit)(20, 60 * 1000), chat_1.chatHandler);
// User preferences (FR-ACC.2)
exports.router.get('/preferences', auth_1.requireAuth, preferences_1.getPreferencesHandler);
exports.router.put('/preferences', auth_1.requireAuth, preferences_1.setPreferencesHandler);
// Delete chat history (FR-CHAT.5, NFR-DATA.3)
exports.router.delete('/chat-history', auth_1.requireAuth, chat_history_1.deleteChatHistoryHandler);
//# sourceMappingURL=router.js.map