'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('CreateEventController', ['$scope', '$modalInstance', '$timeout', function($scope, $modalInstance, $timeout) {

  $scope.evtName = "";

  $scope.okClick = function() {
    $modalInstance.close($scope.evtName);
  }

  $scope.cancelClick = function() {
    $modalInstance.dismiss(null);
  }

}]);
