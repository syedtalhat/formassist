import * as crypto from 'crypto';
import * as admin from 'firebase-admin';
import { db } from '../config';
import {
  ExtractedFieldInput,
  FieldExplanation,
  SupportedLanguage,
  RiskTag,
} from '../types';
import { generateExplanationWithGemini } from './gemini';
import { searchSourceDocuments } from './vector-search';

/**
 * NFR-DATA.2: Deterministic form ID generation from domain and URL pattern
 */
export function computeFormId(pageUrl: string): string {
  try {
    const parsed = new URL(pageUrl);
    // Strip query parameters and hashes for stable form pattern
    const pattern = `${parsed.hostname}${parsed.pathname.replace(/\/$/, '')}`;
    const hash = crypto.createHash('sha256').update(pattern.toLowerCase()).digest('hex');
    return `form_${hash.substring(0, 16)}`;
  } catch {
    const hash = crypto.createHash('sha256').update(pageUrl.toLowerCase()).digest('hex');
    return `form_${hash.substring(0, 16)}`;
  }
}

/**
 * NFR-DATA.2: Deterministic field key generation
 * Hash of (normalised label + input type + name)
 */
export function computeFieldKey(field: ExtractedFieldInput): string {
  const normLabel = (field.label || '').trim().toLowerCase();
  const normType = (field.inputType || 'text').trim().toLowerCase();
  const normName = (field.name || '').trim().toLowerCase();

  const keySeed = `${normLabel}:${normType}:${normName}`;
  const hash = crypto.createHash('sha256').update(keySeed).digest('hex');
  return `fld_${hash.substring(0, 16)}`;
}

/**
 * Classifies field risk tag per FR-RISK.4: 'required' | 'optional' | 'unusual'
 */
export function determineRiskTag(field: ExtractedFieldInput, isUnusual: boolean): RiskTag {
  if (isUnusual) return 'unusual';
  return field.isRequired ? 'required' : 'optional';
}

/**
 * FR-EXPLAIN.1 - FR-EXPLAIN.5 & FR-CACHE.1:
 * Check Firestore cache for field explanation; on miss, retrieve official grounding via vector search
 * and generate structured explanation via Gemini, then cache to Firestore.
 */
export async function getOrGenerateExplanation(
  formId: string,
  field: ExtractedFieldInput,
  language: SupportedLanguage
): Promise<{ explanation: FieldExplanation; fieldKey: string }> {
  const fieldKey = computeFieldKey(field);
  const explanationRef = db.doc(`forms/${formId}/fields/${fieldKey}/explanations/${language}`);

  // 1. Check cache (FR-EXPLAIN.1, FR-CACHE.1)
  try {
    const cachedSnap = await explanationRef.get();
    if (cachedSnap.exists) {
      const data = cachedSnap.data() as FieldExplanation;
      return { explanation: data, fieldKey };
    }
  } catch (err: any) {
    console.warn(`Cache read error for field ${fieldKey}:`, err.message);
  }

  // 2. Vector search for official grounding documents (FR-EXPLAIN.2)
  const officialDoc = await searchSourceDocuments(formId, `${field.label} ${field.helpText || ''}`);

  // 3. Generate structured explanation with Gemini (FR-EXPLAIN.4)
  const explanation = await generateExplanationWithGemini(field, language, officialDoc || undefined);

  // 4. Cache to Firestore (FR-EXPLAIN.5, FR-CACHE.1)
  try {
    const batch = db.batch();

    // Cache explanation document
    batch.set(
      explanationRef,
      {
        ...explanation,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Update parent field record (Figure 3 data model)
    const fieldRef = db.doc(`forms/${formId}/fields/${fieldKey}`);
    batch.set(
      fieldRef,
      {
        label: field.label,
        inputType: field.inputType,
        isRequired: field.isRequired,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await batch.commit();
  } catch (cacheErr: any) {
    console.warn(`Failed to persist explanation cache for field ${fieldKey}:`, cacheErr.message);
  }

  return { explanation, fieldKey };
}

/**
 * Ensure form document metadata exists
 */
export async function ensureFormDocument(
  formId: string,
  pageUrl: string,
  formTitle?: string
): Promise<void> {
  try {
    const parsed = new URL(pageUrl);
    const formRef = db.doc(`forms/${formId}`);
    await formRef.set(
      {
        domain: parsed.hostname,
        pageUrlPattern: `${parsed.hostname}${parsed.pathname}`,
        title: formTitle || parsed.hostname,
        lastIndexedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err: any) {
    console.warn(`Failed to update form document ${formId}:`, err.message);
  }
}
