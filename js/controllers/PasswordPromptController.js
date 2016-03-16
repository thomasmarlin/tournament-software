'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('PasswordPromptController', ['$scope', '$uibModalInstance', '$timeout', function($scope, $uibModalInstance, $timeout) {

  $scope.passwordData = {
    password: ""
  }

  $scope.okClick = function() {
    $uibModalInstance.close($scope.passwordData.password);
  };

  $scope.cancelClick = function() {
    $uibModalInstance.dismiss(null);
  };

}]);
