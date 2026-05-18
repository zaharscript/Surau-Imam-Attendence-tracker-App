const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

export async function sendTelegramMessage(text: string) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.warn('Telegram credentials missing, skipping message');
        return;
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN.trim()}/sendMessage`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID.trim(),
                text: text,
                parse_mode: 'HTML'
            }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.description || 'Failed to send Telegram message');
        }
    } catch (error) {
        console.error('Error sending Telegram message:', error);
    }
}