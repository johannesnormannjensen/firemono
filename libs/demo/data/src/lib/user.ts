import { Timestamp } from 'firebase-admin/firestore';

export interface User {
    id: string;
    name: string;
    lastUpdate: Timestamp;
}
