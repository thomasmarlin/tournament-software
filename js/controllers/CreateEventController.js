'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('CreateEventController', ['$scope', '$uibModalInstance', '$timeout', 'MessageBoxService', function($scope, $uibModalInstance, $timeout, MessageBoxService) {

  $scope.creatingEventData = {
    name: "",
    mode: "SOS",
    password: "",
    confirmPassword: ""
  };

  $scope.okClick = function() {

    if ($scope.creatingEventData.password === "") {
      MessageBoxService.errorMessage("Please enter a password for this event", $scope);
      return;
    }

    if ($scope.creatingEventData.password != $scope.creatingEventData.confirmPassword) {
      MessageBoxService.errorMessage("Passwords do not match.", $scope);
      return;
    }

    $uibModalInstance.close($scope.creatingEventData);
  }

  $scope.cancelClick = function() {
    $uibModalInstance.dismiss(null);
  }

}]);
