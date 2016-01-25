'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('AddPlayerController', ['$scope', '$uibModalInstance', '$timeout', function($scope, $uibModalInstance, $timeout) {

  $scope.newPlayerName = "";

  $scope.okClick = function() {
    $uibModalInstance.close($scope.newPlayerName);
  }

  $scope.cancelClick = function() {
    $scope.newPlayerName = null;
    $uibModalInstance.dismiss(null);
  }

}]);
