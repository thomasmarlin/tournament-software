'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('CreateGameController', ['$scope', '$uibModalInstance', '$timeout', 'ConstantsService', 'TournamentService', function($scope, $uibModalInstance, $timeout, ConstantsService, TournamentService) {

  $scope.gameToOpen = {
    playerDark: null,
    playerLight: null,
    winner: null,
    vp: 2,
    round: $scope.getCurrentRound(),
    diff: 0
  }
  $scope.showLostPiles = ($scope.currentEvent.mode == ConstantsService.TOURNAMENT_FORMAT.MATCH_PLAY);


  $scope.allPlayersAndBye = [];

  $scope.okClick = function() {

    var newGame = {
      playerDark: $scope.gameToOpen.playerDark,
      playerLight: $scope.gameToOpen.playerLight,
      winner: $scope.gameToOpen.winner,
      vp: 2,
      round: $scope.gameToOpen.round,
      diff: parseInt($scope.gameToOpen.diff)
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
