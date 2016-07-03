'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('CreateEventController', ['$scope', '$timeout', '$uibModalInstance', '$uibModal', 'ConstantsService', 'MessageBoxService', 'eventData', function($scope, $timeout, $uibModalInstance, $uibModal, ConstantsService, MessageBoxService, eventData) {

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

    if ($scope.creatingEventData.mode == ConstantsService.TOURNAMENT_FORMAT.MATCH_PLAY) {
      var modalDialog = $uibModal.open({
        template: addEightPlayerHTML,
        controller: 'AddEightPlayerController',
        scope: $scope
      });

      modalDialog.result.then(
        //Success
        function(players) {
          finishEventCreation(players);
        }
      );

    } else {
      var emptyPlayers = [];
      finishEventCreation(emptyPlayers);
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

    function finishEventCreation(players) {
      $scope.creatingEventData.date = $scope.datePickerData.selectedDate.toISOString();
      $scope.creatingEventData.players = players;
      $uibModalInstance.close($scope.creatingEventData);
    }
  };

  $scope.cancelClick = function() {
    $uibModalInstance.dismiss(null);
  };

}]);
