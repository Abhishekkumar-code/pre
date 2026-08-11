import express from "express"
import morgan from 'morgan'
import connecttodb from "./config/database.js"
import cookieParser from "cookie-parser"
import authrouter from "./routes/auth.routes.js"
import handleerror from "./middleware/handleerror.js"
import cors from "cors"
import chatrouter from "./routes/chat.routes.js"
const app = express()
app.use(express.json())
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
    methods:["GET","POST","PUT","DELETE"],
}))
app.use(cookieParser())
app.use("/api/auth",authrouter)
app.use("/api/chat",chatrouter)
app.use(morgan("dev"))
connecttodb()


app.use(handleerror)
export default app;