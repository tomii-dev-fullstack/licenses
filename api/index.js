import express from "express"
import { config } from "dotenv"
import cors from "cors"
import router from "./routes/routes.js"
import cookieParser from "cookie-parser"
config()


const app = express()
app.use(cors({ origin: ["https://opawork.vercel.app", "http://localhost:3030"], methods: "GET, POST, PUT, DELETE", credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(router)


app.listen(3001, () => {
    console.log("escuchandoa")
})

