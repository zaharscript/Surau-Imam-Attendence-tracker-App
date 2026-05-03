export enum PrayerType {
  SUBUH = 'Subuh',
  MAGHRIB = 'Maghrib',
  ISYAK = 'Isyak',
}

export interface Imam {
  id: string;
  name: string;
  isActive: boolean;
  createdAt?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  imamId: string;
  prayerType: PrayerType;
  amount: number;
  recordedAt: string;
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  records: AttendanceRecord[];
  totalAllowance: number;
}
