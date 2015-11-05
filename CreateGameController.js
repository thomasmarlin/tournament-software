'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('CreateGameController', ['$scope', '$modalInstance', '$timeout', function($scope, $modalInstance, $timeout) {

  $scope.winner = null;
  $scope.player1 = null;
  $scope.player2 = null;
  $scope.vp = 2;
  $scope.round = $scope.getCurrentRound();

  $scope.okClick = function() {

    var newGame = {
      player1: $scope.player1,
      player2: $scope.player2,
      winner: $scope.winner,
      vp: 2,
      round: $scope.round
    };

    $modalInstance.close(newGame);
  }

  $scope.cancelClick = function() {
    $scope.newPlayerName = null;
    $modalInstance.dismiss(null);
  }

}]);
