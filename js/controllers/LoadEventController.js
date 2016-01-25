'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('LoadEventController', ['$scope', '$uibModalInstance', '$timeout', function($scope, $uibModalInstance, $timeout) {

  $scope.tmp = {
    eventNameToLoad: "-- Select Event --"
  };

  $scope.okClick = function() {
    if (!$scope.tmp.eventNameToLoad || $scope.tmp.eventNameToLoad == "-- Select Event --") {
      alert("Please select an event from the list");
      return;
    }
    $uibModalInstance.close($scope.tmp.eventNameToLoad);
  }

  $scope.cancelClick = function() {
    $uibModalInstance.dismiss(null);
  }

}]);
