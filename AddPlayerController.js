'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('AddPlayerController', ['$scope', '$modalInstance', '$timeout', function($scope, $modalInstance, $timeout) {

  $scope.newPlayerName = "";

  $scope.okClick = function() {
    $modalInstance.close($scope.newPlayerName);
  }

  $scope.cancelClick = function() {
    $scope.newPlayerName = null;
    $modalInstance.dismiss(null);
  }

}]);
