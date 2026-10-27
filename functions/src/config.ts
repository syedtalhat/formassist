import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Helper to load .env variables if not already in process.env
function loadEnvFile(envPath: string) {
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    } catch {
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
].filter(Boolean) as string[];

let credential: admin.credential.Credential | undefined;
for (const p of possibleServiceAccountPaths) {
  if (fs.existsSync(p)) {
    try {
      const sa = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (sa.project_id && sa.private_key) {
        credential = admin.credential.cert(sa);
        console.log(`[Config] Loaded service account from ${p} (${sa.project_id})`);
        break;
      }
    } catch {
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

export const db = admin.firestore();
try {
  db.settings({ ignoreUndefinedProperties: true });
} catch {
  // Ignore if already initialized
}
export const auth = admin.auth();

// NFR-MAIN.1: Store Gemini models, dimensions, threshold in configuration
export const config = {
  region: 'asia-south1',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
  geminiFallbackModel: process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash-lite',
  geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
  embeddingDimension: 768,
  similarityThreshold: Number(process.env.SIMILARITY_THRESHOLD || 0.65),
  maxFieldsPerRequest: 60, // NFR-SCALE.3
  batchSize: 5,           // NFR-SCALE.3
};
