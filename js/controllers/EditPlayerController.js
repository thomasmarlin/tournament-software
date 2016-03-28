'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('EditPlayerController', ['$scope', '$uibModal', '$uibModalInstance', '$timeout', 'LoggerService', 'MessageBoxService', 'playerToEdit', function($scope, $uibModal, $uibModalInstance, $timeout, LoggerService, MessageBoxService, playerToEdit) {

  $scope.newPlayerMode = true;
  $scope.existingPlayerMode = false;
  $scope.addEditPlayerTitle = "Add / Load Player";
  if (playerToEdit.id) {
    $scope.addEditPlayerTitle = "Edit Player";
  }

  $scope.player = JSON.parse(JSON.stringify(playerToEdit));


  $scope.loadPlayer = function() {
    var modalDialog = $uibModal.open({
        template: findPlayerHTML,
        controller: 'FindPlayerController',
        scope: $scope
      });

    modalDialog.result.then(
      // Success
      function(existingPlayer) {

        // Verify that we don't already have this player yet (either with the same name OR with same ID)
        if (!verifyNameDoesntExist(existingPlayer.name)) {
          MessageBoxService.errorMessage("A player with that name has already been added. Check your entry and try again.", $scope);
          return;
        }

        if (!verifyIDoesntExist(existingPlayer.id)) {
          MessageBoxService.errorMessage("That player has already been added. Check your entry and try again.", $scope);
          return;
        }


        LoggerService.log("Existing Player Loaded: " + JSON.stringify(existingPlayer));
        $scope.player = existingPlayer;
      },
      // Cancelled
      function() {
        LoggerService.log("Load Player : Cancelled");
      }
    );
  }


  function verifyNameDoesntExist(playerName) {

    // Make sure we don't already have someone with this name;
    var newNameLower = playerName.toLowerCase().trim();
    for (var i = 0; i < $scope.currentEvent.players.length; i++) {

      var existingPlayer = $scope.currentEvent.players[i];
      var existingNameLower = existingPlayer.name.toLowerCase().trim();
      if (existingNameLower == newNameLower) {
        // We have this person.  If this is the person we are editting, that's fine. otherwise, error out!
        if (playerToEdit && (playerToEdit.id === existingPlayer.id)) {
          // This is OK. They are editting the previously picked user
          console.log("Was player we were editting...");
        } else {
          return false;
        }
      }

    }

    return true;
  }


  function verifyIDoesntExist(playerId) {

    // Make sure we don't already have someone with this name;
    var newPlayerId = $scope.player.id;
    for (var i = 0; i < $scope.currentEvent.players.length; i++) {

      var existingPlayer = $scope.currentEvent.players[i];
      var existingId = $scope.currentEvent.players[i].id;
      if (existingId == playerId) {
        // We have this person.  If this is the person we are editting, that's fine. otherwise, error out!
        if (playerToEdit && (playerToEdit.id === existingPlayer.id)) {
          // This is OK. They are editting the previously picked user
          console.log("Was player we were editting...");
        } else {
          return false;
        }
      }

    }

    return true;
  }


  $scope.okClick = function() {

    if (!verifyNameDoesntExist($scope.player.name)) {
      MessageBoxService.errorMessage("A player with that name has already been added. Check your entry and try again.", $scope);
      return;
    }

    if (!verifyIDoesntExist($scope.player.id)) {
      MessageBoxService.errorMessage("That player has already been added. Check your entry and try again.", $scope);
      return;
    }

    $uibModalInstance.close($scope.player);
  }


  $scope.cancelClick = function() {
    // Toss out this data!
    $uibModalInstance.dismiss(null);
  }

}]);
