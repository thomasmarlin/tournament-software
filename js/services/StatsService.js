"use strict";
var sosApp = angular.module('sosApp');
sosApp.service('StatsService', ['LoggerService', 'UtilService', 'ConstantsService', function(LoggerService, UtilService, ConstantsService) {

  var self = this;

  /* NEW SOS Calculations - Updated Aug 9, 2016:

  (1) Compute for each player their total Victory Points. If they dropped, give them 1 Victory Point for each game they didn't play.
  (2) Apply a floor of 1 Victory Point for every round (i.e., 1 Victory Point for every two games) to each player, including the bye.
  (3) Each player's Strength Of Schedule score is the sum of all their opponents adjusted Victory Points, including the bye.
  */

  this.updateSosForPlayers = function(eventData) {

    var i = 0;
    var j = 0;
    var k = 0;
    var player = null;

    // First, go through game-by-game and figure out the "adjustedVictoryPoints" for each player
    // **IMPORTANT** ...in the code, a 'round' is really a game...
    for (i = 0; i < eventData.players.length; i++) {
      player = eventData.players[i];
      player.adjustedVictoryPoints = 0;
    }

    //
    // (1) Compute for each player their total Victory Points. If they dropped, give them 1 Victory Point for each game they didn't play.
    //

    for (i = 0; i < eventData.rounds.length; i++) {
      var round = eventData.rounds[i];

      for (j = 0; j < eventData.players.length; j++) {
        player = eventData.players[j];
        var playedAGame = false;

        for (k = 0; k < eventData.games.length; k++) {
          var game = eventData.games[k];
          if (game.round.num == round.num) {
            if (UtilService.peopleEqual(player, game.playerDark) || UtilService.peopleEqual(player, game.playerLight)) {

              // Played a game!
              playedAGame = true;

              if (game.winner) {
                if (game.winner.id == player.id) {
                  player.adjustedVictoryPoints += 2;
                }
              }
            }
          }
        }

        if (!playedAGame) {
          // This player must have dropped!  We give them 1 VP/game that they didn't play
          LoggerService.calculation("Player: " + player.name + " must have dropped. Applying single adjusted victory point.");
          player.adjustedVictoryPoints += 1;
        }
      }
    }


    //
    // (2) Apply a floor of 1 Victory Point for every round (i.e., 1 Victory Point for every two games) to each player, including the bye.
    //

    var roundCount = Math.floor(eventData.rounds.length / 2);  // Again..our 'rounds' in the software are actually games, so divide by 2
    for (i = 0; i < eventData.players.length; i++) {
      player = eventData.players[i];

      if (player.adjustedVictoryPoints < roundCount) {
        LoggerService.calculation("Player: " + player.name + " didn't do well. Setting 'adjustedVictoryPoints' to " + roundCount);
        player.adjustedVictoryPoints = roundCount;
      }
    }


    LoggerService.calculation("--- Printing Adjusted Victory Points ---");
    for (i = 0; i < eventData.players.length; i++) {
      player = eventData.players[i];
      LoggerService.calculation("Adjusted Victory Points for: " + player.name + ": " + player.adjustedVictoryPoints);
    }


    //
    // (3) Each player's Strength Of Schedule score is the sum of all their opponents adjusted Victory Points, including the bye.
    //

    for (i = 0; i < eventData.players.length; i++) {
      player = eventData.players[i];
      player.sos = 0;

      LoggerService.calculation("Calculating SOS for player: " + player.name);
      for (j = 0; j < player.opponentsPlayed.length; j++) {
        var opponent = player.opponentsPlayed[j];


        if (isByePlayer(opponent)) {
          // The Bye player uses VP equal to the number of rounds (due to the 'floor of 1 per rount' rule)
          player.sos += roundCount;
        } else {
          var adjustedVictoryPointsForOpponent = getCachedAdjustedVpForPlayer(opponent, eventData);
          LoggerService.calculation("  - Opponent '" + opponent.name + "' adjustedVictoryPoints: " + adjustedVictoryPointsForOpponent);

          player.sos += adjustedVictoryPointsForOpponent;
        }
      }
      player.sosTiebreaker = player.sos;
    }


    console.log("TIEBREAK: PlayerListBEFORE: " + eventData.players.length);

    applysosTiebreakers(eventData, roundCount);

    console.log("TIEBREAK: PlayerListAfter: " + eventData.players.length);
  };


  function applysosTiebreakers(eventData, roundCount) {
    sortPlayersByScore(eventData.players, eventData.mode);

    var lastVp = 100000000;
    var lastSos = 100000000;
    var tiedPlayers = [];

    for (var i = 0; i < eventData.players.length; i++) {
      var player = eventData.players[i];

      if ((player.vp === lastVp) && (player.sos === lastSos)) {
        tiedPlayers.push(player);
      } else {

        // Different VP than the previous group.  Fix the tied players
        applysosTiebreakersForPlayers(eventData, tiedPlayers, roundCount);

        // Reset the tie-data
        lastVp = player.vp;
        lastSos = player.sos;
        tiedPlayers = [player];
      }
    }
  }


  function getGamesForPlayer(eventData, player) {
    var games = [];
    for (var i = 0; i < eventData.games.length; i++) {
      var game = eventData.games[i];
      if (UtilService.isPlayerInGame(player, game)) {
        games.push(game);
      }
    }
    return games;
  }


  function getWorstPlayerGamesToDrop(eventData, player, count) {
    var droppedGames = [];

    var gamesForPlayer = getGamesForPlayer(eventData, player);

    var gameDropped = true;
    // Loop until we failed to drop a game OR we have already dropped enough games
    while (gameDropped && droppedGames.length < count) {
      gameDropped = false;

      // Find game with opponent who has worst VP
      var gameToDrop = null;
      var worstOpponentVP = 9999999;

      for (var i = 0; i < gamesForPlayer.length; i++) {
        var game = gamesForPlayer[i];

        // Make sure we haven't already dropped this game
        if (-1 !== droppedGames.indexOf(game)) {
          continue;
        }

        var opponent = UtilService.getOpponent(player, game);
        var opponentVp = getCachedAdjustedVpForPlayer(opponent, eventData);
        if (opponentVp < worstOpponentVP) {
          worstOpponentVP = opponentVp;
          gameToDrop = game;
        }
      }

      if (gameToDrop) {
        droppedGames.push(gameToDrop);
        gameDropped = true;
      }

    }

    // OK, now we have the list of games to drop
    return droppedGames;

  }

  function applysosTiebreakersForPlayers(eventData, players, roundCount) {
    if (players.length < 2) {
      return;
    }

    var i = 0;
    var j = 0;
    var player = null;


    console.log("TIEBREAK:  The following players are currently tied: ");
    for (i = 0; i < players.length; i++) {
      player = players[i];
      console.log("TIEBREAK:    - " + player.name);
    }
    console.log("TIEBREAK: Trying to resolve ties...");

    var playersToBumpUp = [];
    var playersToDropDown = [];

    var worstGamesToDropCount = 0;
    while (players.length > 0 && (worstGamesToDropCount <= eventData.rounds.length)) {
      worstGamesToDropCount++;

      for (i = 0; i < players.length; i++) {
        player = players[i];
        var gamesToDrop = getWorstPlayerGamesToDrop(eventData, player, worstGamesToDropCount);
        player.sosTiebreaker = calculateTiebreakSosForPlayer(player, eventData, gamesToDrop, roundCount);
        console.log("New sosTiebreaker for player: " + player.name + ": " + player.sosTiebreaker);
      }

      // See if a player has broken free of the tie!

      // First, see if a player has a higher adjusted total than everyone else
      for (i = 0; i < players.length; i++) {
        var playerLookingAt = players[i];
        var playerIsHighest = true;
        var playerIsLowest = true;

        for (j = 0; j < players.length; j++) {
          var otherPlayer = players[j];
          if (UtilService.peopleEqual(playerLookingAt, otherPlayer)) {
            // Don't compare with self ;-)
            continue;
          }
            if (otherPlayer.sosTiebreaker >= playerLookingAt.sosTiebreaker) {
            playerIsHighest = false;
          }
          if (otherPlayer.sosTiebreaker <= playerLookingAt.sosTiebreaker) {
            playerIsLowest = false;
          }
        }

        if (playerIsHighest) {
          playersToBumpUp.push(playerLookingAt);
          console.log("TIEBREAK: BUMPED UP player: " + playerLookingAt.name);
        }
        if (playerIsLowest) {
          // Add the player to the beginning of the playersToDropDown list
          playersToDropDown.unshift(playerLookingAt);
          console.log("TIEBREAK: BUMPED DOWN player: " + playerLookingAt.name);
        }
      }

      // Remove all players which we have bumped up or down
      removePlayersFromList(players, playersToBumpUp);
      removePlayersFromList(players, playersToDropDown);

      if (players.length > 0) {
        var sosTiebreakerValues = "";
        for (var z = 0; z < players.length; z++) {
          sosTiebreakerValues += " " + players[z].sosTiebreaker;
        }
        console.log("TIEBREAK: Failed to break ties after dropping worst opponent game count: " + worstGamesToDropCount + " games.  (players had: " + sosTiebreakerValues + "). Coin-flip required");
      }
    }

    // At the end, re-assemble our list of players
    var orderedRanking = [];

    // Players that we know did better
    for (i = 0; i < playersToBumpUp.length; i++) {
      player = playersToBumpUp[i];
      orderedRanking.push(player);
    }

    // Players who are still tied
    for (i = 0; i < players.length; i++) {
      player = players[i];
      orderedRanking.push(player);
    }

    // Players who did worse
    for (i = 0; i < playersToDropDown.length; i++) {
      player = playersToDropDown[i];
      orderedRanking.push(player);
    }

    if (players.length > 0) {
      var sosTiebreakerValues = "";
      for (var z = 0; z < players.length; z++) {
        sosTiebreakerValues += " " + players[z].sosTiebreaker;
      }
      console.log("TIEBREAK: Failed to break ties by removing lowest-rated games (players had: " + sosTiebreakerValues + "). Coin-flip required");
    } else {
      console.log("TIEBREAK RESOLVED!!");
    }

    // Re-order the tied players in the event data
    reorderPeopleInArray(eventData.players, orderedRanking);
  }


  function reorderPeopleInArray(playerList, orderedRanking) {
    console.log("TIEBREAK: reorderPeopleInArray. Player list: " + playerList.length + " orderedRanking: " + orderedRanking.length);
    var i = 0;
    var j = 0;
    var indexesForPlayers = [];
    for (j = 0; j < orderedRanking.length; j++) {
      var orderedPlayer = orderedRanking[j];

      for (i = 0; i < playerList.length; i++) {
          var player = playerList[i];

        if (UtilService.peopleEqual(player, orderedPlayer)) {
          indexesForPlayers.push(i);
          console.log("Found orderedPlayer: " + orderedPlayer.name + " at player index: " + i);
          break;
        }
      }

    }

    // Now, put those players back in the given slots
    if (orderedRanking.length !== indexesForPlayers.length) {
      console.error("Error! TIEBREAK:  Players not found in master player list!!!");
      console.log("TIEBREAK: orderedRanking.length: " + orderedRanking.length);
      console.log("TIEBREAK: indexesForPlayers.length: " + indexesForPlayers.length);
      return;
    }

    // Move the players into their correct spots!
    for (i = 0; i < orderedRanking.length; i++) {
      var indexForPlayer = indexesForPlayers[i];
      playerList[indexForPlayer] = orderedRanking[i];
    }

    console.log("TIEBREAK: reorderPeopleInArrayAFTER. Player list: " + playerList.length + " orderedRanking: " + orderedRanking.length);

  }

  function removePlayersFromList(playerList, playersToRemove) {

    var playerRemoved = true;

    // Keep looping until we don't need to remove anyone anymore
    while (playerRemoved) {
      playerRemoved = false;

      for (var i = 0; i < playerList.length; i++) {
        var player = playerList[i];
        var shouldKeep = true;

        for (var j = 0; j < playersToRemove.length; j++) {
          var playerToRemove = playersToRemove[j];
          if (UtilService.peopleEqual(playerToRemove, player)) {
            shouldKeep = false;
          }
        }

        if (!shouldKeep) {
          playerList.splice(i, 1);
          playerRemoved = true;
          break;
        }
      }
    }
  }

  function calculateTiebreakSosForPlayer(player, eventData, gamesToDrop, roundCount) {

    console.log("TIEBREAK: gamesToDrop.length " + gamesToDrop.length);
    console.log("TIEBREAK: gamesToDrop " + JSON.stringify(gamesToDrop));

    var tiebreakerSosForPlayer = 0;

    var gamesForPlayer = getGamesForPlayer(eventData, player);

    for (var i = 0; i < gamesForPlayer.length; i++) {
      var game = gamesForPlayer[i];
      var useGame = true;

      for (var j = 0; j < gamesToDrop.length; j++) {
        var gameToDrop = gamesToDrop[j];

        if (UtilService.gamesEqual(game, gameToDrop)) {
          // Ignoring game...
          console.log("TIEBREAK: for player: " + player.name + " ignoring game-to-drop against " + UtilService.getOpponent(player, gameToDrop).name);
          useGame = false;
        }
      }

      if (useGame) {
        var opponent = UtilService.getOpponent(player, game)
        if (isByePlayer(opponent)) {
          // The Bye player uses VP equal to the number of rounds (due to the 'floor of 1 per rount' rule)
          tiebreakerSosForPlayer += roundCount;
        } else {
          var adjustedVictoryPointsForOpponent = getCachedAdjustedVpForPlayer(opponent, eventData);
          tiebreakerSosForPlayer += adjustedVictoryPointsForOpponent;
        }

      }
    }

    return tiebreakerSosForPlayer;
  }


  function perfLog(str) {
    var d = new Date();
    var n = d.getTime();
    console.log("" + n + str);
  }


  /**
   * Updates all of the Victory Points, SOS, and DIFF totals for all users
   */
  this.updateVictoryPoints = function(eventData) {

    perfLog("updateVictoryPoints()...");

    for (var i = 0; i < eventData.players.length; i++){
      var player = eventData.players[i];
      player.wins = 0;
      player.losses = 0;
      player.vp = 0;
      player.opponentsPlayed = [];
      player.diff = 0;

      for (var j = 0; j < eventData.games.length; j++) {
        var game = eventData.games[j];

        // Only look at the game if someone one (not in-progress games)
        if (game.winner) {

          // See if the current player played in this game
          if (UtilService.peopleEqual(player, game.playerDark) || UtilService.peopleEqual(player, game.playerLight)) {

            // Add to list of opponents (if not in the list already)
            var opponent = UtilService.getOpponent(player, game);
            addToOpponentList(player, opponent);

            // Get winner & victory points
            if (UtilService.peopleEqual(player, game.winner)) {
              player.vp += game.vp;
              player.wins += 1;
              player.diff += parseInt(game.diff);
            } else {
              player.losses += 1;
              player.diff -= parseInt(game.diff);
            }
          }
        } else {
          LoggerService.calculation("Game doesn't have a winner!");
        }
      }

      LoggerService.calculation("Victory Points for Player: " + player.name + " : " + player.vp);
    }

    // Update SOS for each player (this requires the VP be in place from the above!)
    self.updateSosForPlayers(eventData);

    perfLog("Before player sorting.");

    sortPlayersByScore(eventData.players, eventData.mode);

    self.stripUnneededData(eventData);

    perfLog("updateVictoryPoints().");
  };



  function buildThinPlayer(player){
    var playerThin = angular.copy(player);
    if (playerThin.opponentsPlayed) {
      delete playerThin.opponentsPlayed;
    }
    return playerThin;
  }

  function getCachedAdjustedVpForPlayer(player, eventData) {
    if (isByePlayer(player)) {
      return Math.floor(eventData.rounds.length / 2);
    }

    for (var i = 0; i < eventData.players.length; i++) {
      var existingPlayer = eventData.players[i];
      if (UtilService.peopleEqual(existingPlayer, player)) {
        return existingPlayer.adjustedVictoryPoints;
      }
    }
    LoggerService.error("Error finding player: " + player.name);
    return 99999;
  }
  this.getCachedAdjustedVpForPlayer = getCachedAdjustedVpForPlayer;

  function getCachedVpForPlayer(player, eventData) {
    if (isByePlayer(player)) {
      return 0;
    }

    for (var i = 0; i < eventData.players.length; i++) {
      var existingPlayer = eventData.players[i];
      if (UtilService.peopleEqual(existingPlayer, player)) {
        return existingPlayer.vp;
      }
    }
    LoggerService.error("Error finding player: " + player.name);
    return 99999;
  }
  this.getCachedVpForPlayer = getCachedVpForPlayer;

  /**
   * Adds a given opponent to the list of opponents they have played
   */
  function addToOpponentList(currentPlayer, opponent) {
    /*
    var opponentAdded = false;
    for (var i = 0; i < currentPlayer.opponentsPlayed.length; i++) {
      var op = currentPlayer.opponentsPlayed[i];
      if (UtilService.peopleEqual(op, opponent)) {
        opponentAdded = true;
      }
    }

    // Add opponent's played (but without the duplicate opponentsPlayed...otherwise these get exponentially large)
    if (!opponentAdded) {
      var opponentThin = buildThinPlayer(opponent);
      currentPlayer.opponentsPlayed.push(opponentThin);
    }
    */
    var opponentThin = buildThinPlayer(opponent);
    currentPlayer.opponentsPlayed.push(opponentThin);
  }

  function getSortFunc(tournamentMode) {
    if (tournamentMode == ConstantsService.TOURNAMENT_FORMAT.SOS) {
      return personSortSosFunc;
    } else {
      return personSortDiffFunc;
    }
  }
  this.getSortFunc = getSortFunc;


  function personSortSosFunc(playerA, playerB) {
    if (playerA.vp > playerB.vp) {
      return -1;
    } else if (playerA.vp < playerB.vp) {
      return 1;
    } else {
      if (playerA.sos > playerB.sos) {
        return -1;
      } else if (playerA.sos < playerB.sos) {
        return 1;
      } else {
        return 0;
      }
    }
  }


  function personSortDiffFunc(playerA, playerB) {
    if (playerA.vp > playerB.vp) {
      return -1;
    } else if (playerA.vp < playerB.vp) {
      return 1;
    } else {
      if (parseInt(playerA.diff) > parseInt(playerB.diff)) {
        return -1;
      } else if (parseInt(playerA.diff) < parseInt(playerB.diff)) {
        return 1;
      } else {
        return 0;
      }
    }
  }

  function sortPlayersByScore(players, tournamentMode) {
    var personSortFunc = getSortFunc(tournamentMode);

    players.sort(personSortFunc);
    LoggerService.decision("Sorting players by score...");
    for (var i = 0; i < players.length; i++) {
      LoggerService.decision("  " + i + ". " + UtilService.playerSummaryString(players[i]));
    }
  }
  this.sortPlayersByScore = sortPlayersByScore;


  function isByePlayer(player) {
    return player && (player.name === "BYE");
  }


  function shuffleEqualVpPlayers(players) {

    var fullShuffledList = [];
    var shuffled = [];
    var shuffledPlayer = null;
    var i = 0;
    var j = 0;

    var currentVp = -1;
    var playersAtCurrentVp = [];
    for (i = 0; i < players.length; i++) {
      var player = players[i];
      if ((currentVp == -1) || (player.vp == currentVp)) {
        // First player OR same vp as last player
        currentVp = player.vp;
        playersAtCurrentVp.push(player);
      } else {
        // New set of players

        // First, clear out all of the previous ones
        shuffled = UtilService.shuffle(playersAtCurrentVp);
        for (j = 0; j < shuffled.length; j++) {
          shuffledPlayer = shuffled[j];
          fullShuffledList.push(shuffledPlayer);
        }

        // Next, start a new list which will end when the currentVp changes
        // or we reach the end of our list
        currentVp = player.vp;
        playersAtCurrentVp = [player];
      }
    }

    shuffled = UtilService.shuffle(playersAtCurrentVp);

    for (j = 0; j < shuffled.length; j++) {
      shuffledPlayer = shuffled[j];
      fullShuffledList.push(shuffledPlayer);
    }

    // Remove all players from the original list:
    players.splice(0, players.length);

    // Re-add the shuffled list
    for (i = 0; i < fullShuffledList.length; i++) {
      shuffledPlayer = fullShuffledList[i];
      players.push(shuffledPlayer);
    }

  }
  this.shuffleEqualVpPlayers = shuffleEqualVpPlayers;


  this.stripUnneededData = function(eventData) {
    var i = 0;

    if (eventData.players) {
      for (i = 0; i < eventData.players.length; i++) {
        var player = eventData.players[i]; //jshint ignore:line
        /*
        delete player.diff;
        delete player.sos;
        delete player.opponentsPlayed;
        delete player.wins;
        delete player.losses;
        */
      }
    }

    if (eventData.games) {
      for (i = 0; i < eventData.games.length; i++) {
        var game = eventData.games[i];
        if (game.playerDark) {
          game.playerDark = {
            id: game.playerDark.id,
            name: game.playerDark.name
          }
        }
        if (game.playerLight) {
          game.playerLight = {
            id: game.playerLight.id,
            name: game.playerLight.name
          }
        }
        if (game.winner) {
          game.winner = {
            id: game.winner.id,
            name: game.winner.name
          }
        }
      }
    }
  };

}]);
