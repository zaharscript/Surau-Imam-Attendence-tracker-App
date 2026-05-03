import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  getDocs,
  where,
  doc,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Imam, AttendanceRecord, PrayerType } from '../types';

const IMAMS_COL = 'imams';
const ATTENDANCE_COL = 'attendance';

// Imam Operations
export const getImams = async () => {
  try {
    const q = query(collection(db, IMAMS_COL), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Imam));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, IMAMS_COL);
    return [];
  }
};

export const subscribeImams = (callback: (imams: Imam[]) => void) => {
  const q = query(collection(db, IMAMS_COL), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Imam)));
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, IMAMS_COL);
  });
};

export const addImam = async (name: string) => {
  try {
    await addDoc(collection(db, IMAMS_COL), {
      name,
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, IMAMS_COL);
  }
};

export const toggleImamStatus = async (id: string, isActive: boolean) => {
  try {
    await updateDoc(doc(db, IMAMS_COL, id), { isActive });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${IMAMS_COL}/${id}`);
  }
};

export const deleteImam = async (id: string) => {
  try {
    await deleteDoc(doc(db, IMAMS_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${IMAMS_COL}/${id}`);
  }
};

// Attendance Operations
export const getAttendanceByMonth = async (month: string) => {
  try {
    // month format YYYY-MM
    const q = query(
      collection(db, ATTENDANCE_COL),
      where('date', '>=', `${month}-01`),
      where('date', '<=', `${month}-31`),
      orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ATTENDANCE_COL);
    return [];
  }
};

export const subscribeAttendanceByMonth = (month: string, callback: (records: AttendanceRecord[]) => void) => {
    const q = query(
      collection(db, ATTENDANCE_COL),
      where('date', '>=', `${month}-01`),
      where('date', '<=', `${month}-31`),
      orderBy('date', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, ATTENDANCE_COL);
    });
}

export const toggleAttendance = async (date: string, imamId: string, prayerType: PrayerType, existingId?: string) => {
  if (existingId) {
    try {
      await deleteDoc(doc(db, ATTENDANCE_COL, existingId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${ATTENDANCE_COL}/${existingId}`);
    }
  } else {
    try {
      await addDoc(collection(db, ATTENDANCE_COL), {
        date,
        imamId,
        prayerType,
        amount: 5,
        recordedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, ATTENDANCE_COL);
    }
  }
};
