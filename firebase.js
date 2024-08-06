import dotenv from "dotenv"
dotenv.config()
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth"
initializeApp({
    credential: applicationDefault()
})

export const auth = getAuth()

