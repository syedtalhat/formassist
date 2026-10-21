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
exports.getPreferencesHandler = getPreferencesHandler;
exports.setPreferencesHandler = setPreferencesHandler;
const admin = __importStar(require("firebase-admin"));
const config_1 = require("../config");
const ALLOWED_LANGUAGES = ['en', 'hi', 'mr'];
/**
 * GET /api/preferences
 * FR-ACC.2: Retrieve saved user preferences from users/{uid}.
 */
async function getPreferencesHandler(req, res) {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            res.status(401).json({ error: 'Unauthorized: Authentication required.' });
            return;
        }
        const userDoc = await config_1.db.doc(`users/${uid}`).get();
        if (!userDoc.exists) {
            res.status(200).json({ default_language: 'en' });
            return;
        }
        const data = userDoc.data();
        res.status(200).json({
            default_language: data?.defaultLanguage || 'en',
        });
    }
    catch (err) {
        console.error('getPreferencesHandler error:', err);
        res.status(500).json({ error: 'Failed to retrieve preferences.', details: err.message });
    }
}
/**
 * PUT /api/preferences
 * FR-ACC.2 & NFR-SEC.3: Update defaultLanguage in users/{uid}.
 * Validates language is strictly one of 'en', 'hi', 'mr'.
 */
async function setPreferencesHandler(req, res) {
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
        const userRef = config_1.db.doc(`users/${uid}`);
        await userRef.set({
            defaultLanguage: default_language,
            email: req.user?.email || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        res.status(200).json({ default_language });
    }
    catch (err) {
        console.error('setPreferencesHandler error:', err);
        res.status(500).json({ error: 'Failed to update preferences.', details: err.message });
    }
}
//# sourceMappingURL=preferences.js.map