'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('EditPlayerController', ['$scope', '$modalInstance', '$timeout', 'player', function($scope, $modalInstance, $timeout, player) {

  $scope.player = JSON.parse(JSON.stringify(player));

  $scope.okClick = function() {
    // Commit this data!
    player.name = $scope.player.name;
    player.active = $scope.player.active;
    $modalInstance.close();
  }

  $scope.cancelClick = function() {
    // Toss out this data!
    $modalInstance.dismiss(null);
  }

}]);
