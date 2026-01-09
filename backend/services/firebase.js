import admin from "firebase-admin";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();



if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_ADMIN)
    ),
  });
}

export const firebaseAdmin = admin;