"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteChatHistoryHandler = deleteChatHistoryHandler;
const config_1 = require("../config");
/**
 * DELETE /api/chat-history
 * FR-CHAT.5 & NFR-DATA.3: Recursive deletion of user's chatSessions and nested messages.
 * Firestore does not cascade deletes automatically, so subcollections must be deleted explicitly.
 */
async function deleteChatHistoryHandler(req, res) {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            res.status(401).json({ error: 'Unauthorized: Authentication required.' });
            return;
        }
        const sessionsCol = config_1.db.collection(`users/${uid}/chatSessions`);
        const sessionsSnap = await sessionsCol.get();
        if (sessionsSnap.empty) {
            res.status(200).json({ deleted: true, sessionsDeleted: 0, messagesDeleted: 0 });
            return;
        }
        let totalMessagesDeleted = 0;
        for (const sessionDoc of sessionsSnap.docs) {
            const messagesSnap = await sessionDoc.ref.collection('messages').get();
            if (!messagesSnap.empty) {
                const batch = config_1.db.batch();
                for (const msgDoc of messagesSnap.docs) {
                    batch.delete(msgDoc.ref);
                    totalMessagesDeleted++;
                }
                await batch.commit();
            }
            await sessionDoc.ref.delete();
        }
        res.status(200).json({
            deleted: true,
            sessionsDeleted: sessionsSnap.size,
            messagesDeleted: totalMessagesDeleted,
        });
    }
    catch (err) {
        console.error('deleteChatHistoryHandler error:', err);
        res.status(500).json({
            error: 'Failed to delete chat history.',
            details: err.message,
        });
    }
}
//# sourceMappingURL=chat-history.js.map