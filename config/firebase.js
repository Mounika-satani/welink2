const admin = require('firebase-admin');

let serviceAccount;
try {
    serviceAccount = require('./serviceAccountKey.json');
} catch (error) {
    console.warn("⚠️  Service Account Key not found in config/serviceAccountKey.json");
    console.warn("Please download it from Firebase Console and save it here.");
}

if (serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin initialized successfully");
} else {
    console.error("❌ Firebase Admin could not be initialized. Missing serviceAccountKey.json");
}

module.exports = admin;
