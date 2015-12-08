'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('AssignWinnerController', ['$scope', '$modalInstance', '$timeout', function($scope, $modalInstance, $timeout) {

  // Get the game to open from the parent scope
  $scope.gameToOpen = $scope.gameToOpen;

  $scope.winner = $scope.gameToOpen.winner;
  $scope.playerDark = $scope.gameToOpen.playerDark;
  $scope.playerLight = $scope.gameToOpen.playerLight;
  $scope.vp = $scope.gameToOpen.vp;
  $scope.round = $scope.gameToOpen.round;
  $scope.diff = $scope.gameToOpen.diff;

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
    $modalInstance.close(edittedGame);
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
    $modalInstance.dismiss(null);
  }

}]);
