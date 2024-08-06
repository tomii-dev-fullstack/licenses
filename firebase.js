import dotenv from "dotenv"
dotenv.config()
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth"
initializeApp({
    serviceAccountId: "firebase-adminsdk-931wp@opawork-d9583.iam.gserviceaccount.com"
})

export const auth = getAuth()

