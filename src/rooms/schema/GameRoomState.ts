import { ArraySchema, Schema, type } from "@colyseus/schema";
import { GamePhase } from "../../configs/enums";

export class PlayerState extends Schema {
  @type("string") sessionId: string;
  @type("boolean") isReady: boolean = false;
  @type("boolean") isReadyForGame: boolean = false;
  @type("boolean") isLeader: boolean = false;
  @type("string") id: string = "";
  @type("string") username: string = "";
  @type("string") email: string = "";
  @type("string") currentWord: string = "";
  @type(["string"]) words: ArraySchema<string> = new ArraySchema<string>();
  @type("number") score: number = 0;
  @type("string") startDate: string = String(new Date());
  @type("string") finishDate: string = String(new Date());
  @type("boolean") isFinished: boolean = false;
  @type("boolean") isWordMissed = false; // New flag for tracking missed words
}

export class GameRoomState extends Schema {
  @type("number") phase: GamePhase = GamePhase.NONE;
  @type([PlayerState]) players: ArraySchema<PlayerState> = new ArraySchema<PlayerState>();
  @type("number") secondsLeft: number = 11;
}
