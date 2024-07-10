// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import * as admin from 'firebase-admin';
import { adminConfig } from './credentials/firebase-adminsdk';
import { firebaseConfig } from './credentials/firebase-app';

export const firebaseAdmin = admin.initializeApp({
  credential: admin.credential.cert(adminConfig),
});

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);

export { admin };
// const analytics = getAnalytics(app);
