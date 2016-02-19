'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('MessageBoxController', ['$scope', '$uibModalInstance', 'title', 'message', 'extraMessages', function($scope, $uibModalInstance, title, message, extraMessages) {

  $scope.extraMessages = extraMessages;
  $scope.message = message;
  $scope.title = title;

  $scope.ok = function() {
    $uibModalInstance.close();
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss(null);
  };

}]);
