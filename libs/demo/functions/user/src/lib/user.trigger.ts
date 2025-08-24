import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { firestore } from 'firebase-functions';

// Fires only when an existing user document changes
export const setLastUpdateMeta = firestore.onDocumentUpdated('user/{userId}', async (event) => {
    const db = getFirestore();
    const userId = event.params.userId;
    const after = event.data?.after;
    if (!after) return;

    // Optional: pick fields to denormalize into metadata
    const displayName = after.get('displayName') ?? null;
    const roles = after.get('roles') ?? null;

    const metaRef = db.collection('user_metadata').doc(userId);
    const eventId = event.id; // unique-ish per delivery; functions are "at-least-once"

    // Idempotency guard: only write if we haven't processed this eventId yet
    await db.runTransaction(async (tx) => {
        const snap = await tx.get(metaRef);
        const lastEventId = snap.exists ? snap.get('lastEventId') : null;
        if (lastEventId === eventId) return; // already processed this event

        tx.set(
            metaRef,
            {
                lastUpdate: FieldValue.serverTimestamp(), // server time ✅
                lastEventId: eventId,                    // idempotency marker
                displayName,
                roles,
                updatedBy: 'setLastUpdateMeta',
            },
            { merge: true }
        );
    });
});