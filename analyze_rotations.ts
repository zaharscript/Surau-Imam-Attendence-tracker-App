import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import * as dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function analyzeRotations() {
    const q = query(
        collection(db, "monthlyRotations"),
        where("month", "==", "2026-01")
    );

    const snap = await getDocs(q);
    const rotations = [];
    snap.forEach(doc => {
        rotations.push(doc.data());
    });

    console.log(JSON.stringify(rotations, null, 2));
}

analyzeRotations().catch(console.error);
