import { Module, Global } from '@nestjs/common';
import { initializeApp } from 'firebase/app';
import * as admin from 'firebase-admin';
import { adminConfig } from './credentials/firebase-adminsdk';
import { firebaseConfig } from './credentials/firebase-app';

export type FirebaseAdmin = admin.app.App;
export type FirebaseApp = ReturnType<typeof initializeApp>;

let firebaseAdmin: FirebaseAdmin | undefined;
let firebaseApp: FirebaseApp | undefined;

if (process.env.NODE_ENV !== 'test') {
  firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(adminConfig),
  });

  firebaseApp = initializeApp(firebaseConfig);
}

@Global()
@Module({
  providers: [
    {
      provide: 'FirebaseAdmin',
      useValue: firebaseAdmin,
    },
    {
      provide: 'FirebaseApp',
      useValue: firebaseApp,
    },
    {
      provide: 'FirebaseAdminSDK',
      useValue: admin,
    },
  ],
  exports: ['FirebaseAdmin', 'FirebaseApp', 'FirebaseAdminSDK'],
})
export class FirebaseModule {}
