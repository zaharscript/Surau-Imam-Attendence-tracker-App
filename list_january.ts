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

async function listJanuaryAttendance() {
    const imamsSnap = await getDocs(collection(db, "imams"));
    const imamMap = {};
    imamsSnap.forEach(doc => {
        imamMap[doc.id] = doc.data().name;
    });

    const q = query(
        collection(db, "attendance"),
        where("date", ">=", "2026-01-01"),
        where("date", "<=", "2026-01-31")
    );

    const snap = await getDocs(q);
    const records = [];
    snap.forEach(doc => {
        const data = doc.data();
        records.push({
            id: doc.id,
            date: data.date,
            imam: imamMap[data.imamId] || data.imamId,
            prayer: data.prayerType
        });
    });

    records.sort((a, b) => a.date.localeCompare(b.date) || a.prayer.localeCompare(b.prayer));

    console.log(JSON.stringify(records, null, 2));
}

listJanuaryAttendance().catch(console.error);
