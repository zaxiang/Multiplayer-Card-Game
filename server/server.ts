import http from "http"
import { Server } from "socket.io"
import { Action, createEmptyGame, doAction, filterCardsForPlayerPerspective, Card, computePlayerCardCounts, Config } from "./model"

const server = http.createServer()
const io = new Server(server)
const port = 8101

let gameState = createEmptyGame(["player1", "player2"], 2, 13)

//added functionality for step6
let gameConfig: Config = {
  numberOfDecks: 2,
  rankLimit: 13,
};

function emitUpdatedCardsForPlayers(cards: Card[], newGame = false) {
  gameState.playerNames.forEach((_, i) => {
    let updatedCardsFromPlayerPerspective = filterCardsForPlayerPerspective(cards, i)
    if (newGame) {
      updatedCardsFromPlayerPerspective = updatedCardsFromPlayerPerspective.filter(card => card.locationType !== "unused")
    }
    console.log("emitting update for player", i, ":", updatedCardsFromPlayerPerspective)
    io.to(String(i)).emit(
      newGame ? "all-cards" : "updated-cards", 
      updatedCardsFromPlayerPerspective,
    )
  })
}

io.on('connection', client => {
  function emitGameState() {
    client.emit(
      "game-state", 
      gameState.playerNames.filter((_, i) => computePlayerCardCounts(gameState)[i] <= 1),
      gameState.currentTurnPlayerIndex,
      gameState.phase,
      gameState.playCount,
    )
  }
  
  console.log("New client")
  let playerIndex: number | null | "all" = null
  client.on('player-index', n => {
    playerIndex = n
    console.log("playerIndex set", n)
    client.join(String(n))
    if (typeof playerIndex === "number") {
      client.emit(
        "all-cards", 
        filterCardsForPlayerPerspective(Object.values(gameState.cardsById), playerIndex).filter(card => card.locationType !== "unused"),
      )
    } else {
      client.emit(
        "all-cards", 
        Object.values(gameState.cardsById),    
      )
    }
    emitGameState()
  })

  client.on("action", (action: Action) => {
    if (typeof playerIndex === "number") {
      const updatedCards = doAction(gameState, { ...action, playerIndex })
      emitUpdatedCardsForPlayers(updatedCards)
    } else {
      // no actions allowed from "all"
    }
    io.to("all").emit(
      "updated-cards", 
      Object.values(gameState.cardsById),    
    )
    io.emit(
      "game-state", 
      gameState.playerNames.filter((_, i) => computePlayerCardCounts(gameState)[i] <= 1),
      gameState.currentTurnPlayerIndex,
      gameState.phase,
      gameState.playCount,
    )
  })

  //added "update the deck and rank limit"
  client.on("new-game", () => {
    console.log("New game event received on the server");
    gameState = createEmptyGame(gameState.playerNames, gameConfig.numberOfDecks, gameConfig.rankLimit)
    const updatedCards = Object.values(gameState.cardsById)
    emitUpdatedCardsForPlayers(updatedCards, true)

    //io.emit("get-config-reply", gameConfig);

    io.to("all").emit(
      "all-cards", 
      updatedCards,
    )
    io.emit(
      "game-state", 
      gameState.playerNames.filter((_, i) => computePlayerCardCounts(gameState)[i] <= 1),
      gameState.currentTurnPlayerIndex,
      gameState.phase,
      gameState.playCount,
    )
  })

  
  //added functionalities for step6 and 7

  client.on("get-config", () => {
    console.log("server side: get-config");
    client.emit("get-config-reply", gameConfig);
    console.log("server side: emit get-config-reply");
  });


  client.on("update-config", (newConfig: Config) => {
    
    console.log("server side: update-config");
    // Perform type and field checks on the new configuration
    const isValidConfig = typeof newConfig === "object"
      && typeof newConfig.numberOfDecks === "number"
      && typeof newConfig.rankLimit === "number";
    // Check for extra fields
    const hasExtraFields = Object.keys(newConfig).length !== 2;

    if (!isValidConfig || hasExtraFields) {
      // Invalid configuration, send update-config-reply with false
      client.emit("update-config-reply", false);
      console.log("server side: false update-config-reply");
    } else {
      // Valid configuration, wait for 2 seconds and send update-config-reply with true
      
      setTimeout(() => {
        gameConfig.numberOfDecks = newConfig.numberOfDecks;
        gameConfig.rankLimit = newConfig.rankLimit;
        
        // Perform actions needed for a new game like the new-game above
        gameState = createEmptyGame(gameState.playerNames, gameConfig.numberOfDecks, gameConfig.rankLimit);
        const updatedCards = Object.values(gameState.cardsById);
        emitUpdatedCardsForPlayers(updatedCards, true);
        io.to("all").emit(
          "all-cards", 
          updatedCards
        )
        io.emit(
          "game-state",
          gameState.playerNames.filter((_, i) => computePlayerCardCounts(gameState)[i] <= 1),
          gameState.currentTurnPlayerIndex,
          gameState.phase,
          gameState.playCount,
        )

        // Send update-config-reply with true
        client.emit("update-config-reply", true);
        console.log("server side: did the emit new game, true update-config-reply");
      }, 2000);
    }
  });

})
server.listen(port)
console.log(`Game server listening on port ${port}`)
