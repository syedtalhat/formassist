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
exports.computeFormId = computeFormId;
exports.computeFieldKey = computeFieldKey;
exports.determineRiskTag = determineRiskTag;
exports.getOrGenerateExplanation = getOrGenerateExplanation;
exports.ensureFormDocument = ensureFormDocument;
const crypto = __importStar(require("crypto"));
const admin = __importStar(require("firebase-admin"));
const config_1 = require("../config");
const gemini_1 = require("./gemini");
const vector_search_1 = require("./vector-search");
/**
 * NFR-DATA.2: Deterministic form ID generation from domain and URL pattern
 */
function computeFormId(pageUrl) {
    try {
        const parsed = new URL(pageUrl);
        // Strip query parameters and hashes for stable form pattern
        const pattern = `${parsed.hostname}${parsed.pathname.replace(/\/$/, '')}`;
        const hash = crypto.createHash('sha256').update(pattern.toLowerCase()).digest('hex');
        return `form_${hash.substring(0, 16)}`;
    }
    catch {
        const hash = crypto.createHash('sha256').update(pageUrl.toLowerCase()).digest('hex');
        return `form_${hash.substring(0, 16)}`;
    }
}
/**
 * NFR-DATA.2: Deterministic field key generation
 * Hash of (normalised label + input type + name)
 */
function computeFieldKey(field) {
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
function determineRiskTag(field, isUnusual) {
    if (isUnusual)
        return 'unusual';
    return field.isRequired ? 'required' : 'optional';
}
/**
 * FR-EXPLAIN.1 - FR-EXPLAIN.5 & FR-CACHE.1:
 * Check Firestore cache for field explanation; on miss, retrieve official grounding via vector search
 * and generate structured explanation via Gemini, then cache to Firestore.
 */
async function getOrGenerateExplanation(formId, field, language) {
    const fieldKey = computeFieldKey(field);
    const explanationRef = config_1.db.doc(`forms/${formId}/fields/${fieldKey}/explanations/${language}`);
    // 1. Check cache (FR-EXPLAIN.1, FR-CACHE.1)
    try {
        const cachedSnap = await explanationRef.get();
        if (cachedSnap.exists) {
            const data = cachedSnap.data();
            return { explanation: data, fieldKey };
        }
    }
    catch (err) {
        console.warn(`Cache read error for field ${fieldKey}:`, err.message);
    }
    // 2. Vector search for official grounding documents (FR-EXPLAIN.2)
    const officialDoc = await (0, vector_search_1.searchSourceDocuments)(formId, `${field.label} ${field.helpText || ''}`);
    // 3. Generate structured explanation with Gemini (FR-EXPLAIN.4)
    const explanation = await (0, gemini_1.generateExplanationWithGemini)(field, language, officialDoc || undefined);
    // 4. Cache to Firestore (FR-EXPLAIN.5, FR-CACHE.1)
    try {
        const batch = config_1.db.batch();
        // Cache explanation document
        batch.set(explanationRef, {
            ...explanation,
            generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        // Update parent field record (Figure 3 data model)
        const fieldRef = config_1.db.doc(`forms/${formId}/fields/${fieldKey}`);
        batch.set(fieldRef, {
            label: field.label,
            inputType: field.inputType,
            isRequired: field.isRequired,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        await batch.commit();
    }
    catch (cacheErr) {
        console.warn(`Failed to persist explanation cache for field ${fieldKey}:`, cacheErr.message);
    }
    return { explanation, fieldKey };
}
/**
 * Ensure form document metadata exists
 */
async function ensureFormDocument(formId, pageUrl, formTitle) {
    try {
        const parsed = new URL(pageUrl);
        const formRef = config_1.db.doc(`forms/${formId}`);
        await formRef.set({
            domain: parsed.hostname,
            pageUrlPattern: `${parsed.hostname}${parsed.pathname}`,
            title: formTitle || parsed.hostname,
            lastIndexedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    catch (err) {
        console.warn(`Failed to update form document ${formId}:`, err.message);
    }
}
//# sourceMappingURL=explanation.js.map