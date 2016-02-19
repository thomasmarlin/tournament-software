'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('CreateGameController', ['$scope', '$uibModalInstance', '$timeout', function($scope, $uibModalInstance, $timeout) {

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