import { WebSocketTransport } from "@colyseus/ws-transport";
import { Server } from "colyseus";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import {
  getHistories,
  getSessionByToken,
  loginWithEmailPassword,
  registerWithEmailPassword,
  saveHistory,
  updatePassword,
  updateProfileImage,
  updateUserName,
} from "./handlers/playerAuthHandlers";
import { createRoomHandler, findRoomHandler } from "./handlers/roomHandlers";
import { connectToDatabase } from "./db";

const port = process.env.PORT || 2567;
const app = express();

export let rooms: GameRoomType[] = [];

dotenv.config();

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "5mb" }));
// app.use(express.urlencoded({ extended: true }));
// serve static files
app.use(express.static("public"));

connectToDatabase();

const server = createServer(app);
export const gameServer = new Server({
  transport: new WebSocketTransport({
    server,
  }),
});

app.get("/hello_world", (req, res) => {
  res.send("Hello World!");
});

// Room handlers
app.post("/create-room", createRoomHandler);
app.post("/find-room/:roomCode", findRoomHandler);

// Player auth handlers
app.post("/login", loginWithEmailPassword);
app.post("/register", registerWithEmailPassword);
app.post("/get-session", getSessionByToken);
app.get("/get-histories/:id", getHistories);
app.post("/save-history", saveHistory);
app.post("/update-username", updateUserName);
app.post("/update-pf", updateProfileImage);
app.post("/change-password", updatePassword);

export function updateRoom(room: any) {
  rooms = room;
}

export function removeRoom(roomCode: string) {
  rooms = rooms.filter((r) => r.roomCode !== roomCode);
}

server.listen(port);
console.log(`Server started on port ${port}`);
