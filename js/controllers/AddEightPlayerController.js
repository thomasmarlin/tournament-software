'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('AddEightPlayerController', ['$scope', '$uibModal', '$uibModalInstance', 'ConstantsService', 'LoggerService', 'MessageBoxService', 'UtilService', function($scope, $uibModal, $uibModalInstance, ConstantsService, LoggerService, MessageBoxService, UtilService) {


  $scope.players = [];

  $scope.addPlayer = function() {
    var newPlayer = {
      name: "",
      id: UtilService.generateGUID(),
      status: ConstantsService.PLAYER_STATUS.STATUS_ACTIVE
    };

    var modalDialog = $uibModal.open({
      template: editPlayerHTML,
      controller: 'EditPlayerController',
      scope: $scope,
      resolve: {
        playerToEdit: function() {
          return newPlayer;
        },
        allPlayers: function() {
          return $scope.players;
        }
      }
    });

    modalDialog.result.then(
      // Success
      function(selectedPerson) {
        LoggerService.action("Added Player : " + JSON.stringify(selectedPerson));

        var player = {
          id: selectedPerson.id,
          name: selectedPerson.name,
          forum_handle: selectedPerson.forum_handle,
          forum_handle_lower: selectedPerson.forum_handle_lower,
          status: ConstantsService.PLAYER_STATUS.STATUS_ACTIVE
        };

        $scope.players.push(player);
      },
      function() {
        console.log("Cancelled edit player");
      }
    );
  };

  $scope.deletePlayer = function(player) {
    var index = $scope.players.indexOf(player);
    if (index > 0) {
      $scope.players.splice(index, 1);
    }
  };

  $scope.movePlayerUp = function(player) {
    var index = $scope.players.indexOf(player);
    if (index > 0) {
      $scope.players.splice(index, 1);
      $scope.players.splice(index - 1, 0, player);
    }
  };

  $scope.movePlayerDown = function(player) {
    var index = $scope.players.indexOf(player);
    if (index < $scope.players.length) {
      $scope.players.splice(index, 1);
      $scope.players.splice(index + 1, 0, player);
    }
  };

  $scope.done = function() {
    if ($scope.players.length !== 8) {
      MessageBoxService.errorMessage("You must add exactly 8 players. Please check your entry and try again.", $scope);
      return;
    }
    $uibModalInstance.close($scope.players);
  };

  $scope.cancelClick = function() {
    $uibModalInstance.dismiss(null);
  };

}]);
