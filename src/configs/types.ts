type GameRoomType = {
  roomCode: string;
  roomPlayerCount: number;
  players: PlayerType[];
};

type PlayerType = {
  id: string;
  username: string;
  email: string;
};
