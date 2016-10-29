"use strict";
var sosApp = angular.module('sosApp');
sosApp.service('UtilService', [function() {

  var self = this;

  // Fisher-Yates (aka Knuth) Shuffle
  // http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
  this.shuffle = function(array) {
    if (array.length === 0) {
      return array;
    }

    var currentIndex = array.length, temporaryValue, randomIndex ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  };

  this.playerSummaryString = function(player) {
    return player.name + "  (VP: " + player.vp + " SoS: " + player.sos + " Diff: " + player.diff + ")";
  }


  function peopleEqual(p1, p2) {
    if ((p1 == null) && (p2 == null)) {
      return true;
    } else if (p1 == null) {
      return false;
    } else if (p2 == null) {
      return false;
    } else if (p1.id == p2.id) {
      return true;
    } else {
      return false;
    }
  }
  this.peopleEqual = peopleEqual;


  this.isPairDown = function(playerDark, playerLight) {
    if (playerDark.vp != playerLight.vp) {
      return true;
    }
    return false;
  };


  this.gamesEqual = function(game1, game2) {
    if ((game1.roundNumber == game2.roundNumber) &&
        peopleEqual(game1.playerDark, game2.playerDark) &&
        peopleEqual(game1.playerLight, game2.playerLight))
    {
      return true;
    } else {
      return false;
    }
  }


  this.getCurrentRound = function(eventData) {
    if (eventData.rounds.length === 0) {
      return {
        num: 0
      };
    }
    return eventData.rounds[eventData.rounds.length-1];
  }

  this.getCurrentRoundNumber = function(eventData) {
    return self.getCurrentRound(eventData).num;
  }

  this.getRoundNum = function(num, eventData) {
    for (var i = 0; i < eventData.rounds.length; i++) {
      var round = eventData.rounds[i];
      if (round.num == num) {
        return round;
      }
    }

    console.log("Failed to get round: " + num);
    return null;
  }

  this.generateGUID = function() {
    // http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    /*jshint bitwise: false*/
    return   'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
  };


  function isGameBetweenPlayers(game, player1, player2) {
    if (isPlayerInGame(player1, game) && isPlayerInGame(player2, game)) {
      return true;
    } else {
      return false;
    }
  }
  this.isGameBetweenPlayers = isGameBetweenPlayers;

  function isPlayerInGame(player, game) {
    if (peopleEqual(game.playerDark, player)) {
      return true;
    }
    if (peopleEqual(game.playerLight, player)) {
      return true;
    }
  }
  this.isPlayerInGame = isPlayerInGame;

  /**
   * Gets the given player's opponent in a given Game object
   */
  this.getOpponent = function(player, game) {
    if (peopleEqual(game.playerDark, player)) {
      return game.playerLight;
    }
    if (peopleEqual(game.playerLight, player)) {
      return game.playerDark;
    }
  }

  this.gamesEqual = function(game1, game2) {
    if ((game1.id == game2.id) &&
        peopleEqual(game1.playerDark, game2.playerDark) &&
        peopleEqual(game1.playerLight, game2.playerLight))
    {
      return true;
    }
    return false;
  }

  this.isByePlayer = function(player) {
    return player && (player.name === "BYE");
  };


  this.getGamesForPlayer = function(eventData, player) {
    var games = [];
    for (var i = 0; i < eventData.games.length; i++) {
      var game = eventData.games[i];
      if (isPlayerInGame(player, game)) {
        games.push(game);
      }
    }
    return games;
  };


}]);
