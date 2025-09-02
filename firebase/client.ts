// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBGILkYV_istGnHrCZ35s8qHWZlR9NOGJE",
    authDomain: "real-talk-cbce1.firebaseapp.com",
    projectId: "real-talk-cbce1",
    storageBucket: "real-talk-cbce1.firebasestorage.app",
    messagingSenderId: "901647357453",
    appId: "1:901647357453:web:3ef7532c6f371728f26744",
    measurementId: "G-84BJPSKKJX"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);