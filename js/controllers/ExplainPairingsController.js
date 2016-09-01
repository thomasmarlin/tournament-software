'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('ExplainPairingsController', ['$scope', '$uibModal', '$uibModalInstance', 'decisions', 'gameNumber', function($scope, $uibModal, $uibModalInstance, decisions, gameNumber) {

  $scope.decisions = decisions;
  $scope.gameOnlyDecisions = [];
  $scope.gameNumber = gameNumber;

  for (var i = 0; i < decisions.length; i++) {
    var decision = decisions[i];
    if (0 === decision.indexOf("Creating game: ")) {
      var trimmedDecision = decision.replace("Creating game: ", "");
      $scope.gameOnlyDecisions.push(trimmedDecision);
    }
  }

  $scope.close = function() {
    $uibModalInstance.dismiss(null);
  };

}]);
