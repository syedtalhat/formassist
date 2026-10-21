"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.optionalAuth = optionalAuth;
const config_1 = require("../config");
/**
 * NFR-SEC.5: Require valid Firebase ID token in Authorization header.
 * Token must follow 'Bearer <token>' format and is verified server-side with Admin SDK.
 */
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            error: 'Unauthorized: Missing or malformed Bearer token in Authorization header.',
        });
        return;
    }
    const idToken = authHeader.split('Bearer ')[1].trim();
    try {
        const decodedToken = await config_1.auth.verifyIdToken(idToken);
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
        };
        next();
    }
    catch (err) {
        console.error('ID Token verification failed:', err.message);
        res.status(401).json({
            error: 'Unauthorized: Invalid or expired Firebase ID token.',
        });
    }
}
/**
 * FR-ACC.3: Optional authentication for guest mode (e.g. analyze-form).
 * If token is present, verifies it and populates req.user; otherwise passes through without user.
 */
async function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.user = undefined;
        return next();
    }
    const idToken = authHeader.split('Bearer ')[1].trim();
    try {
        const decodedToken = await config_1.auth.verifyIdToken(idToken);
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
        };
    }
    catch {
        // Guest fallback if token expired or invalid on optional endpoint
        req.user = undefined;
    }
    next();
}
//# sourceMappingURL=auth.js.map