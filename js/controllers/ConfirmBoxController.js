'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('ConfirmBoxController', ['$scope', '$uibModalInstance', 'title', 'message', function($scope, $uibModalInstance, title, message) {

  $scope.message = message;
  $scope.title = title;

  $scope.yes = function() {
    $uibModalInstance.close();
  };

  $scope.no = function() {
    $uibModalInstance.dismiss(null);
  };

}]);
