import express from "express"
import { config } from "dotenv"
import cors from "cors"
import router from "./routes/routes.js"
config()


const app = express()
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT"], credentials:true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(router)



app.listen(3001, () => {
    console.log("escuchandoa")
})

