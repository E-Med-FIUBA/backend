// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import * as admin from 'firebase-admin';
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseParams = {
  type:                    process.env.FIREBASE_TYPE as string,
  projectId:               process.env.FIREBASE_PROJECT_ID as string,
  privateKeyId:            process.env.FIREBASE_PRIVATE_KEY_ID as string,
  privateKey:              process.env.FIREBASE_PRIVATE_KEY as string,
  clientEmail:             process.env.FIREBASE_CLIENT_EMAIL as string,
  clientId:                process.env.FIREBASE_CLIENT_ID as string,
  authUri:                 process.env.FIREBASE_AUTH_URI as string,
  tokenUri:                process.env.FIREBASE_TOKEN_URI as string,
  authProviderX509CertUrl: process.env
    .FIREBASE_AUTH_PROVIDER_X509_CERT_URL as string,
  clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL as string,
};

export const firebaseAdmin = admin.initializeApp({
  credential: admin.credential.cert(firebaseParams),
});

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey:            process.env.FIREBASE_API_KEY,
  authDomain:        process.env.FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.FIREBASE_PROJECT_ID,
  storageBucket:     process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.FIREBASE_APP_ID,
  measurementId:     process.env.FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
