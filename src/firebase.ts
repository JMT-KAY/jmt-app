import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyBDjTSxOesJ3S7YkYFiBWIKREctpCM8ZKg",
  authDomain: "jmt-app-57456.firebaseapp.com",
  projectId: "jmt-app-57456",
  storageBucket: "jmt-app-57456.firebasestorage.app",
  messagingSenderId: "15258904322",
  appId: "1:15258904322:web:49d20a4aae443b6698841b"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스들 초기화
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
