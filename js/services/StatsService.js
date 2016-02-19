"use strict";
var sosApp = angular.module('sosApp');
sosApp.service('StatsService', ['LoggerService', 'UtilService', function(LoggerService, UtilService) {

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



  /**
   * Updates all of the Victory Points, SOS, and DIFF totals for all users
   */
  this.updateVictoryPoints = function(eventData) {
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

    if (!opponentAdded) {
      currentPlayer.opponentsPlayed.push(opponent);
    }
  }


}]);
