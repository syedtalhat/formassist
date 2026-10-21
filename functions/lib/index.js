"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const router_1 = require("./router");
const app = (0, express_1.default)();
// Enable CORS for Chrome Extension origins and localhost
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json({ limit: '2mb' }));
// Mount both under /api and root / for flexible hosting (Cloud Functions / Vercel / local)
app.use('/api', router_1.router);
app.use('/', router_1.router);
// Cloud Functions 2nd Generation export (region asia-south1 per SRS §2.4)
exports.api = (0, https_1.onRequest)({
    region: 'asia-south1',
    cors: true,
    timeoutSeconds: 60,
    memory: '512MiB',
}, app);
// Allow standalone Node execution for quick local testing
if (process.env.STANDALONE === 'true' || require.main === module) {
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
        console.log(`🚀 FormAssist API listening standalone on http://localhost:${PORT}`);
    });
}
exports.default = app;
//# sourceMappingURL=index.js.map