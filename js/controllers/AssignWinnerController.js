'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('AssignWinnerController', ['$scope', '$uibModalInstance', '$timeout', 'ConstantsService', 'MessageBoxService', 'TournamentService', 'UtilService', function($scope, $uibModalInstance, $timeout, ConstantsService, MessageBoxService, TournamentService, UtilService) {

  // Get the game to open from the parent scope
  $scope.gameToOpen = JSON.parse(JSON.stringify($scope.gameToOpen));
  $scope.showLostPiles = ($scope.currentEvent.mode == ConstantsService.TOURNAMENT_FORMAT.MATCH_PLAY);

  $scope.allPlayersAndBye = [];

  $scope.okClick = function() {

    // Fix messed up stuff
    if (typeof $scope.gameToOpen.darkLostCards == 'undefined') {
      $scope.gameToOpen.darkLostCards = 0;
    }
    if (typeof $scope.gameToOpen.lightLostCards == 'undefined') {
      $scope.gameToOpen.lightLostCards = 0;
    }
    if (typeof $scope.gameToOpen.diff == 'undefined') {
      $scope.gameToOpen.diff = 0;
    }

    if (isNaN(parseInt($scope.gameToOpen.darkLostCards))) {
      MessageBoxService.errorMessage("Please enter a valid value for 'Dark Side lost pile count'", $scope);
      return;
    }
    if (isNaN(parseInt($scope.gameToOpen.lightLostCards))) {
      MessageBoxService.errorMessage("Please enter a valid value for 'Light Side lost pile count'", $scope);
      return;
    }
    if (isNaN(parseInt($scope.gameToOpen.diff))) {
      MessageBoxService.errorMessage("Please enter a valid value for 'Differential'", $scope);
      return;
    }

    var edittedGame = {
      id: $scope.gameToOpen.id,
      playerDark: $scope.gameToOpen.playerDark,
      playerLight: $scope.gameToOpen.playerLight,
      winner: $scope.gameToOpen.winner,
      vp: 2,
      round: $scope.gameToOpen.round,
      diff: parseInt($scope.gameToOpen.diff),
      darkLostCards: parseInt($scope.gameToOpen.darkLostCards),
      lightLostCards: parseInt($scope.gameToOpen.lightLostCards)
    }
    $uibModalInstance.close(edittedGame);
  }

  function getPlayersThisRound() {
    var currentRoundNum = $scope.getCurrentRoundNumber();
    var players = [];
    for (var i = 0; i < $scope.currentEvent.games.length; i++) {
      var game = $scope.currentEvent.games[i];
      if (game.round.num == currentRoundNum) {
        players.push(game.playerDark);
        players.push(game.playerLight);
      }
    }
    return players;
  }


  function getAllPlayersAndBye(){
    var i = 0;
    var player = null;

    var allPlayers = [];
    for (i = 0; i < $scope.currentEvent.players.length; i++) {
      player = $scope.currentEvent.players[i];
      allPlayers.push(player);
    }

    var byePlayer = TournamentService.getByePlayer();
    allPlayers.push(byePlayer);

    var unplayedPlayers = [];

    // Keep existing players available
    if ($scope.gameToOpen.playerDark) {
      unplayedPlayers.push($scope.gameToOpen.playerDark);
    }
    if ($scope.gameToOpen.playerLight) {
      unplayedPlayers.push($scope.gameToOpen.playerLight);
    }
    

    var playersThisRound = getPlayersThisRound();
    for (i = 0; i < allPlayers.length; i++) {
      player = allPlayers[i];
      var playedThisRound = false;

      for (var j = 0; j < playersThisRound.length; j++) {
        var playedPlayer = playersThisRound[j];
        if (UtilService.peopleEqual(playedPlayer, player)) {
          playedThisRound = true;
        }
      }
      if (!playedThisRound) {
        unplayedPlayers.push(player);
      }
    }



    return unplayedPlayers;
  }
  $scope.allPlayersAndBye = getAllPlayersAndBye();


  $scope.getPlayers = function() {
    var players = [];
    if ($scope.gameToOpen.playerDark) {
      players.push($scope.gameToOpen.playerDark);
    }
    if ($scope.gameToOpen.playerLight) {
      players.push($scope.gameToOpen.playerLight);
    }
    return players;
  };


  $scope.cancelClick = function() {
    $uibModalInstance.dismiss(null);
  }

}]);
