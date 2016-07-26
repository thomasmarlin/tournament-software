"use strict";
var sosApp = angular.module('sosApp');
sosApp.service('StatsService', ['LoggerService', 'UtilService', 'ConstantsService', function(LoggerService, UtilService, ConstantsService) {

  var self = this;


  /* SOS Calculations from the SWCCG Tournament Guide:

  9. Strength of Schedule: Strength of Schedule is the recommended scoring method for
     breaking ties at the end of a Swiss tournament that has more than 8 participants.
     The calculation method is as follows:
      •For all of your opponents: Calculate their total victory points, and then
       calculate the total number of games they played. Divide the total VP by the
       total number of games played; this is your Strength of Schedule score.

      •If a player has fewer than .5 victory points per game played, adjust that
       players victory point total so it is equal to .5 VP/GP

      •In the case of two or more players having equal Strength of Schedules,
       drop each player’s lowest opponent until the tie is resolved.

   */

  this.updateSosForPlayer = function(currentPlayer, eventData) {
    LoggerService.log("Updating SOS for player: " + currentPlayer.name + " Number of opponents: " + currentPlayer.opponentsPlayed.length);

    var opponentsVictoryPoints = 0;
    var opponentsGamesPlayed = 0;
    for (var i = 0; i < currentPlayer.opponentsPlayed.length; i++) {
      var opponent = currentPlayer.opponentsPlayed[i];

      LoggerService.calculation("  - analyzing opponent: " + opponent.name);

      for (var j = 0; j < eventData.players.length; j++) {
        var player = eventData.players[j];
        if (UtilService.peopleEqual(player, opponent)) {

          var adjustedVictoryPoints = player.vp;

          // Tournament Guide:
          // "If a player has fewer than .5 victory points per game played, adjust that players victory point total so it is equal to .5 VP/GP"
          var playerVictoryPointToGamePlayedRatio = (player.vp / (player.wins + player.losses));
          if (playerVictoryPointToGamePlayedRatio < 0.5) {

              // Need to make this:  (VP / played) = 0.5
              // VP = 0.5 * played
              adjustedVictoryPoints = 0.5 * (player.wins + player.losses);
              LoggerService.calculation("    ...player has (VP / GP) ratio < 0.5. Updating vp to: " + adjustedVictoryPoints);
          }


          LoggerService.calculation("    ...Adding victory points : " + adjustedVictoryPoints);
          LoggerService.calculation("    ...Adding games played : " + (player.wins + player.losses));
          opponentsVictoryPoints += adjustedVictoryPoints;
          opponentsGamesPlayed += (player.wins + player.losses);
        }
      }
    }

    //LoggerService.log("  - Opponents VP: " + opponentsVictoryPoints);
    //LoggerService.log("  - Opponents GamesPlayed: " + opponentsGamesPlayed);

    var sos = opponentsVictoryPoints / opponentsGamesPlayed;
    if (opponentsGamesPlayed == 0) {
      sos = "";
    }
    LoggerService.calculation("  - Totals: Opponents' VP: " + opponentsVictoryPoints + " Opponents' GP: " + opponentsGamesPlayed + ".  Calculated SOS: " + sos);
    currentPlayer.sos = sos;

  };


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
            var opponent = getOpponentInGame(player, game);
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

    // Update SOS for each player
    for (var i = 0; i < eventData.players.length; i++) {
      var player = eventData.players[i];
      self.updateSosForPlayer(player, eventData);
    }

    perfLog("Before player sorting.");

    sortPlayersByScore(eventData.players, eventData.mode);

    self.stripUnneededData(eventData);

    perfLog("updateVictoryPoints().");
  };



  /**
   * Gets the given player's opponent in a given Game object
   */
  function getOpponentInGame(currentPlayer, game) {
    var opponent = game.playerDark;
    if (UtilService.peopleEqual(currentPlayer, game.playerDark)) {
      opponent = game.playerLight;
    }
    return opponent;
  }


  function buildThinPlayer(player){
    var playerThin = angular.copy(player);
    if (playerThin.opponentsPlayed) {
      delete playerThin.opponentsPlayed;
    }
    return playerThin;
  }

  /**
   * Adds a given opponent to the list of opponents they have played
   */
  function addToOpponentList(currentPlayer, opponent) {
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
  };

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

    var currentVp = -1;
    var playersAtCurrentVp = [];
    for (var i = 0; i < players.length; i++) {
      var player = players[i];
      if ((currentVp == -1) || (player.vp == currentVp)) {
        // First player OR same vp as last player
        currentVp = player.vp;
        playersAtCurrentVp.push(player);
      } else {
        // New set of players

        // First, clear out all of the previous ones
        var shuffled = UtilService.shuffle(playersAtCurrentVp);
        for (var j = 0; j < shuffled.length; j++) {
          var shuffledPlayer = shuffled[j];
          fullShuffledList.push(shuffledPlayer);
        }

        // Next, start a new list which will end when the currentVp changes
        // or we reach the end of our list
        currentVp = player.vp;
        playersAtCurrentVp = [player];
      }
    }

    var shuffled = UtilService.shuffle(playersAtCurrentVp);
    for (var j = 0; j < shuffled.length; j++) {
      var shuffledPlayer = shuffled[j];
      fullShuffledList.push(shuffledPlayer);
    }

    // Remove all players from the original list:
    players.splice(0, players.length);

    // Re-add the shuffled list
    for (var i = 0; i < fullShuffledList.length; i++) {
      var shuffledPlayer = fullShuffledList[i];
      players.push(shuffledPlayer);
    }

  }
  this.shuffleEqualVpPlayers = shuffleEqualVpPlayers;


  this.stripUnneededData = function(eventData) {

    if (eventData.players) {
      for (var i = 0; i < eventData.players.length; i++) {
        var player = eventData.players[i];
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
      for (var i = 0; i < eventData.games.length; i++) {
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
