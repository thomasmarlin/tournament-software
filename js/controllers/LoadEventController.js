'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('LoadEventController', ['$scope', '$uibModalInstance', '$timeout', 'DataStorage', 'MessageBoxService', function($scope, $uibModalInstance, $timeout, DataStorage, MessageBoxService) {

  $scope.tmp = {
    eventId: "SELECT_EVENT_PLACEHOLDER",
    eventNames: []
  };

  $scope.okClick = function() {
    if (!$scope.tmp.eventId || $scope.tmp.eventId == "SELECT_EVENT_PLACEHOLDER") {
      MessageBoxService.errorMessage("Please select an event from the list", $scope);
      return;
    }

    $uibModalInstance.close($scope.tmp.eventId);
  };

  $scope.cancelClick = function() {
    $uibModalInstance.dismiss(null);
  };

  DataStorage.getEventNames().then(
    function(response) {
      $scope.tmp.eventNames = response.tournaments;
    },
    function(err) {
      MessageBoxService.errorMessage("Unable to retrieve list of Events");
      $uibModalInstance.dismiss(null);
    }
  );

}]);
