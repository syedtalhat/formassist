import { Response } from 'express';
import * as admin from 'firebase-admin';
import { db, config } from '../config';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  AnalyzeFormRequest,
  AnalyzeFormResponse,
  AnalyzedField,
  RiskFlag,
  ExtractedFieldInput,
} from '../types';
import {
  computeFormId,
  ensureFormDocument,
  getOrGenerateExplanation,
  determineRiskTag,
} from '../services/explanation';

/**
 * POST /api/analyze-form
 * Receives form structure (strictly zero-knowledge on user input values per FR-REDACT.2).
 * Batches explanation lookups/generations, evaluates risk flags, caches results, and returns enriched fields.
 */
export async function analyzeFormHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const body = req.body as any;

    if (!body || (!body.page_url && !body.pageUrl) || !Array.isArray(body.fields)) {
      res.status(400).json({ error: 'Invalid payload: page_url (or pageUrl) and fields array are required.' });
      return;
    }

    const page_url = body.page_url || body.pageUrl;
    const form_action = body.form_action || body.formAction || '';
    const form_title = body.form_title || body.formTitle;
    const language = (body.language || 'en') as 'en' | 'hi' | 'mr';
    const rawFields = body.fields as any[];

    // Map fields so both id and key, isRequired and required are handled
    const normalizedFields: ExtractedFieldInput[] = rawFields.map((f: any) => ({
      id: f.id || f.key,
      key: f.key || f.id || `fld_${Math.random().toString(36).substring(2, 8)}`,
      name: f.name || '',
      label: f.label || 'Field',
      inputType: f.inputType || 'text',
      isRequired: Boolean(f.isRequired ?? f.required),
      placeholder: f.placeholder,
      helpText: f.helpText,
      options: f.options,
      rect: f.rect,
      hasValue: f.hasValue,
    }));

    // NFR-SCALE.3: Bound input size to prevent quota exhaustion
    const fieldsToProcess = normalizedFields.slice(0, config.maxFieldsPerRequest);
    const formId = computeFormId(page_url);

    // Upsert parent form document
    await ensureFormDocument(formId, page_url, form_title);

    // 1. Evaluate risk flags (FR-RISK.1 - FR-RISK.5)
    const riskFlags: RiskFlag[] = [];
    try {
      const pageUrlObj = new URL(page_url);
      const isHttps = pageUrlObj.protocol === 'https:';

      // FR-RISK.2: Insecure HTTP
      if (!isHttps && pageUrlObj.hostname !== 'localhost' && pageUrlObj.hostname !== '127.0.0.1') {
        riskFlags.push({
          flagType: 'insecure_http',
          severity: 'high',
          descriptionKey: 'risk_insecure_connection',
          message: 'This form is transmitted over an unencrypted connection (HTTP). Never enter passwords or personal IDs.',
        });
      }

      // FR-RISK.1: Cross-domain action
      if (form_action && form_action.startsWith('http')) {
        const actionUrlObj = new URL(form_action);
        if (actionUrlObj.hostname !== pageUrlObj.hostname) {
          riskFlags.push({
            flagType: 'cross_domain_submission',
            severity: 'medium',
            descriptionKey: 'risk_cross_domain',
            message: `This form submits data to a different website (${actionUrlObj.hostname}) than the one you are viewing.`,
          });
        }
      }

      // FR-RISK.3: Sensitive credentials on unexpected domains
      const bankingKeywords = ['bank', 'sbi', 'hdfc', 'icici', 'axis', 'rbi', 'kotak', 'paytm', 'npci'];
      const isLikelyBank = bankingKeywords.some((b) => pageUrlObj.hostname.includes(b));

      for (const field of fieldsToProcess) {
        const text = `${field.label} ${field.name} ${field.placeholder || ''}`.toLowerCase();
        if (/\b(otp|one time password|cvv|mpin|pin|atm pin)\b/i.test(text) && !isLikelyBank) {
          riskFlags.push({
            fieldKey: field.key,
            flagType: 'unusual_otp_request',
            severity: 'high',
            descriptionKey: 'risk_unusual_otp',
            message: `This form asks for an OTP or PIN, which is unusual for this domain (${pageUrlObj.hostname}).`,
          });
        }
      }
    } catch (riskErr) {
      console.warn('Risk evaluation warning:', riskErr);
    }

    // Persist risk flags in subcollection (FR-RISK.5)
    if (riskFlags.length > 0) {
      try {
        const batch = db.batch();
        for (const flag of riskFlags) {
          const flagRef = db.collection(`forms/${formId}/riskFlags`).doc();
          batch.set(flagRef, {
            ...flag,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
        await batch.commit();
      } catch (flagSaveErr) {
        console.warn('Failed to persist risk flags:', flagSaveErr);
      }
    }

    // 2. Process fields in chunks (NFR-SCALE.3 batch size)
    const analyzedFields: AnalyzedField[] = [];
    const chunkSize = config.batchSize;

    for (let i = 0; i < fieldsToProcess.length; i += chunkSize) {
      const chunk = fieldsToProcess.slice(i, i + chunkSize);
      const chunkPromises = chunk.map(async (field: ExtractedFieldInput) => {
        const isFlaggedUnusual = riskFlags.some(
          (f) => f.fieldKey === field.key || (f.flagType === 'unusual_otp_request' && f.severity === 'high')
        );
        const riskTag = determineRiskTag(field, isFlaggedUnusual);

        const { explanation, fieldKey } = await getOrGenerateExplanation(
          formId,
          field,
          language
        );

        const analyzed: AnalyzedField = {
          ...field,
          id: field.id || fieldKey,
          key: fieldKey, // Return deterministic field key
          riskTag,
          explanation,
        };

        return analyzed;
      });

      const chunkResults = await Promise.all(chunkPromises);
      analyzedFields.push(...chunkResults);
    }

    const responsePayload: AnalyzeFormResponse = {
      form_id: formId,
      fields: analyzedFields,
      risk_flags: riskFlags,
    };

    res.status(200).json(responsePayload);
  } catch (error: any) {
    console.error('analyzeFormHandler error:', error);
    res.status(500).json({
      error: 'Form analysis failed. Please try again.',
      details: error.message,
    });
  }
}
