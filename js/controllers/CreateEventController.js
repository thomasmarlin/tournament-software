'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('CreateEventController', ['$scope', '$uibModalInstance', '$timeout', 'MessageBoxService', 'eventData', function($scope, $uibModalInstance, $timeout, MessageBoxService, eventData) {

  $scope.existingTournament = false;
  $scope.datePickerData = {
    opened: false,
    selectedDate: new Date()
  };

  if (eventData) {
    $scope.creatingEventData = angular.copy(eventData);
    $scope.existingTournament = true;
    $scope.datePickerData.date = Date.parse(eventData.date);
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

    if (!$scope.datePickerData.selectedDate) {
      MessageBoxService.errorMessage("Please select a valid event date.", $scope);
      return;
    }

    /*
    if ($scope.creatingEventData.password === "") {
      MessageBoxService.errorMessage("Please enter a password for this event", $scope);
      return;
    }

    if ($scope.creatingEventData.password != $scope.creatingEventData.confirmPassword) {
      MessageBoxService.errorMessage("Passwords do not match.", $scope);
      return;
    }
    */

    $scope.creatingEventData.date = $scope.datePickerData.selectedDate.toISOString();
    $uibModalInstance.close($scope.creatingEventData);
  };

  $scope.cancelClick = function() {
    $uibModalInstance.dismiss(null);
  };

}]);
