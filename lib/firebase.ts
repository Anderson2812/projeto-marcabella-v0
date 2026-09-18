import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0884629209",
  appId: "1:733464006897:web:c75173fb4bfee09a8fd950",
  apiKey: "AIzaSyD-mGNJ0-hmMp-7tXCpo5GH6I4LT9wbiR4",
  authDomain: "gen-lang-client-0884629209.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-agendamentobelez-b54da552-95d4-4179-8c05-44d05ee7dfba",
  storageBucket: "gen-lang-client-0884629209.firebasestorage.app",
  messagingSenderId: "733464006897"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export default app;
