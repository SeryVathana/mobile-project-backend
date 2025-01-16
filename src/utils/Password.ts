// Create hash password function without using bcrypt

import crypto from "crypto";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Usage:
// import { hashPassword } from "./utils/Password";
//
// const hashedPassword = hashPassword("my_password");
// console.log(hashed password is: ${hashedPassword});

// Output: hashed password is: 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8
