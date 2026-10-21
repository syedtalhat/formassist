import { Response } from 'express';
import * as admin from 'firebase-admin';
import { db } from '../config';
import { AuthenticatedRequest } from '../middleware/auth';
import { SupportedLanguage } from '../types';

const ALLOWED_LANGUAGES: SupportedLanguage[] = ['en', 'hi', 'mr'];

/**
 * GET /api/preferences
 * FR-ACC.2: Retrieve saved user preferences from users/{uid}.
 */
export async function getPreferencesHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      return;
    }

    const userDoc = await db.doc(`users/${uid}`).get();
    if (!userDoc.exists) {
      res.status(200).json({ default_language: 'en' });
      return;
    }

    const data = userDoc.data();
    res.status(200).json({
      default_language: data?.defaultLanguage || 'en',
    });
  } catch (err: any) {
    console.error('getPreferencesHandler error:', err);
    res.status(500).json({ error: 'Failed to retrieve preferences.', details: err.message });
  }
}

/**
 * PUT /api/preferences
 * FR-ACC.2 & NFR-SEC.3: Update defaultLanguage in users/{uid}.
 * Validates language is strictly one of 'en', 'hi', 'mr'.
 */
export async function setPreferencesHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      return;
    }

    const { default_language } = req.body;
    if (!default_language || !ALLOWED_LANGUAGES.includes(default_language)) {
      res.status(400).json({
        error: `Invalid default_language. Must be one of: ${ALLOWED_LANGUAGES.join(', ')}`,
      });
      return;
    }

    const userRef = db.doc(`users/${uid}`);
    await userRef.set(
      {
        defaultLanguage: default_language,
        email: req.user?.email || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.status(200).json({ default_language });
  } catch (err: any) {
    console.error('setPreferencesHandler error:', err);
    res.status(500).json({ error: 'Failed to update preferences.', details: err.message });
  }
}
