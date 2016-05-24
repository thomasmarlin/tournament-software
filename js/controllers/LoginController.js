'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('LoginController', ['$scope', '$uibModalInstance', 'RESTService', function($scope, $uibModalInstance, RESTService) {

  $scope.username = "";
  $scope.password = "";

  $scope.okClick = function() {
    RESTService.login($scope.username, $scope.password).then(
      function($user) {
        $uibModalInstance.close();
      },
      function() {
        MessageBoxService.errorMessage("Invalid username/password combination", $scope);
      }
    );
  };

  $scope.cancelClick = function() {
    $uibModalInstance.dismiss(null);
  };

}]);
