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

async function analyzeJanuary() {
    const imamsSnap = await getDocs(collection(db, "imams"));
    const imamMap = {};
    let zaharId, solihinId;
    imamsSnap.forEach(doc => {
        const data = doc.data();
        imamMap[doc.id] = data.name;
        if (data.name.includes("Zahar")) zaharId = doc.id;
        if (data.name.includes("Solihin")) solihinId = doc.id;
    });

    console.log(`Zahar ID: ${zaharId}, Solihin ID: ${solihinId}`);

    const q = query(
        collection(db, "attendance"),
        where("date", ">=", "2026-01-01"),
        where("date", "<=", "2026-01-31")
    );

    const snap = await getDocs(q);
    const dataMap = {}; // { date_prayer: { imamName, imamId } }

    snap.forEach(doc => {
        const d = doc.data();
        const key = `${d.date}_${d.prayerType.toUpperCase()}`;
        if (!dataMap[key]) {
            dataMap[key] = [];
        }
        dataMap[key].push({ id: doc.id, imam: imamMap[d.imamId], imamId: d.imamId });
    });

    const zaharRecords = [];
    const solihinRecords = [];

    for (const [key, records] of Object.entries(dataMap)) {
        const [date, prayer] = key.split('_');
        const zaharHas = records.some(r => r.imamId === zaharId);
        const solihinHas = records.some(r => r.imamId === solihinId);

        if (zaharHas) zaharRecords.push({ date, prayer });
        if (solihinHas) solihinRecords.push({ date, prayer });
    }

    console.log("\n--- ZAHAR (App found) ---");
    console.log(zaharRecords.sort((a, b) => a.date.localeCompare(b.date)));
    console.log("Count:", zaharRecords.length);

    console.log("\n--- SOLIHIN (App found) ---");
    console.log(solihinRecords.sort((a, b) => a.date.localeCompare(b.date)));
    console.log("Count:", solihinRecords.length);
}

analyzeJanuary().catch(console.error);
