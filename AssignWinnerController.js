'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('AssignWinnerController', ['$scope', '$modalInstance', '$timeout', function($scope, $modalInstance, $timeout) {

  // Get the game to open from the parent scope
  $scope.gameToOpen = $scope.gameToOpen;

  $scope.winner = $scope.gameToOpen.winner;
  $scope.player1 = $scope.gameToOpen.player1;
  $scope.player2 = $scope.gameToOpen.player2;
  $scope.vp = $scope.gameToOpen.vp;
  $scope.round = $scope.gameToOpen.round;

  $scope.okClick = function() {

    var edittedGame = {
      id: $scope.gameToOpen.id,
      player1: $scope.player1,
      player2: $scope.player2,
      winner: $scope.winner,
      vp: 2,
      round: $scope.round
    }
    $modalInstance.close(edittedGame);
  }

  $scope.cancelClick = function() {
    $modalInstance.dismiss(null);
  }

}]);
