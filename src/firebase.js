import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration (from Step 2)
const firebaseConfig = {
  apiKey: "AIzaSyB8pUozqmh9aMjJ423DTIJTHaDquFOxivc",
  authDomain: "space-budget-tracker.firebaseapp.com",
  projectId: "space-budget-tracker",
  storageBucket: "space-budget-tracker.firebasestorage.app",
  messagingSenderId: "270502031615",
  appId: "1:270502031615:web:c0721d577b3c7be7c89cca"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;