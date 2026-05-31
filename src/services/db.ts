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
  // 1. If we have a specific ID to remove, always allow removing it
  if (existingId) {
    try {
      await deleteDoc(doc(db, "attendance", existingId));
      // FALLTHROUGH: we still want to clean up ANY other records for this session
    } catch (e) {
      console.error("Failed to delete existing record", e);
    }
  }

  // 2. Query for ANY records for this prayer session to handle duplicates or other imams
  // We check both current case and uppercase to be safe with historical data
  const q = query(
    collection(db, "attendance"),
    where("date", "==", date),
    where("prayerType", "in", [prayerType, prayerType.toUpperCase()])
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const records = snapshot.docs;
    const isTakenByCurrentImam = records.some(d => d.data().imamId === imamId);

    if (isTakenByCurrentImam) {
      // Toggle OFF: Remove all records for this session for this imam (cleanup)
      const deletePromises = records
        .filter(d => d.data().imamId === imamId)
        .map(d => deleteDoc(doc(db, "attendance", d.id)));
      await Promise.all(deletePromises);
      return;
    } else if (!existingId) {
      // Taken by someone else AND we weren't trying to delete a specific record
      console.warn("Prayer already taken by another imam");
      return;
    }
  }

  // 3. Toggle ON (if we didn't just delete anything)
  if (!existingId) {
    await addDoc(collection(db, "attendance"), {
      imamId,
      date,
      prayerType,
      createdAt: new Date().toISOString()
    });
  }
};

// -------------------- ROTATIONS --------------------

// Subscribe to rotations by month
export const subscribeMonthlyRotations = (month: string, callback: (rotations: any[]) => void) => {
  const q = query(
    collection(db, "monthlyRotations"),
    where("month", "==", month)
  );

  return onSnapshot(q, (snapshot) => {
    const rotations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(rotations);
  });
};

// Add monthly rotation
export const addMonthlyRotation = async (data: {
  month: string;
  imamId: string;
  imamName: string;
  prayerType: string;
  days: string[];
}) => {
  const { serverTimestamp } = await import("firebase/firestore");

  // Conflict check: check if any other document for same month and prayer contains any of these days
  const q = query(
    collection(db, "monthlyRotations"),
    where("month", "==", data.month),
    where("prayerType", "==", data.prayerType)
  );

  const snapshot = await getDocs(q);
  const existingRotations = snapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));

  for (const day of data.days) {
    const conflict = existingRotations.find((r: any) => r.days.includes(day));
    if (conflict) {
      throw new Error(`${data.prayerType} pada hari ${day} untuk ${data.month} telah ditugaskan kepada ${conflict.imamName}.`);
    }
  }

  await addDoc(collection(db, "monthlyRotations"), {
    ...data,
    createdAt: serverTimestamp(),
  });
};

// Delete monthly rotation
export const deleteMonthlyRotation = async (id: string) => {
  await deleteDoc(doc(db, "monthlyRotations", id));
};

