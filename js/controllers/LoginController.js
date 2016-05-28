'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('LoginController', ['$scope', '$timeout', '$uibModalInstance', 'MessageBoxService', 'RESTService', function($scope, $timeout, $uibModalInstance, MessageBoxService, RESTService) {

  $scope.username = "";
  $scope.password = "";

  $scope.doingLogin = false;

  $scope.okClick = function() {
    $scope.doingLogin = true;

    // Do the login in a timeout so that we display prior to all the processing
    $timeout(function() {
      doLogin();
    }, 200);

  };

  function doLogin() {
    RESTService.login($scope.username, $scope.password).then(
      function($user) {
        $scope.doingLogin = false;
        $uibModalInstance.close();
      },
      function() {
        $scope.doingLogin = false;
        MessageBoxService.errorMessage("Invalid username/password combination", $scope);
      }
    );
  }

  $scope.cancelClick = function() {
    $uibModalInstance.dismiss(null);
  };

}]);
