import { Client, Delayed, Room } from "@colyseus/core";
import { ArraySchema } from "@colyseus/schema";
import { GamePhase } from "../configs/enums";
import { GameRoomState, PlayerState } from "./schema/GameRoomState";

import { removeRoom } from "..";
import { easyFruits } from "../utils/Words";

export class GameRoom extends Room<GameRoomState> {
  maxClients = 4;
  public delayedInterval!: Delayed;

  onCreate(options: any) {
    this.setState(new GameRoomState());

    this.onMessage("ready", (client, message) => {
      const player = this.state.players.find(
        (p) => p.sessionId == client.sessionId
      );

      if (player) {
        player.isReady = message.is_ready;
      }
    });

    this.onMessage("load-game", (client, message) => {
      this.state.phase = GamePhase.LOADING;
    });

    this.onMessage("ready-for-game", (client, message) => {
      const player = this.state.players.find(
        (p) => p.sessionId == client.sessionId
      );

      if (player) {
        console.log(player.username, "is ready for game!");
        player.isReadyForGame = message.is_ready;
      }

      // Check if all players are ready
      if (this.state.players.every((p) => p.isReadyForGame)) {
        this.state.phase = GamePhase.INGAME;
        this.broadcast("start-game");

        this.resetRoom();

        const playersCount = this.state.players.length;
        for (let i = 0; i < playersCount; i++) {
          this.state.players[i].currentWord = Math.floor(
            Math.random() * 1000
          ).toString();
          this.state.players[i].startDate = String(new Date());
          this.state.players[i].words = new ArraySchema<string>(...easyFruits);
          this.state.players[i].score = 0;
          this.state.players[i].finishDate = String(new Date());

          const { word, words } = this.generatedWord(this.state.players[i], [
            ...this.state.players[i].words,
          ]);

          this.state.players[i].currentWord = word;
          this.state.players[i].words = new ArraySchema<string>(...words);
        }
      }
    });

    this.onMessage("word-cleared", (client, message) => {
      const player = this.state.players.find(
        (p) => p.sessionId == client.sessionId
      );

      console.log("word-cleared", player?.username, new Date());

      if (player) {
        player.score += 1;
        const { word, words } = this.generatedWord(player, [...player.words]);

        player.currentWord = word;
        player.words = new ArraySchema<string>(...words);
      }

      if (this.checkForEndGame()) {
        this.state.phase = GamePhase.ENDED;

        this.state.players.forEach((p) => {
          p.isFinished = false;
        });
      }
    });

    this.onMessage("word-missed", (client, message) => {
      const player = this.state.players.find(
        (p) => p.sessionId === client.sessionId
      );

      if (player) {
        const { word, words } = this.generatedWord(player, [...player.words]);

        console.log("word-missed", message.word, player.username, new Date());

        player.currentWord = word;
        player.words = new ArraySchema<string>(...words);
      }

      if (this.checkForEndGame()) {
        this.state.phase = GamePhase.ENDED;

        this.state.players.forEach((p) => {
          p.isFinished = false;
        });
      }
    });

    this.setSimulationInterval((deltaTime) => this.update(deltaTime));
  }

  resetRoom() {
    for (let i = 0; i < this.state.players.length; i++) {
      this.state.players[i].isReadyForGame = false;
      this.state.players[i].currentWord = "";
      this.state.players[i].words = new ArraySchema<string>();
      this.state.players[i].score = 0;
      this.state.players[i].startDate = String(new Date());
      this.state.players[i].finishDate = String(new Date());
      this.state.players[i].isFinished = false;
    }
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");

    let newPlayer = new PlayerState().assign({
      sessionId: client.sessionId,
      id: options.id,
      username: options.username,
      email: options.email,
      isReady: this.state.players.length === 0,
      isLeader: this.state.players.length === 0,
    });

    this.state.phase = GamePhase.WAITING;

    this.state.players.push(newPlayer);

    if (this.hasReachedMaxClients()) {
      this.lock();
    }
  }

  update(deltaTime: number) {
    // implement your physics or world updates here!
    // this is a good place to update the room state
  }

  checkForEndGame() {
    const isAllFinished = this.state.players.every((p) => p.isFinished);
    return isAllFinished;
  }

  generatedWord(player: PlayerState, words: string[]) {
    if (words.length === 0) {
      player.finishDate = String(new Date());
      player.isFinished = true;

      console.log(player.username, "finished at", player.finishDate);

      return { word: "", words };
    }

    const randomIndex = Math.floor(Math.random() * words.length);

    const word = words[randomIndex];

    words.splice(randomIndex, 1);

    return { word, words };
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");

    this.state.players = new ArraySchema(
      ...this.state.players.filter((p) => p.sessionId !== client.sessionId)
    );

    console.log("players", this.state.players.length);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");

    removeRoom(this.roomName);
  }
}
