"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeFormHandler = analyzeFormHandler;
const admin = __importStar(require("firebase-admin"));
const config_1 = require("../config");
const explanation_1 = require("../services/explanation");
/**
 * POST /api/analyze-form
 * Receives form structure (strictly zero-knowledge on user input values per FR-REDACT.2).
 * Batches explanation lookups/generations, evaluates risk flags, caches results, and returns enriched fields.
 */
async function analyzeFormHandler(req, res) {
    try {
        const body = req.body;
        if (!body || (!body.page_url && !body.pageUrl) || !Array.isArray(body.fields)) {
            res.status(400).json({ error: 'Invalid payload: page_url (or pageUrl) and fields array are required.' });
            return;
        }
        const page_url = body.page_url || body.pageUrl;
        const form_action = body.form_action || body.formAction || '';
        const form_title = body.form_title || body.formTitle;
        const language = (body.language || 'en');
        const rawFields = body.fields;
        // Map fields so both id and key, isRequired and required are handled
        const normalizedFields = rawFields.map((f) => ({
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
        const fieldsToProcess = normalizedFields.slice(0, config_1.config.maxFieldsPerRequest);
        const formId = (0, explanation_1.computeFormId)(page_url);
        // Upsert parent form document
        await (0, explanation_1.ensureFormDocument)(formId, page_url, form_title);
        // 1. Evaluate risk flags (FR-RISK.1 - FR-RISK.5)
        const riskFlags = [];
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
        }
        catch (riskErr) {
            console.warn('Risk evaluation warning:', riskErr);
        }
        // Persist risk flags in subcollection (FR-RISK.5)
        if (riskFlags.length > 0) {
            try {
                const batch = config_1.db.batch();
                for (const flag of riskFlags) {
                    const flagRef = config_1.db.collection(`forms/${formId}/riskFlags`).doc();
                    batch.set(flagRef, {
                        ...flag,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                }
                await batch.commit();
            }
            catch (flagSaveErr) {
                console.warn('Failed to persist risk flags:', flagSaveErr);
            }
        }
        // 2. Process fields in chunks (NFR-SCALE.3 batch size)
        const analyzedFields = [];
        const chunkSize = config_1.config.batchSize;
        for (let i = 0; i < fieldsToProcess.length; i += chunkSize) {
            const chunk = fieldsToProcess.slice(i, i + chunkSize);
            const chunkPromises = chunk.map(async (field) => {
                const isFlaggedUnusual = riskFlags.some((f) => f.fieldKey === field.key || (f.flagType === 'unusual_otp_request' && f.severity === 'high'));
                const riskTag = (0, explanation_1.determineRiskTag)(field, isFlaggedUnusual);
                const { explanation, fieldKey } = await (0, explanation_1.getOrGenerateExplanation)(formId, field, language);
                const analyzed = {
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
        const responsePayload = {
            form_id: formId,
            fields: analyzedFields,
            risk_flags: riskFlags,
        };
        res.status(200).json(responsePayload);
    }
    catch (error) {
        console.error('analyzeFormHandler error:', error);
        res.status(500).json({
            error: 'Form analysis failed. Please try again.',
            details: error.message,
        });
    }
}
//# sourceMappingURL=analyze-form.js.map