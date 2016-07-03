'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('DeclareWinnerController', ['$scope', '$uibModalInstance', '$timeout', 'ConstantsService', 'MessageBoxService', 'TournamentService', function($scope, $uibModalInstance, $timeout, ConstantsService, MessageBoxService, TournamentService) {

  // Get the game to open from the parent scope
  $scope.gameToOpen = JSON.parse(JSON.stringify($scope.gameToOpen));
  $scope.showLostPiles = ($scope.currentEvent.mode == ConstantsService.TOURNAMENT_FORMAT.MATCH_PLAY);

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

    var edittedGame = {
      id: $scope.gameToOpen.id,
      playerDark: $scope.gameToOpen.playerDark,
      playerLight: $scope.gameToOpen.playerLight,
      winner: $scope.gameToOpen.winner,
      vp: 2,
      diff: parseInt($scope.gameToOpen.diff),
      round: $scope.gameToOpen.round,
      darkLostCards: parseInt($scope.gameToOpen.darkLostCards),
      lightLostCards: parseInt($scope.gameToOpen.lightLostCards)
    }
    $uibModalInstance.close(edittedGame);
  }




  $scope.cancelClick = function() {
    $uibModalInstance.dismiss(null);
  }

}]);
