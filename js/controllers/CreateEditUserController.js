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
      level: "DEFAULT"
    }

    if (existingUser) {
      dataToSave.id = existingUser.id;
    }

    if (dataToSave.username.trim() == "") {
      MessageBoxService.errorMessage("Please enter a username for the tournament director", $scope);
      return;
    }

    if (dataToSave.password.trim() == "") {
      MessageBoxService.errorMessage("Please enter a password for the tournament director", $scope);
      return;
    }

    $uibModalInstance.close(dataToSave);
  }

  $scope.cancelClick = function() {
    $uibModalInstance.dismiss(null);
  };

}]);
