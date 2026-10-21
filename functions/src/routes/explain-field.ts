import { Response } from 'express';
import { db } from '../config';
import { AuthenticatedRequest } from '../middleware/auth';
import { ExplainFieldRequest, FieldExplanation, ExtractedFieldInput } from '../types';
import { getOrGenerateExplanation } from '../services/explanation';

/**
 * POST /api/explain-field
 * Retrieves single field explanation (cache hit or on-demand generation).
 */
export async function explainFieldHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { form_id, field_key, language = 'en' } = req.body as ExplainFieldRequest;

    if (!form_id || !field_key) {
      res.status(400).json({ error: 'form_id and field_key are required.' });
      return;
    }

    // 1. Check cache directly
    const expDocRef = db.doc(`forms/${form_id}/fields/${field_key}/explanations/${language}`);
    const expSnap = await expDocRef.get();

    if (expSnap.exists) {
      const explanation = expSnap.data() as FieldExplanation;
      res.status(200).json(explanation);
      return;
    }

    // 2. If not cached, get parent field metadata to generate
    const fieldDocRef = db.doc(`forms/${form_id}/fields/${field_key}`);
    const fieldSnap = await fieldDocRef.get();

    if (!fieldSnap.exists) {
      res.status(404).json({ error: 'Field record not found.' });
      return;
    }

    const fieldData = fieldSnap.data() as any;
    const fieldInput: ExtractedFieldInput = {
      key: field_key,
      name: fieldData.name || '',
      label: fieldData.label || 'Field',
      inputType: fieldData.inputType || 'text',
      isRequired: Boolean(fieldData.isRequired),
      helpText: fieldData.helpText,
    };

    const { explanation } = await getOrGenerateExplanation(form_id, fieldInput, language);
    res.status(200).json(explanation);
  } catch (err: any) {
    console.error('explainFieldHandler error:', err);
    res.status(500).json({
      error: 'Failed to retrieve field explanation.',
      details: err.message,
    });
  }
}
