import dotenv from "dotenv"
dotenv.config()
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth"
import admin from "firebase-admin"
initializeApp({
    credential: admin.credential.cert({
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        projectId: process.env.FIREBASE_PROJECT_ID
    })

})

export const auth = getAuth();

