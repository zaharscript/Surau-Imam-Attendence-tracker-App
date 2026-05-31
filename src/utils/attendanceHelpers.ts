import { AttendanceRecord, PrayerType } from '../types';

export const getValidAttendance = (
    attendance: AttendanceRecord[]
) => {
    return attendance.filter(
        (a) =>
            a.prayerType === PrayerType.SUBUH ||
            a.prayerType === PrayerType.MAGHRIB ||
            a.prayerType === PrayerType.ISYAK
    );
};

export const calculateAttendanceStats = (
    attendance: AttendanceRecord[]
) => {
    // Collect unique (date + prayerType) sessions
    const uniqueSessions = new Set<string>();

    attendance.forEach((a) => {
        const validPrayer =
            a.prayerType === PrayerType.SUBUH ||
            a.prayerType === PrayerType.MAGHRIB ||
            a.prayerType === PrayerType.ISYAK;

        if (validPrayer) {
            uniqueSessions.add(`${a.date}_${a.prayerType}`);
        }
    });

    const totalSolat = uniqueSessions.size;
    const totalElaun = totalSolat * 5;

    return {
        totalSolat,
        totalElaun,
    };
};

export const getImamPrayerCount = (
    attendance: AttendanceRecord[],
    imamId: string,
    prayerType?: PrayerType
) => {
    // Collect unique (date + prayerType) sessions for this imam
    const uniqueSessions = new Set<string>();

    attendance.forEach((a) => {
        const validPrayer =
            a.prayerType === PrayerType.SUBUH ||
            a.prayerType === PrayerType.MAGHRIB ||
            a.prayerType === PrayerType.ISYAK;

        if (!validPrayer) return;

        if (a.imamId === imamId) {
            if (prayerType) {
                if (a.prayerType === prayerType) {
                    uniqueSessions.add(`${a.date}_${a.prayerType}`);
                }
            } else {
                uniqueSessions.add(`${a.date}_${a.prayerType}`);
            }
        }
    });

    return uniqueSessions.size;
};