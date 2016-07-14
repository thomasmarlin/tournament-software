'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('ExplainPairingsController', ['$scope', '$uibModal', '$uibModalInstance', 'decisions', 'gameNumber', function($scope, $uibModal, $uibModalInstance, decisions, gameNumber) {

  $scope.decisions = decisions;
  $scope.gameNumber = gameNumber;

  $scope.close = function() {
    $uibModalInstance.dismiss(null);
  };

}]);
