import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });
import express from 'express';
import webhookRouter from './webhookHandler.js';
import { findByUserId } from './conversationStore.js';

if (!process.env.VAPI_WEBHOOK_SECRET) {
  console.error('[server] Missing required environment variable: VAPI_WEBHOOK_SECRET');
  process.exit(1);
}

const app = express();
app.use(express.json());

app.use('/', webhookRouter);

app.get('/conversations/:userId', (req, res) => {
  res.json(findByUserId(req.params.userId));
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
