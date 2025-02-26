import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDO3FIJxdisijuaWYyS0cVpfg-gYfTNvIU",
  authDomain: "bku-5a8af.firebaseapp.com",
  projectId: "bku-5a8af",
  storageBucket: "bku-5a8af.firebasestorage.app",
  messagingSenderId: "197206940755",
  appId: "1:197206940755:web:756061a476fc9579157aa6"
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
