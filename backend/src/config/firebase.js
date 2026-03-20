const admin = require('firebase-admin');

let messaging = null;

try {
    // Expects firebase-key.json in the same config/ directory.
    // Copy your Firebase service account JSON file there to enable push notifications.
    const serviceAccount = require('./firebase-key.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    messaging = admin.messaging();
    console.log('Firebase Admin initialized — push notifications enabled.');
} catch (err) {
    console.warn(
        'Firebase not initialized (firebase-key.json missing or invalid). ' +
        'Push notifications are disabled. To enable them, place your Firebase ' +
        'service account JSON at backend/src/config/firebase-key.json'
    );
}

module.exports = { messaging };
