'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('FindPlayerController', ['$scope', '$uibModalInstance', 'DataStorage', 'MessageBoxService', function($scope, $uibModalInstance, DataStorage, MessageBoxService) {


  $scope.nameFilter = "";
  $scope.handleFilter = "";
  $scope.matchingPlayers = [];
  $scope.loading = true;

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  var allPlayers = [];

  $scope.filterChanged = function() {

    $scope.matchingPlayers = [];

    var nameToMatch = null;
    if ($scope.nameFilter != "") {
      nameToMatch = $scope.nameFilter.toLowerCase().trim();
    }

    var handleToMatch = null;
    if ($scope.handleFilter != "") {
      handleToMatch = $scope.handleFilter.toLowerCase().trim();
    }

    // Remove all players which don't match both the Name and Handle (if supplied)
    for (var i = 0; i < allPlayers.length; i++) {

      var player = allPlayers[i];
      var match = false;

      if (nameToMatch && player.name_lower) {
        if (-1 != player.name_lower.indexOf(nameToMatch)) {
          match = true
        }
      }

      if (handleToMatch && player.forum_handle_lower) {
        if (-1 != player.forum_handle_lower.indexOf(handleToMatch)) {
          match = true
        }
      }

      if (!nameToMatch && !handleToMatch) {
        match = true;
      }

      if (match) {
        $scope.matchingPlayers.push(player);
      }
    }
  }


  DataStorage.getPlayerList().then(
    function(playersData) {
      // Store the new data
      allPlayers = playersData.players;

      // Add lower-case names for quick processing!
      for (var i = 0; i < allPlayers.length; i++) {
        var player = allPlayers[i];

        player.name_lower = "";
        player.forum_handle_lower = "";

        if (player.name) {
          player.name_lower = player.name.toLowerCase();
        }

        if (player.forum_handle) {
          player.forum_handle_lower = player.forum_handle.toLowerCase();
        }

      }

      $scope.filterChanged();
      $scope.loading = false;

    },
    function(err) {
      MessageBoxService("Failed to get list of players from server. Check your connections and try again.");
      $uibModalInstance.dismiss('cancel');
    }
  );

  $scope.selectPlayer = function(playerObj) {
    $uibModalInstance.close(playerObj);
  };


}]);
