'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('ManageOfflineDataController', ['$scope', '$uibModalInstance', 'LocalData', 'MessageBoxService', function($scope, $uibModalInstance, LocalData, MessageBoxService) {

  $scope.data = {
    offlineEvents: []
  };

  function reloadTournamentData() {
    LocalData.getTournamentList().then(
      function(tournamentList) {
        $scope.data.offlineEvents = tournamentList.tournaments;
        console.log('event: ' + JSON.stringify($scope.data.offlineEvents));
      }
    );
  }

  reloadTournamentData();


  $scope.removeDataForEvent = function(event) {

    MessageBoxService.confirmDialog("Are you sure you want to delete all offline data for the event: '" + event.name + "'?", $scope, "Are you sure?").result.then(
      function() {
        // Confirmed!
        LocalData.removeTournamentById(event.id);
        reloadTournamentData();
        
        MessageBoxService.infoMessage("Offline data removed.", $scope);
      }
    );
  };

  $scope.loadEvent = function(event) {
    $uibModalInstance.close(event);
  };

  $scope.clearOfflineData = function() {
    LocalData.deleteAllEvents();
    $uibModalInstance.dismiss(null);
  };

  $scope.close = function() {
    $uibModalInstance.dismiss(null);
  };

}]);
