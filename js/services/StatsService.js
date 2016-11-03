"use strict";
var sosApp = angular.module('sosApp');
sosApp.service('StatsService', ['ConstantsService', 'LoggerService', 'SosTiebreakService', 'UtilService', function(ConstantsService, LoggerService, SosTiebreakService, UtilService) {

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


        if (UtilService.isByePlayer(opponent)) {
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

    SosTiebreakService.applysosTiebreakers(eventData, roundCount);
  };


  function perfLog(str) {
    var d = new Date();
    var n = d.getTime();
    console.log("" + n + ": " + str);
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
    if (UtilService.isByePlayer(player)) {
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
    if (UtilService.isByePlayer(player)) {
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

    // Primary Sort:  VP
    if (playerA.vp > playerB.vp) {
      return -1;
    } else if (playerA.vp < playerB.vp) {
      return 1;
    } else {

      // Secondary Sort:  SOS
      if (playerA.sos > playerB.sos) {
        return -1;
      } else if (playerA.sos < playerB.sos) {
        return 1;
      } else if (playerA.sos == playerB.sos) {

        // Tertiary Sort: sosTiebreaker
        if (playerA.sosTiebreakerValue > playerB.sosTiebreakerValue) {
          return -1;
        } else if (playerA.sosTiebreakerValue < playerB.sosTiebreakerValue) {
          return 1;
        } else {
          return 0;
        }

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
