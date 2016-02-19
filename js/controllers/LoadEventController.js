'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('LoadEventController', ['$scope', '$uibModalInstance', '$timeout', 'DataStorage', function($scope, $uibModalInstance, $timeout, DataStorage) {

  $scope.tmp = {
    eventId: "SELECT_EVENT_PLACEHOLDER",
    eventNames: []
  };

  $scope.okClick = function() {
    if (!$scope.tmp.eventId || $scope.tmp.eventId == "SELECT_EVENT_PLACEHOLDER") {
      alert("Please select an event from the list");
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
