"use strict";
var sosApp = angular.module('sosApp');
sosApp.directive('currentEvent', ['DataStorage', function(DataStorage) {
  return {
    restrict: 'A',
    template: currentEventHTML,
    link: function(scope, elem, attrs) {
      console.log("Loaded Current Event!");

      var allowEditTournament = false;

      scope.canEditTournament = function() {
        return allowEditTournament;
      };

      function checkTournamentEdittable() {
        if (!scope.currentEvent) {
          return false;
        }

        if (scope.currentEvent.finished) {
          return false;
        }

        // We can edit the tournament if we are:
        // 1.  Offline Mode (regardless of logged-in state)
        // 2.  Online Mode + Logged In
        if (scope.networkStatus.networkMode === DataStorage.NETWORK_MODES.NETWORK_ONLINE) {
          return scope.isLoggedIn();
        } else {
          return true;
        }
      }


      // Watch this funciton and update our bound variable when needed (performance)
      scope.$watch(
        function() {
          return checkTournamentEdittable();
        },
        function() {
          allowEditTournament = checkTournamentEdittable();
        }
      );

    }
  };
}]);
