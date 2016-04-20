'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('CreateEventController', ['$scope', '$uibModalInstance', '$timeout', 'MessageBoxService', 'eventData', function($scope, $uibModalInstance, $timeout, MessageBoxService, eventData) {

  $scope.existingTournament = false;
  $scope.datePickerData = {
    opened: false
  };

  if (eventData) {
    $scope.creatingEventData = angular.copy(eventData);
    $scope.existingTournament = true;
  } else {
    $scope.creatingEventData = {
      name: "",
      mode: "SOS",
      date: "",
      password: "",
      confirmPassword: ""
    };
  }

  $scope.openDate = function() {
    $scope.datePickerData.opened = true;
  };

  $scope.okClick = function() {

    if (!$scope.creatingEventData.date || $scope.creatingEventData.date == "") {
      MessageBoxService.errorMessage("Please select a valid event date.", $scope);
      return;
    }

    if ($scope.creatingEventData.password === "") {
      MessageBoxService.errorMessage("Please enter a password for this event", $scope);
      return;
    }

    if ($scope.creatingEventData.password != $scope.creatingEventData.confirmPassword) {
      MessageBoxService.errorMessage("Passwords do not match.", $scope);
      return;
    }

    $uibModalInstance.close($scope.creatingEventData);
  };

  $scope.cancelClick = function() {
    $uibModalInstance.dismiss(null);
  };

}]);
