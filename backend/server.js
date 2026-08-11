import "dotenv/config";
import http from "http"
import app from "./src/app.js"
import { initSocket } from "./src/sockets/server.socket.js";

const httpServer = http.createServer(app)
initSocket(httpServer);
httpServer.listen(3000,(req,res)=>{
    console.log("server is running on 3000");
    
})
