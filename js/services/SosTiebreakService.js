"use strict";
var sosApp = angular.module('sosApp');
sosApp.service('SosTiebreakService', ['$injector', 'ConstantsService', 'LoggerService', 'UtilService', function($injector, ConstantsService, LoggerService, UtilService) {

  /** Delay-loading Stats service so that we avoid any circular dependencies **/
  var _statsService = null;
  function getStatService() {
    if (!_statsService) {
       _statsService = $injector.get('StatsService');
    }
    return _statsService;
  }


  /* Apply all needed tiebreakers for SOS */
  function applysosTiebreakers(eventData, roundCount) {

    if (eventData.mode !== ConstantsService.TOURNAMENT_FORMAT.SOS) {
      // Not an SOS tournament, so skip all of this crazyness!
      return;
    }

    // The algorithms in this service only work when the players are sorted by their scores!
    getStatService().sortPlayersByScore(eventData.players, eventData.mode);

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
  this.applysosTiebreakers = applysosTiebreakers;


  /*
    Look at all games that the given player has played.
    Figure out who that player's lowest-rated opponents are, and drop games from
    those opponents equal to 'count'
  */
  function getWorstPlayerGamesToDrop(eventData, player, count) {
    var droppedGames = [];

    var gamesForPlayer = UtilService.getGamesForPlayer(eventData, player);

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
        var opponentVp = getStatService().getCachedAdjustedVpForPlayer(opponent, eventData);
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


  /*
     Apply all the tie-breakers for a given set of tied players

     NOTE:  THIS only works on a set of tied playesr.
            This IS NOT for processing the entire list of players

  */
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
      console.log("TIEBREAK:    - " + player.name + " SOS: " + player.sos);
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

    }


    // After removing the worst games for people, if players are still tied, check their head-to-head scores!
    if (players.length == 2) {

      console.log("Tie between 2 players remaining after dropping lowest-ranked opponents. Checking for head-to-head tiebreak");
      var headToHeadWinner = getHeadToHeadWinner(eventData, players[0], players[1]);
      if (headToHeadWinner) {

        /*
        console.error(players[0].name + " wins: " + players[0].wins);
        console.error(players[1].name + " wins: " + players[1].wins);
        */

        LoggerService.decision("Tiebreak result: Head-to-head matchup winner between " + players[0].name + "  and " + players[1].name + ": " + headToHeadWinner.name);

        var winner = players[0];
        var loser = players[1];
        if (UtilService.peopleEqual(players[1], headToHeadWinner)) {
          winner = players[1];
          loser = players[0];
        }

        winner.sosTiebreaker += " (win vs " + loser.name + ")";

        // Bump up them up in their correct order
        playersToBumpUp.push(winner);
        playersToBumpUp.push(loser);

        // Just bumped up 2 players (in order). Remove them from the list now
        removePlayersFromList(players, playersToBumpUp);
      }

    } else if (players.length > 0) {
      printFailedTiebreakInfo(players, worstGamesToDropCount);
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

    // Set the sosTiebreakerValue for sorting purposes
    for (i = 0; i < orderedRanking.length; i++) {
      player = orderedRanking[i];
      player.sosTiebreakerValue = (orderedRanking.length - i);
    }

    if (players.length > 0) {
      printFailedTiebreakInfo(players, worstGamesToDropCount);
      for (i = 0; i < players.length; i++) {
        player = players[i];
        player.sosTiebreaker += ": TIED! Coin-Flip Required!";
      }
    } else {
      console.log("TIEBREAK RESOLVED!!");
    }

    // Re-order the tied players in the event data
    reorderPeopleInArray(eventData.players, orderedRanking);
  }


  // This is for debugging purposes only
  function printFailedTiebreakInfo(players, worstGamesToDropCount) {
    var sosTiebreakerValues = "";
    for (var z = 0; z < players.length; z++) {
      sosTiebreakerValues += " " + players[z].sosTiebreaker;
    }
    console.log("TIEBREAK: Failed to break ties after dropping worst opponent game count: " + worstGamesToDropCount + " games.  (players had: " + sosTiebreakerValues + "). Coin-flip required");
  }


  function getHeadToHeadWinner(eventData, player1, player2) {
    var winner = null;

    // See if these 2 players have played
    for (var i = 0; i < eventData.games.length; i++) {
      var game = eventData.games[i];

      if (UtilService.isGameBetweenPlayers(game, player1, player2)) {
        var headToHeadWinner = game.winner;
        if (game.winner == null) {
          // no winner yet. Ignore this game
          continue;
        }

        if (winner == null) {
          // This is the first time the two people have played!
          winner = headToHeadWinner;

        } else if (!UtilService.peopleEqual(winner, headToHeadWinner)) {
          // They've already played, and this time the winner is different!
          LoggerService.decision("Players beat eachother! No Head-to-Head winner between " + player1.name + " and " + player2.name + ".");
          return null;

        }
      }
    }

    if (!winner) {
      LoggerService.log("Players have not played against eachother yet. No head-to-head winner");
      return null;
    }

    LoggerService.decision("Head-to-Head winner between " + player1.name + " and " + player2.name + ": " + winner.name);

    // Get the actual player, not the one from the game!
    if (UtilService.peopleEqual(winner, player1)){
      return player1;
    } else {
      return player2;
    }
  }


  /*
     Given a list of players 'playerList', re-arrange  the players in the
     list 'orderedRanking' so that they show up in the given order in the master list
  */
  function reorderPeopleInArray(playerList, orderedRanking) {
    //console.log("TIEBREAK: reorderPeopleInArray. Player list: " + playerList.length + " orderedRanking: " + orderedRanking.length);

    var i = 0;
    var j = 0;
    var indexesForPlayers = [];
    for (j = 0; j < orderedRanking.length; j++) {
      var orderedPlayer = orderedRanking[j];

      for (i = 0; i < playerList.length; i++) {
          var player = playerList[i];

        if (UtilService.peopleEqual(player, orderedPlayer)) {
          indexesForPlayers.push(i);
          //console.log("Found orderedPlayer: " + orderedPlayer.name + " at player index: " + i);
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

  }


  /*
    Find the given players in the playerList and remove them from the list
    This modifies the list in-place
  */
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

    var tiebreakerSosForPlayer = 0;

    var gamesForPlayer = UtilService.getGamesForPlayer(eventData, player);

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
        if (UtilService.isByePlayer(opponent)) {
          // The Bye player uses VP equal to the number of rounds (due to the 'floor of 1 per rount' rule)
          tiebreakerSosForPlayer += roundCount;
        } else {
          var adjustedVictoryPointsForOpponent = getStatService().getCachedAdjustedVpForPlayer(opponent, eventData);
          tiebreakerSosForPlayer += adjustedVictoryPointsForOpponent;
        }

      }
    }

    return tiebreakerSosForPlayer;
  }

}]);
