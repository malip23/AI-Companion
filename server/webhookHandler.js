import express from 'express';
import { save as saveConversation, findByUserId } from './conversationStore.js';
import { upsert, findByUserId as findTokenByUserId } from './pushTokenStore.js';
import { sendPushNotification } from './notificationSender.js';

const router = express.Router();

/**
 * @param {{ callId: string, userId?: string, transcript: string, summary: string }} report
 */
async function processCallReport(report) {
  try {
    saveConversation({
      callId: report.callId,
      userId: report.userId ?? 'unknown',
      transcript: report.transcript,
      summary: report.summary,
    });

    const token = findTokenByUserId(report.userId ?? 'unknown');
    if (token) {
      await sendPushNotification(token.expoPushToken, {
        title: 'Your companion misses you',
        body: report.summary || 'Tap to continue your conversation',
      });
    }
  } catch (err) {
    console.error('[webhookHandler] processCallReport error:', err);
  }
}

router.post('/vapi-webhook', async (req, res) => {
  const secret = req.headers['x-vapi-secret'];
  if (!secret || secret !== process.env.VAPI_WEBHOOK_SECRET) {
    return res.sendStatus(401);
  }

  const { message } = req.body;

  switch (message.type) {
    case 'call-started':
      console.log('[webhookHandler] Call started:', message.call.id);
      return res.sendStatus(200);

    case 'transcript':
      console.log('[webhookHandler] Transcript chunk:', message.transcript);
      return res.sendStatus(200);

    case 'end-of-call-report': {
      const callId = message.call.id;
      const { transcript, summary } = message.artifact;
      try {
        await processCallReport({ callId, transcript, summary });
      } catch (err) {
        console.error('[webhookHandler] end-of-call-report error:', err);
      }
      return res.sendStatus(200);
    }

    case 'function-call':
      console.log('[webhookHandler] Function called:', message.functionCall.name, message.functionCall.parameters);
      return res.json({ result: 'Function handled' });

    default:
      console.log('[webhookHandler] Unhandled event type:', message.type);
      return res.sendStatus(200);
  }
});

router.post('/register-push-token', async (req, res) => {
  const { token, userId } = req.body;
  try {
    upsert({ userId, expoPushToken: token, platform: req.body.platform ?? 'ios' });
    return res.sendStatus(200);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
