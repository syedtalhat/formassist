"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.explainFieldHandler = explainFieldHandler;
const config_1 = require("../config");
const explanation_1 = require("../services/explanation");
/**
 * POST /api/explain-field
 * Retrieves single field explanation (cache hit or on-demand generation).
 */
async function explainFieldHandler(req, res) {
    try {
        const { form_id, field_key, language = 'en' } = req.body;
        if (!form_id || !field_key) {
            res.status(400).json({ error: 'form_id and field_key are required.' });
            return;
        }
        // 1. Check cache directly
        const expDocRef = config_1.db.doc(`forms/${form_id}/fields/${field_key}/explanations/${language}`);
        const expSnap = await expDocRef.get();
        if (expSnap.exists) {
            const explanation = expSnap.data();
            res.status(200).json(explanation);
            return;
        }
        // 2. If not cached, get parent field metadata to generate
        const fieldDocRef = config_1.db.doc(`forms/${form_id}/fields/${field_key}`);
        const fieldSnap = await fieldDocRef.get();
        if (!fieldSnap.exists) {
            res.status(404).json({ error: 'Field record not found.' });
            return;
        }
        const fieldData = fieldSnap.data();
        const fieldInput = {
            key: field_key,
            name: fieldData.name || '',
            label: fieldData.label || 'Field',
            inputType: fieldData.inputType || 'text',
            isRequired: Boolean(fieldData.isRequired),
            helpText: fieldData.helpText,
        };
        const { explanation } = await (0, explanation_1.getOrGenerateExplanation)(form_id, fieldInput, language);
        res.status(200).json(explanation);
    }
    catch (err) {
        console.error('explainFieldHandler error:', err);
        res.status(500).json({
            error: 'Failed to retrieve field explanation.',
            details: err.message,
        });
    }
}
//# sourceMappingURL=explain-field.js.map