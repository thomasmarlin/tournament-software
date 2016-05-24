'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('CreateEditUserController', ['$scope', '$uibModalInstance', 'MessageBoxService', 'UtilService', 'existingUser', function($scope, $uibModalInstance, MessageBoxService, UtilService, existingUser) {

  $scope.userData = {
    username: "",
    password: "",
    level: "DEFAULT"
  };

  if (existingUser) {
    $scope.userData.username = existingUser.username;
    $scope.userData.level = existingUser.level;
  }

  $scope.okClick = function() {

    /*
    if ($scope.password !== $scope.confirmPassword) {
      MessageBoxService.errorMessage("Passwords do not match. Please try again.", $scope);
      return;
    }*/


    var dataToSave = {
      id: UtilService.generateGUID(),
      username: $scope.userData.username,
      password: $scope.userData.password,
    }

    if (existingUser) {
      dataToSave.id = existingUser.id;
    }

    $uibModalInstance.close(dataToSave);
  }

  $scope.cancelClick = function() {
    $uibModalInstance.dismiss(null);
  };

}]);
