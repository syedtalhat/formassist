import { Response } from 'express';
import * as admin from 'firebase-admin';
import { db } from '../config';
import { AuthenticatedRequest } from '../middleware/auth';
import { ChatRequest, ChatResponse } from '../types';
import { generateChatReplyWithGemini } from '../services/gemini';

/**
 * POST /api/chat
 * Context-aware chat endpoint (FR-CHAT.1 - FR-CHAT.4).
 * Strictly requires verified Firebase ID token (NFR-SEC.5).
 * Persists session and messages in Firestore under users/{uid}/chatSessions.
 */
export async function chatHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const uid = req.user?.uid;
    const {
      session_id,
      form_id,
      focused_field_key,
      completed_field_keys = [],
      language = 'en',
      message,
    } = req.body as ChatRequest;

    if (!message || !message.trim()) {
      res.status(400).json({ error: 'message is required.' });
      return;
    }

    const formId = form_id || 'form_active';
    let sessionId = session_id || `session_${Date.now()}`;
    const recentTurns: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    let messagesCol: admin.firestore.CollectionReference | null = null;

    // 1. If user is authenticated, manage chat session and load history
    if (uid) {
      const sessionsCol = db.collection(`users/${uid}/chatSessions`);
      let sessionRef: admin.firestore.DocumentReference;

      if (session_id) {
        sessionRef = sessionsCol.doc(session_id);
        const snap = await sessionRef.get();
        if (!snap.exists) {
          await sessionRef.set({
            formId,
            startedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          await sessionRef.update({
            lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      } else {
        sessionRef = sessionsCol.doc();
        sessionId = sessionRef.id;
        await sessionRef.set({
          formId,
          startedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // 2. Fetch last 6 message turns (FR-CHAT.3, NFR-SCALE.2)
      messagesCol = sessionRef.collection('messages');
      const recentMessagesSnap = await messagesCol
        .orderBy('createdAt', 'desc')
        .limit(6)
        .get();

      recentMessagesSnap.docs.reverse().forEach((doc) => {
        const data = doc.data();
        if (data.role && data.content) {
          recentTurns.push({ role: data.role, content: data.content });
        }
      });
    }

    // 3. Resolve context for focused field (if any)
    let focusedFieldInfo: { label: string; explanation?: string } | undefined;
    if (focused_field_key && formId) {
      try {
        const fieldDoc = await db.doc(`forms/${formId}/fields/${focused_field_key}`).get();
        if (fieldDoc.exists) {
          const fieldData = fieldDoc.data();
          const expDoc = await db
            .doc(`forms/${formId}/fields/${focused_field_key}/explanations/${language}`)
            .get();
          const expData = expDoc.exists ? expDoc.data() : null;

          focusedFieldInfo = {
            label: fieldData?.label || focused_field_key,
            explanation: expData?.summary || expData?.text || undefined,
          };
        }
      } catch (fErr) {
        console.warn('Could not fetch focused field context:', fErr);
      }
    }
    // 4. Look up form title
    let formTitle: string | undefined;
    try {
      const formDoc = await db.doc(`forms/${formId}`).get();
      if (formDoc.exists) {
        formTitle = formDoc.data()?.title;
      }
    } catch {}

    // 5. Generate assistant reply with Gemini
    const replyText = await generateChatReplyWithGemini({
      formTitle,
      focusedField: focusedFieldInfo,
      completedFieldKeys: completed_field_keys,
      recentMessages: recentTurns,
      userMessage: message.trim(),
      language,
    });

    // 6. Persist user message and assistant reply if user is signed in (FR-ACC.3)
    if (messagesCol) {
      try {
        const batch = db.batch();
        const userMsgRef = messagesCol.doc();
        batch.set(userMsgRef, {
          role: 'user',
          content: message.trim(),
          focusedFieldKey: focused_field_key || null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const assistantMsgRef = messagesCol.doc();
        batch.set(assistantMsgRef, {
          role: 'assistant',
          content: replyText,
          focusedFieldKey: focused_field_key || null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await batch.commit();
      } catch (saveErr) {
        console.warn('Failed to save chat message history:', saveErr);
      }
    }

    const response: ChatResponse = {
      reply: replyText,
      session_id: sessionId,
    };

    res.status(200).json(response);
  } catch (err: any) {
    console.error('chatHandler error:', err);
    res.status(500).json({
      error: 'Failed to process chat message.',
      details: err.message,
    });
  }
}
