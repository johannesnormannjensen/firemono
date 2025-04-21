export const FirestorePaths = {
  collection: {
    user: () => 'user' as const,
  },
  document: {
    user: (userId: string) => `${FirestorePaths.collection.user()}/${userId}` as const,
  },
};

export type FirestoreCollectionKeys = keyof typeof FirestorePaths.collection;
export type FirestoreCollectionPath = ReturnType<typeof FirestorePaths.collection[FirestoreCollectionKeys]>;

export type FirestoreDocumentKeys = keyof typeof FirestorePaths.document;
export type FirestoreDocumentPath = ReturnType<typeof FirestorePaths.document[FirestoreDocumentKeys]>;
