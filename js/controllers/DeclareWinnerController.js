'use strict';
/* globals $ */
var sosApp = angular.module('sosApp');
sosApp.controller('DeclareWinnerController', ['$scope', '$uibModalInstance', '$timeout', 'ConstantsService', 'MessageBoxService', function($scope, $uibModalInstance, $timeout, ConstantsService, MessageBoxService) {

  // Get the game to open from the parent scope
  $scope.gameToOpen = JSON.parse(JSON.stringify($scope.gameToOpen));
  $scope.showLostPiles = ($scope.currentEvent.mode == ConstantsService.TOURNAMENT_FORMAT.MATCH_PLAY);

  $timeout(function() {
    // Highlight the entire Diff field so the user can type in the data very easily
    $('#differentialEntryField').select();
  }, 100);

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
