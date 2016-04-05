'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('CreateGameController', ['$scope', '$uibModalInstance', '$timeout', 'TournamentService', function($scope, $uibModalInstance, $timeout, TournamentService) {

  $scope.winner = null;
  $scope.playerDark = null;
  $scope.playerLight = null;
  $scope.vp = 2;
  $scope.round = $scope.getCurrentRound();
  $scope.diff = $scope.diff;

  $scope.okClick = function() {

    var newGame = {
      playerDark: $scope.playerDark,
      playerLight: $scope.playerLight,
      winner: $scope.winner,
      vp: 2,
      round: $scope.round,
      diff: parseInt($scope.diff)
    };

    $uibModalInstance.close(newGame);
  }

  $scope.getAllPlayersAndBye = function() {
    var allPlayers = [];
    for (var i = 0; i < $scope.currentEvent.players.length; i++) {
      var player = $scope.currentEvent.players[i];
      allPlayers.push(player);
    }

    var byePlayer = TournamentService.getByePlayer();
    allPlayers.push(byePlayer);

    return allPlayers;
  }

  $scope.getPlayers = function() {
    var players = [];
    if ($scope.playerDark) {
      players.push($scope.playerDark);
    }
    if ($scope.playerLight) {
      players.push($scope.playerLight);
    }
    return players;
  };

  $scope.cancelClick = function() {
    $scope.newPlayerName = null;
    $uibModalInstance.dismiss(null);
  }

}]);
