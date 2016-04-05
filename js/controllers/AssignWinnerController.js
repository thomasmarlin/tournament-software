'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('AssignWinnerController', ['$scope', '$uibModalInstance', '$timeout', 'TournamentService', function($scope, $uibModalInstance, $timeout, TournamentService) {

  // Get the game to open from the parent scope
  $scope.gameToOpen = $scope.gameToOpen;

  $scope.winner = $scope.gameToOpen.winner;
  $scope.playerDark = $scope.gameToOpen.playerDark;
  $scope.playerLight = $scope.gameToOpen.playerLight;
  $scope.vp = $scope.gameToOpen.vp;
  $scope.round = $scope.gameToOpen.round;
  $scope.diff = $scope.gameToOpen.diff;

  $scope.allPlayersAndBye = [];

  $scope.okClick = function() {

    var edittedGame = {
      id: $scope.gameToOpen.id,
      playerDark: $scope.playerDark,
      playerLight: $scope.playerLight,
      winner: $scope.winner,
      vp: 2,
      diff: $scope.diff,
      round: $scope.round
    }
    $uibModalInstance.close(edittedGame);
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
    if ($scope.playerDark) {
      players.push($scope.playerDark);
    }
    if ($scope.playerLight) {
      players.push($scope.playerLight);
    }
    return players;
  };


  $scope.cancelClick = function() {
    $uibModalInstance.dismiss(null);
  }

}]);
