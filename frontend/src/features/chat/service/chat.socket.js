import { io } from "socket.io-client";

export const initializedsocketconnection = () => {
    console.log("Initializing socket connection...");

    const socket = io("https://preplexity-9cb6.onrender.com/", {
        withCredentials: true,
    });

    socket.on("connect", () => {
        console.log("Connected to Socket.IO:", socket.id);
    });

    socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error.message);
    });

    socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
    });

    return socket;
};