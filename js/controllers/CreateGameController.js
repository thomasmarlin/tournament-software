'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('CreateGameController', ['$scope', '$uibModalInstance', '$timeout', 'ConstantsService', 'TournamentService', function($scope, $uibModalInstance, $timeout, ConstantsService, TournamentService) {

  $scope.gameToOpen = {
    playerDark: null,
    playerLight: null,
    winner: null,
    vp: 2,
    round: $scope.getCurrentRound(),
    diff: 0,
    darkLostCards: 0,
    lightLostCards: 0
  }
  $scope.showLostPiles = ($scope.currentEvent.mode == ConstantsService.TOURNAMENT_FORMAT.MATCH_PLAY);


  $scope.allPlayersAndBye = [];

  $scope.okClick = function() {

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

    var newGame = {
      playerDark: $scope.gameToOpen.playerDark,
      playerLight: $scope.gameToOpen.playerLight,
      winner: $scope.gameToOpen.winner,
      vp: 2,
      round: $scope.gameToOpen.round,
      diff: parseInt($scope.gameToOpen.diff),
      darkLostCards: parseInt($scope.gameToOpen.darkLostCards),
      lightLostCards: parseInt($scope.gameToOpen.lightLostCards)
    };

    $uibModalInstance.close(newGame);
  }

  function getAllPlayersAndBye(){
    var allPlayers = [];
    for (var i = 0; i < $scope.currentEvent.players.length; i++) {
      var player = $scope.currentEvent.players[i];
      allPlayers.push(player);
    }

    var byePlayer = TournamentService.getByePlayer();
    allPlayers.push(byePlayer);

    return allPlayers;
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
