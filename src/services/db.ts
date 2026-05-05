import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../lib/firebase";

// -------------------- IMAMS --------------------

// Subscribe to all imams
export const subscribeImams = (callback: any) => {
  const q = collection(db, "imams");

  return onSnapshot(q, (snapshot) => {
    const imams = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(imams);
  });
};

// Add imam
export const addImam = async (name: string) => {
  await addDoc(collection(db, "imams"), {
    name,
    isActive: true,
  });
};

// Delete imam
export const deleteImam = async (id: string) => {
  await deleteDoc(doc(db, "imams", id));
};

// Toggle active status
export const toggleImamStatus = async (id: string, isActive: boolean) => {
  const ref = doc(db, "imams", id);
  await (await import("firebase/firestore")).updateDoc(ref, { isActive });
};

// -------------------- ATTENDANCE --------------------

// Subscribe attendance by month
export const subscribeAttendanceByMonth = (month: string, callback: any) => {
  // month format: "2026-05"
  const start = `${month}-01`;
  const end = `${month}-31`;

  const q = query(
    collection(db, "attendance"),
    where("date", ">=", start),
    where("date", "<=", end)
  );

  return onSnapshot(q, (snapshot) => {
    const records = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(records);
  });
};

// Toggle attendance (add/remove)
export const toggleAttendance = async (
  date: string,
  imamId: string,
  prayerType: string,
  existingId?: string
) => {
  // If record exists → delete
  if (existingId) {
    await deleteDoc(doc(db, "attendance", existingId));
    return;
  }

  // Check if prayer already taken by another imam
  const q = query(
    collection(db, "attendance"),
    where("date", "==", date),
    where("prayerType", "==", prayerType)
  );

  const snapshot = await getDocs(q);

  const taken = snapshot.docs.find(
    (d) => d.data().imamId !== imamId
  );

  if (taken) {
    console.warn("Prayer already taken by another imam");
    return;
  }

  // Otherwise → create record
  await addDoc(collection(db, "attendance"), {
    imamId,
    date,
    prayerType,
  });
};