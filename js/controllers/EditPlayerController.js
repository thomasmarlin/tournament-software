'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('EditPlayerController', ['$scope', '$uibModal', '$uibModalInstance', '$timeout', 'LoggerService', 'player', function($scope, $uibModal, $uibModalInstance, $timeout, LoggerService, player) {

  $scope.newPlayerMode = true;
  $scope.existingPlayerMode = false;

  $scope.player = JSON.parse(JSON.stringify(player));

  $scope.loadPlayer = function() {
    var modalDialog = $uibModal.open({
        template: findPlayerHTML,
        controller: 'FindPlayerController',
        scope: $scope
      });

    modalDialog.result.then(
      // Success
      function(existingPlayer) {
        LoggerService.log("Existing Player Loaded: " + JSON.stringify(existingPlayer));
        $scope.player = existingPlayer;
      },
      // Cancelled
      function() {
        LoggerService.log("Load Player : Cancelled");
      }
    );
  }

  $scope.okClick = function() {
    // Commit this data!
    player.name = $scope.player.name;
    player.status = $scope.player.status;
    $uibModalInstance.close($scope.player);
  }

  $scope.cancelClick = function() {
    // Toss out this data!
    $uibModalInstance.dismiss(null);
  }

}]);
