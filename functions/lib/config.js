"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.auth = exports.db = void 0;
const admin = __importStar(require("firebase-admin"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
// Helper to load .env variables if not already in process.env
function loadEnvFile(envPath) {
    if (fs.existsSync(envPath)) {
        try {
            const content = fs.readFileSync(envPath, 'utf8');
            for (const line of content.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#'))
                    continue;
                const eqIdx = trimmed.indexOf('=');
                if (eqIdx > 0) {
                    const key = trimmed.slice(0, eqIdx).trim();
                    const val = trimmed.slice(eqIdx + 1).trim();
                    if (!process.env[key]) {
                        process.env[key] = val;
                    }
                }
            }
        }
        catch {
            // ignore
        }
    }
}
loadEnvFile(path.resolve(process.cwd(), '.env'));
loadEnvFile(path.resolve(process.cwd(), '../.env'));
loadEnvFile(path.resolve(__dirname, '../../.env'));
// Look for serviceAccountKey.json
const possibleServiceAccountPaths = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.resolve(process.cwd(), 'serviceAccountKey.json'),
    path.resolve(process.cwd(), '../serviceAccountKey.json'),
    path.resolve(__dirname, '../../../serviceAccountKey.json'),
    path.resolve(__dirname, '../../serviceAccountKey.json'),
].filter(Boolean);
let credential;
for (const p of possibleServiceAccountPaths) {
    if (fs.existsSync(p)) {
        try {
            const sa = JSON.parse(fs.readFileSync(p, 'utf8'));
            if (sa.project_id && sa.private_key) {
                credential = admin.credential.cert(sa);
                console.log(`[Config] Loaded service account from ${p} (${sa.project_id})`);
                break;
            }
        }
        catch {
            // ignore
        }
    }
}
// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: credential || admin.credential.applicationDefault(),
        projectId: process.env.GCLOUD_PROJECT || 'formassist-83d6a',
    });
}
exports.db = admin.firestore();
try {
    exports.db.settings({ ignoreUndefinedProperties: true });
}
catch {
    // Ignore if already initialized
}
exports.auth = admin.auth();
// NFR-MAIN.1: Store Gemini models, dimensions, threshold in configuration
exports.config = {
    region: 'asia-south1',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    geminiFallbackModel: process.env.GEMINI_FALLBACK_MODEL || 'gemini-1.5-flash',
    geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
    embeddingDimension: 768,
    similarityThreshold: Number(process.env.SIMILARITY_THRESHOLD || 0.65),
    maxFieldsPerRequest: 60, // NFR-SCALE.3
    batchSize: 5, // NFR-SCALE.3
};
//# sourceMappingURL=config.js.map