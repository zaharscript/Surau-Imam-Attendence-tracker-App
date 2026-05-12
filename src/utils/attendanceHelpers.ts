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
    const validAttendance = getValidAttendance(attendance);

    const totalSolat = validAttendance.length;
    const totalElaun = totalSolat * 5;

    return {
        validAttendance,
        totalSolat,
        totalElaun,
    };
};

export const getImamPrayerCount = (
    attendance: AttendanceRecord[],
    imamId: string,
    prayerType?: PrayerType
) => {
    return attendance.filter((a) => {
        const validPrayer =
            a.prayerType === PrayerType.SUBUH ||
            a.prayerType === PrayerType.MAGHRIB ||
            a.prayerType === PrayerType.ISYAK;

        if (!validPrayer) return false;

        if (prayerType) {
            return a.imamId === imamId && a.prayerType === prayerType;
        }

        return a.imamId === imamId;
    }).length;
};