// Dummy Firebase configuration for CI builds
// This file is used when the real firebase-config.ts is not available
export const firebaseConfig = {
  apiKey: "dummy-api-key",
  authDomain: "dummy-project.firebaseapp.com",
  projectId: "dummy-project",
  storageBucket: "dummy-project.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:dummy",
  measurementId: "G-DUMMY123"
};