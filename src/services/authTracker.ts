import { User } from 'firebase/auth';
import { sendTelegramMessage } from '../utils/telegram';

export const trackLogin = async (user: User | null) => {
    if (!user) return;

    const timestamp = new Date().toLocaleString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur' });
    const message = `🔔 <b>Login Notification</b>\n\n👤 User: ${user.displayName || user.email}\n📧 Email: ${user.email}\n⏰ Time: ${timestamp}`;

    console.log(`[AuthTracker] Tracking login for ${user.email}`);
    await sendTelegramMessage(message);
};

export const trackLogout = async (user: User | null) => {
    if (!user) return;

    const timestamp = new Date().toLocaleString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur' });
    const message = `🔕 <b>Logout Notification</b>\n\n👤 User: ${user.displayName || user.email}\n📧 Email: ${user.email}\n⏰ Time: ${timestamp}`;

    console.log(`[AuthTracker] Tracking logout for ${user.email}`);
    await sendTelegramMessage(message);
};