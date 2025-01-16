import { Request, Response } from "express";
import { generateRandomString } from "../utils/utils";
import { gameServer, rooms, updateRoom } from "..";
import { GameRoom } from "../rooms/GameRoom";
import { verifyToken } from "../utils/Token";
import User from "../models/user";

export const createRoomHandler = async (req: Request, res: Response) => {
  const roomCode = generateRandomString(4);
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  const jwt = verifyToken(token);

  if (!jwt) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const user: any = User.findById(jwt.id);

    if (!user) {
      return res.status(404).json({ error: "Player not found" });
    }

    rooms.push({
      roomCode,
      roomPlayerCount: 1,
      players: [
        {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      ],
    });

    updateRoom(rooms);

    gameServer.define(roomCode, GameRoom);

    return res.status(201).json({ room_code: roomCode });
  } catch (error) {
    console.error("Error creating room:", error);
    return res.status(500).json({ error: "Failed to create room" });
  }
};

export const findRoomHandler = async (req: Request, res: Response) => {
  const roomCode = req.params.roomCode;

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  const jwt = verifyToken(token);

  if (!jwt) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const room = rooms.find((r) => r.roomCode == roomCode && r.players[0].id !== jwt.id);

  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  if (room.roomPlayerCount >= 4) {
    return res.status(400).json({ error: "Room is full" });
  }

  try {
    const user: any = User.findById(jwt.id);

    if (!user) {
      return res.status(404).json({ error: "Player not found" });
    }

    rooms.map((r) => {
      if (r.roomCode === room.roomCode) {
        r.roomPlayerCount = 2;
        r.players.push({
          id: user.id,
          username: user.username,
          email: user.email,
        });
      }
      return r;
    });

    updateRoom(rooms);
    return res.status(200).json({ message: "Room joined successfully" });
  } catch (error) {
    console.error("Error joining room:", error);
    return res.status(500).json({ error: "Failed to join room" });
  }
};
