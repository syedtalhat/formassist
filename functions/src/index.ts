import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import cors from 'cors';
import { router } from './router';

const app = express();

// Enable CORS for Chrome Extension origins and localhost
app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));

// Mount both under /api and root / for flexible hosting (Cloud Functions / Vercel / local)
app.use('/api', router);
app.use('/', router);

// Cloud Functions 2nd Generation export (region asia-south1 per SRS §2.4)
export const api = onRequest(
  {
    region: 'asia-south1',
    cors: true,
    timeoutSeconds: 60,
    memory: '512MiB',
  },
  app
);

// Allow standalone Node execution for quick local testing
if (process.env.STANDALONE === 'true' || require.main === module) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`🚀 FormAssist API listening standalone on http://localhost:${PORT}`);
  });
}

export default app;
