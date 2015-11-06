'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('LoadEventController', ['$scope', '$modalInstance', '$timeout', function($scope, $modalInstance, $timeout) {

  $scope.tmp = {
    eventNameToLoad: "-- Select Event --"
  };

  $scope.okClick = function() {
    if (!$scope.tmp.eventNameToLoad || $scope.tmp.eventNameToLoad == "-- Select Event --") {
      alert("Please select an event from the list");
      return;
    }
    $modalInstance.close($scope.tmp.eventNameToLoad);
  }

  $scope.cancelClick = function() {
    $modalInstance.dismiss(null);
  }

}]);
