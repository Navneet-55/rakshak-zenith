import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

// Placeholder config - required for Firebase to initialize, but local emulator bypasses auth checks
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Connect to local Firebase Emulators for the prototype
try {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
} catch (e) {
  console.warn("Emulators already connected or failed to connect.");
}

export { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, httpsCallable };
