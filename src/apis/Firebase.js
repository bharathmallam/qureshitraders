// firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { 
  getFirestore, 
  collection, 
  getDoc, 
  getDocs, 
  addDoc, 
  query, 
  deleteDoc, 
  where, 
  updateDoc, 
  doc,
  serverTimestamp 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyACb_NJVrQ0QeJjwVCCEenipXqYED1C1EQ",
  authDomain: "erp-qt.firebaseapp.com",
  databaseURL: "https://erp-qt-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "erp-qt",
  storageBucket: "erp-qt.firebasestorage.app",
  messagingSenderId: "910488048548",
  appId: "1:910488048548:web:63a2ea8f699cd456f06731",
  measurementId: "G-HW4QCJSCDY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export Firebase functions
export { 
  collection, 
  getDocs, 
  addDoc, 
  getDoc, 
  query, 
  where, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp,
  analytics 
};

export default app;
