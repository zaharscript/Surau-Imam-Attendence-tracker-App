# Security Specification - Imam Attendance Tracker

## Data Invariants
1. An attendance record must always point to a valid Imam ID.
2. An attendance record's amount must be exactly 5 (as per requirement, though we store it).
3. Attendance dates must be valid YYYY-MM-DD strings.
4. Prayer types are limited to Subuh, Maghrib, Isyak.

## The Dirty Dozen Payloads (Rejections)
1. Creating an imam with `isAdmin: true` field.
2. Setting `amount` to 1,000,000 for a prayer.
3. Recording attendance for a non-existent Imam.
4. Recording attendance with a 2MB string as the date.
5. Updating an attendance record's `imamId` after creation.
6. Deleting active Imam profiles without authorization.
7. Spoofing `recordedAt` using a client-side timestamp.
8. Modifying `amount` on an existing attendance record.
9. Injecting script tags into Imam names.
10. Creating attendance for a prayer type "Lunch".
11. Bypassing the MYR 5 limit.
12. Bulk deleting records as an unverified user.
