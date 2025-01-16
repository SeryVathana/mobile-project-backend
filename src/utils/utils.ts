import { rooms } from "..";

export function generateRandomString(length: number) {
  // const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const characters = "0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  if (rooms.find((r) => r.roomCode === result)) {
    return generateRandomString(length);
  }

  return result;
}
