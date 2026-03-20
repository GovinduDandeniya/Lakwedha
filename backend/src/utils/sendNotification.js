const { messaging } = require('../config/firebase');

/**
 * Send a Firebase Cloud Messaging push notification.
 * Silently skips if Firebase is not configured or token is missing.
 */
const sendPushNotification = async (token, title, body) => {
    if (!messaging || !token) return;

    try {
        await messaging.send({
            notification: { title, body },
            token,
        });
    } catch (err) {
        // Log but do not throw — a push failure should not break the booking flow
        console.error('FCM push error:', err.message);
    }
};

module.exports = { sendPushNotification };
