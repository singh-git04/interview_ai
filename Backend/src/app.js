import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))
app.use(cookieParser())
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}))

// Import route
import authRouter from "./routes/auth.Route.js"
import interviewRouter from "./routes/interview.Route.js"

// Routes declaration
app.use("/api/auth",authRouter)
app.use("/api/interview",interviewRouter)
export default app