import { FirestorePaths, User } from '@firemono/demo/data';
import { QueryDocumentSnapshot, Timestamp } from 'firebase-admin/firestore';
import { Change, EventContext } from 'firebase-functions/v1';
import { setLastUpdate } from './user.trigger';
import { FirestoreEvent } from 'firebase-functions/firestore';
import { expect, describe, beforeAll, beforeEach, it } from 'vitest';

export const addAuthUserToEvent = <T extends Change<any>>(userId: string, data: T): Partial<FirestoreEvent<T>> => ({ data, params: { userId } });

export const mockEventContext = (uidOrPartialEventContext: string | (Partial<Omit<EventContext, 'auth'> & { auth: Partial<EventContext['auth']>; }>)): EventContext =>
    (typeof uidOrPartialEventContext === 'string' ? { auth: { uid: uidOrPartialEventContext } } : uidOrPartialEventContext) as EventContext;


export const initFirebaseTestEnv = async (projectId = `dummy_${new Date().getTime()}`) => {
    // initialize test FirestoreDatabase
    process.env['GCLOUD_PROJECT'] = projectId;
    process.env['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080';

    const app = await import('firebase-admin').then(admin => admin.initializeApp({ projectId }));
    const firestore = app.firestore(); // Used for querying the database
    const { default: functionsTest }: any = await import('firebase-functions-test');
    const firebaseTest = functionsTest();

    return { firebaseTest, firestore };
};


describe('setLastUpdate trigger', () => {
    let db!: FirebaseFirestore.Firestore;
    let test!: Awaited<ReturnType<typeof initFirebaseTestEnv>>['firebaseTest'];
    const projectId = 'sample-' + new Date().getTime();

    beforeAll(async () => {
        const { firestore, firebaseTest } = await initFirebaseTestEnv(projectId);
        db = firestore;
        test = firebaseTest;
    });

    beforeEach(async () => {
        await test.firestore.clearFirestoreData({ projectId });
    });

    it('should update lastUpdate timestamp when user is updated', async () => {
        // Arrange
        const id = '1';
        const userRef = db.doc(FirestorePaths.document.user(id));
        await userRef.set({ id, displayName: 'Alice' });

        const change: Change<QueryDocumentSnapshot> = {
            before: test.firestore.makeDocumentSnapshot({ id, displayName: 'Alice' }, FirestorePaths.document.user(id)),
            after: test.firestore.makeDocumentSnapshot({ id, displayName: 'Alice Smith' }, FirestorePaths.document.user(id)),
        };

        const event: Partial<FirestoreEvent<Change<QueryDocumentSnapshot>>> = { data: change, params: { userId: id } };

        // Act
        await test.wrap(setLastUpdate)(event);

        // Assert
        const updatedDoc = await userRef.get();
        const data = updatedDoc.data() as User;
        expect(data?.lastUpdate).toBeDefined();
        expect(data?.lastUpdate).toBeInstanceOf(Timestamp);
    });

    it('should do nothing if after.data() is undefined', async () => {
        // Arrange
        const id = '2';
        const change: Change<QueryDocumentSnapshot> = {
            before: test.firestore.makeDocumentSnapshot({ id, displayName: 'Bob' }, FirestorePaths.document.user(id)),
            after: test.firestore.makeDocumentSnapshot(null as any, FirestorePaths.document.user(id)), // simulerer ingen data efter update
        };

        const event: Partial<FirestoreEvent<Change<QueryDocumentSnapshot>>> = { data: change, params: { userId: id } };

        // Act
        const result = await test.wrap(setLastUpdate)(event);

        // Assert
        expect(result).toBeUndefined(); // funktionen skal bare returnere tidligt
    });
});
