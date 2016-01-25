'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('CreateEventController', ['$scope', '$uibModalInstance', '$timeout', function($scope, $uibModalInstance, $timeout) {

  $scope.creatingEventData = {
    name: "",
    mode: "SOS"
  };

  $scope.okClick = function() {
    $uibModalInstance.close($scope.creatingEventData);
  }

  $scope.cancelClick = function() {
    $uibModalInstance.dismiss(null);
  }

}]);
