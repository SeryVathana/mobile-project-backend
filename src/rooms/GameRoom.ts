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
      const player = this.state.players.find((p) => p.sessionId == client.sessionId);

      if (player) {
        player.isReady = message.is_ready;
      }
    });

    this.onMessage("load-game", (client, message) => {
      this.state.phase = GamePhase.LOADING;
    });

    this.onMessage("ready-for-game", (client, message) => {
      const player = this.state.players.find((p) => p.sessionId == client.sessionId);

      if (player) {
        player.isReadyForGame = message.is_ready;
      }

      // Check if all players are ready
      if (this.state.players.every((p) => p.isReadyForGame)) {
        this.state.phase = GamePhase.INGAME;
        this.broadcast("start-game");

        this.resetRoom();

        const playersCount = this.state.players.length;
        for (let i = 0; i < playersCount; i++) {
          this.state.players[i].currentWord = Math.floor(Math.random() * 1000).toString();
          this.state.players[i].startDate = String(new Date());
          this.state.players[i].words = new ArraySchema<string>(...easyFruits);
          this.state.players[i].score = 0;
          this.state.players[i].finishDate = String(new Date());

          const { word, words } = this.generatedWord(this.state.players[i], [...this.state.players[i].words]);

          this.state.players[i].currentWord = word;
          this.state.players[i].words = new ArraySchema<string>(...words);
        }
      }
    });

    this.onMessage("word-cleared", (client, message) => {
      const player = this.state.players.find((p) => p.sessionId == client.sessionId);

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
      const player = this.state.players.find((p) => p.sessionId === client.sessionId);

      if (player && !player.isWordMissed) {
        player.isWordMissed = true; // Set the flag to prevent duplicate misses
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

      return { word: "", words };
    }

    const randomIndex = Math.floor(Math.random() * words.length);

    const word = words[randomIndex];

    words.splice(randomIndex, 1);

    return { word, words };
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");

    this.state.players = new ArraySchema(...this.state.players.filter((p) => p.sessionId !== client.sessionId));

    console.log("players", this.state.players.length);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");

    removeRoom(this.roomName);
  }

  // handleReadyMsg(client: Client, message: any) {
  //   let player = this.state.players.find((p) => p.sessionId == client.sessionId);
  //   console.log(client.sessionId, "is ready!");

  //   if (player) {
  //     player.isReady = true;
  //   }

  //   const maxWindSpeed = 10;
  //   const minWindSpeed = 1;

  //   this.state.wind = new WindState();
  //   this.state.wind.dir = Math.random() < 0.5 ? 1 : -1;
  //   this.state.wind.speed = Math.floor(Math.random() * (maxWindSpeed - minWindSpeed + 1) + minWindSpeed);

  //   if (this.state.players.every((p) => p.isReady)) {
  //     this.state.players.forEach((pl) => {
  //       try {
  //         PlayFab.PlayFabServer.UpdatePlayerStatistics(
  //           {
  //             PlayFabId: pl.playFabId,
  //             Statistics: [
  //               { StatisticName: "All_Matches", Value: 1 },
  //               { StatisticName: "Weekly_Matches", Value: 1 },
  //               { StatisticName: "Monthly_Matches", Value: 1 },
  //             ],
  //           },
  //           (error, result) => {
  //             if (error) {
  //               console.log("UpdatePlayerStatistics error", error);
  //             }
  //           }
  //         );
  //       } catch (e) {
  //         console.log("Error", e);
  //       }
  //     });

  //     this.resetPlayer();

  //     const ranCharacter = Math.random() < 0.5 ? 0 : 1;

  //     this.broadcast("start-game");

  //     setTimeout(() => {
  //       this.state.phase = GamePhase.INGAME;
  //       this.switchTurn(ranCharacter);
  //     }, 1000);
  //   }
  // }

  //   handleSwitchTurnMsg(client: Client, message: any) {
  //     console.log("switch-turn from " + client.sessionId);
  //     setTimeout(() => {
  //       this._isShooting = false;
  //       this.switchTurn(1 - this.state.curTurn);
  //     }, 2000);
  //   }

  //   handleUseAbilityMsg(client: Client, message: any) {
  //     if (this.state.curTurn !== this.state.players.findIndex((p) => p.sessionId == client.sessionId)) {
  //       return;
  //     }

  //     let player = this.state.players.find((p) => p.sessionId == client.sessionId);

  //     if (player) {
  //       player.activatedAbility = message.ability;

  //       const filteredAbilities = new ArraySchema<number>(...player.abilities.filter((a: number) => a != message.ability));
  //       player.abilities = filteredAbilities;
  //     }

  //     this.broadcast("use-ability", { sessionId: client.sessionId, ability: player.activatedAbility }, { except: client });
  //   }

  //   handleHitMsg(client: Client, message: any) {
  //     let shooter = this.state.players[this.state.curTurn];
  //     let target = this.state.players[1 - this.state.curTurn];

  //     let afterCollided = message.afterCollided * 10 || 0;
  //     let colliderTags = message.colliderTags || [];

  //     let isHeadShot =
  //       colliderTags.findIndex((tag: number) => tag == 10) != -1 &&
  //       colliderTags.findIndex((tag: number) => tag == 10) > colliderTags.findIndex((tag: number) => tag == 2);

  //     const damageRatio = Math.pow(1 / 2, afterCollided);
  //     let damage = 0;

  //     if (isHeadShot) {
  //       damage = this.state.projectileDamage;
  //     } else {
  //       damage = Math.floor(this.state.projectileDamage * damageRatio);
  //     }

  //     target.health -= damage;

  //     console.log("damage", damage, "health", target.health);

  //     this.broadcast("update-health", { target: target.sessionId, health: target.health, isHit: true });
  //     this.broadcast("hit", { target: target.sessionId, damage: Math.floor(damage), isHeadShot });

  //     if (target.health <= 0) {
  //       this.state.winner = shooter.sessionId;
  //       this.state.phase = GamePhase.ENDED;
  //       this.broadcast("game-over", { winner: this.state.winner });

  //       const loser = this.state.players.find((p) => p.sessionId == target.sessionId);
  //       const winner = this.state.players.find((p) => p.sessionId == shooter.sessionId);

  //       this.handleSubstractLoserLife(loser.playFabId);
  //       this.handleUpdateWinnerStats(winner.playFabId);

  //       return;
  //     }

  //     if (shooter.activatedAbility != PlayerAbility.None) {
  //       if (shooter.activatedAbility == PlayerAbility.Heal) {
  //         shooter.health += this.state.projectileDamage;
  //         this.broadcast("update-health", { target: shooter.sessionId, health: shooter.health, isHit: false });
  //       } else if (shooter.activatedAbility == PlayerAbility.Double) {
  //         setTimeout(() => {
  //           this.broadcast("reshoot", { shooter: shooter.sessionId });
  //           this.broadcast("use-ability", { sessionId: shooter.sessionId, ability: PlayerAbility.None });
  //           shooter.activatedAbility = PlayerAbility.None;
  //         }, 500);
  //         return;
  //       }
  //     }
  //   }

  //   handleReplayMsg(client: Client, message: any) {
  //     let player = this.state.players.find((p) => p.sessionId == client.sessionId);

  //     if (player) {
  //       player.isWantToReplay = true;
  //     }

  //     if (this.state.players.every((p) => p.isWantToReplay)) {
  //       this.state.players.forEach((player) => {
  //         PlayFabServer.UpdatePlayerStatistics(
  //           {
  //             PlayFabId: player.playFabId,
  //             Statistics: [
  //               { StatisticName: "All_Matches", Value: 1 },
  //               { StatisticName: "Weekly_Matches", Value: 1 },
  //               { StatisticName: "Monthly_Matches", Value: 1 },
  //             ],
  //           },
  //           (error, result) => {
  //             if (error) {
  //               console.log("UpdatePlayerStatistics error", error);
  //             }
  //           }
  //         );
  //       });

  //       this.resetPlayer();

  //       this.broadcast("start-game");

  //       const ranCharacter = Math.random() < 0.5 ? 0 : 1;
  //       setTimeout(() => {
  //         this.state.phase = GamePhase.INGAME;
  //         this._isShooting = false;
  //         this.switchTurn(ranCharacter);
  //       }, 2000);
  //     }
  //   }

  //   handleShootMsg(client: Client, message: any) {
  //     if (this.state.curTurn !== this.state.players.findIndex((p) => p.sessionId == client.sessionId)) {
  //       return;
  //     }

  //     let player = this.state.players.find((p) => p.sessionId == client.sessionId);

  //     if (player) {
  //       this._isShooting = true;
  //       this.broadcast(
  //         "shoot",
  //         {
  //           sessionId: client.sessionId,
  //           x: message.x,
  //           y: message.y,
  //           dirX: message.dirX,
  //           dirY: message.dirY,
  //           speed: message.speed,
  //         },
  //         { except: client }
  //       );

  //       // Stop the existing timeout when a player shoots
  //       if (this.delayedInterval) {
  //         this.delayedInterval.clear();
  //         this.delayedInterval = null;
  //       }

  //       if (this.timerTimeout) {
  //         this.timerTimeout.clear();
  //         this.timerTimeout = null;
  //       }

  //       // // Prevent stuck in shooting state forever
  //       // if (this.afterShootTimeout) {
  //       //   this.afterShootTimeout.clear();
  //       //   this.afterShootTimeout = null;
  //       // }

  //       // this._afterShooting = 0;
  //       // this.afterShootTimeout = this.clock.setInterval(() => {
  //       //   this._afterShooting += 1;

  //       //   if (this._isSwitching) {
  //       //     this.afterShootTimeout.clear();
  //       //     return;
  //       //   }

  //       //   if (this._afterShooting >= 10) {
  //       //     this._isShooting = false;
  //       //     this.switchTurn(1 - this.state.curTurn);
  //       //   }
  //       // }, 1000);
  //     }
  //   }

  //   handleOwnerHitMsg(client: Client, message: any) {
  //     let player = this.state.players.find((p) => p.sessionId != client.sessionId);
  //     let otherPlayer = this.state.players.find((p) => p.sessionId == client.sessionId);

  //     if (player) {
  //       player.health -= this.state.projectileDamage / 2;
  //       this.broadcast("update-health", { target: player.sessionId, health: player.health, isHit: false });
  //       if (player.health <= 0) {
  //         this.state.winner = otherPlayer.sessionId;
  //         this.state.phase = GamePhase.ENDED;
  //         this.broadcast("game-over", { winner: this.state.winner });

  //         const loser = this.state.players.find((p) => p.sessionId == player.sessionId);
  //         const winner = this.state.players.find((p) => p.sessionId == otherPlayer.sessionId);

  //         this.handleSubstractLoserLife(loser.playFabId);
  //         this.handleUpdateWinnerStats(winner.playFabId);

  //         return;
  //       }
  //     }
  //   }

  //   switchTurn(index: number) {
  //     if (this.state.phase === GamePhase.ENDED || this._isShooting) {
  //       return;
  //     }

  //     // Clear any existing timeout
  //     if (this.delayedInterval) {
  //       this.delayedInterval.clear();
  //     }

  //     if (this.timerTimeout) {
  //       this.timerTimeout.clear();
  //     }

  //     this.state.curTurn = index;
  //     this.state.secondsLeft = 11;

  //     this.state.players.forEach((player) => {
  //       player.activatedAbility = PlayerAbility.None;
  //     });

  //     const maxWindSpeed = 10;
  //     const minWindSpeed = 1;

  //     this.state.wind = new WindState();
  //     this.state.wind.dir = Math.random() < 0.5 ? 1 : -1;
  //     this.state.wind.speed = Math.floor(Math.random() * (maxWindSpeed - minWindSpeed + 1) + minWindSpeed);

  //     this.broadcast("switch-turn", { index, activeOwner: Math.random() < 0.3 ? true : false });

  //     this.delayedInterval = this.clock.setInterval(() => {
  //       this.state.secondsLeft -= 1;
  //     }, 1000);

  //     // Set a new timeout
  //     this.timerTimeout = this.clock.setTimeout(() => {
  //       this._isShooting = false;
  //       this.switchTurn(1 - this.state.curTurn);
  //     }, 12000);
  //   }

  //   resetPlayer() {
  //     this.state.players.forEach((player) => {
  //       player.health = 100;
  //       player.isReady = false;
  //       player.activatedAbility = -1;
  //       player.isWantToReplay = false;
  //       player.abilities = new ArraySchema<number>(PlayerAbility.Heal, PlayerAbility.Double, PlayerAbility.Increase);
  //     });
  //   }
}
