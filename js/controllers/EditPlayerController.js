'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('EditPlayerController', ['$scope', '$uibModalInstance', '$timeout', 'player', function($scope, $uibModalInstance, $timeout, player) {

  $scope.player = JSON.parse(JSON.stringify(player));

  $scope.okClick = function() {
    // Commit this data!
    player.name = $scope.player.name;
    player.status = $scope.player.status;
    $uibModalInstance.close();
  }

  $scope.cancelClick = function() {
    // Toss out this data!
    $uibModalInstance.dismiss(null);
  }

}]);
