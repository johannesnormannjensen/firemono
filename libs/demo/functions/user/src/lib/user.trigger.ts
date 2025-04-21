import { User } from '@firemono/demo/data';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { firestore } from 'firebase-functions';


export const setLastUpdate = firestore.onDocumentUpdated("user/{userId}", async (event) => {
    const db = getFirestore();
    const userAfter: User = event.data?.after.data() as User;

    if (!userAfter) {
        return;
    }

    return db.collection("user").doc(event.params.userId).update({ lastUpdate: Timestamp.now() });
})


