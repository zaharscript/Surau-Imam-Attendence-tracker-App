import { AttendanceRecord, PrayerType } from '../types';

export const getValidAttendance = (
    attendance: AttendanceRecord[]
) => {
    return attendance.filter((a) => {
        const type = a.prayerType?.toUpperCase();
        return (
            type === PrayerType.SUBUH.toUpperCase() ||
            type === PrayerType.MAGHRIB.toUpperCase() ||
            type === PrayerType.ISYAK.toUpperCase()
        );
    });
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
            uniqueSessions.add(`${a.date}_${a.prayerType?.toUpperCase()}`);
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
            const incomingType = a.prayerType?.toUpperCase();
            if (prayerType) {
                if (incomingType === prayerType.toUpperCase()) {
                    uniqueSessions.add(`${a.date}_${incomingType}`);
                }
            } else {
                uniqueSessions.add(`${a.date}_${incomingType}`);
            }
        }
    });

    return uniqueSessions.size;
};