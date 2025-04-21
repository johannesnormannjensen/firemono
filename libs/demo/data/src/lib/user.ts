import { Timestamp } from 'firebase-admin/firestore';

export interface User {
    name: string;
    lastUpdate: Timestamp;
}
