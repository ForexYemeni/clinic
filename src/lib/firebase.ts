import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAxwLNMce4_HE_yzyXHOxvdOwaXCJ8LBHM",
  authDomain: "clinic-235f1.firebaseapp.com",
  projectId: "clinic-235f1",
  storageBucket: "clinic-235f1.firebasestorage.app",
  messagingSenderId: "359449587481",
  appId: "1:359449587481:web:1b26aa88ac91dfa7f35f88",
  measurementId: "G-TKG61BG8C3"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
