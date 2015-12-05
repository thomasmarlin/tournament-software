'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('CreateEventController', ['$scope', '$modalInstance', '$timeout', function($scope, $modalInstance, $timeout) {

  $scope.creatingEventData = {
    name: "",
    mode: "SOS"
  };

  $scope.okClick = function() {
    $modalInstance.close($scope.creatingEventData);
  }

  $scope.cancelClick = function() {
    $modalInstance.dismiss(null);
  }

}]);
