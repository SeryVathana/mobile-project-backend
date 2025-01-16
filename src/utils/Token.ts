// Create JWT token

import jwt from "jsonwebtoken";
import { config } from "dotenv";

config();

export function createToken(payload: any): string {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
}

// check if token is valid
export function verifyToken(token: string): any {
  return jwt.verify(token, process.env.JWT_SECRET);
}
