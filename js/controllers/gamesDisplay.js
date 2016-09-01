"use strict";
var sosApp = angular.module('sosApp');
sosApp.directive('gamesDisplay', ['$uibModal', function($uibModal) {
  return {
    restrict: 'A',
    template: gamesDisplayHTML,
    link: function(scope, element, attrs) {

      function getActiveRoundNum() {
        for (var i = 0; i < scope.currentEvent.rounds.length; i++) {
          var round = scope.currentEvent.rounds[i];
          if (round.active) {
            return round.num;
          }
        }

        return -1;
      }

      scope.printCurrentRound = function() {

        var modalDialog = $uibModal.open({
            template: printPairingsHTML,
            controller: "PrintPairingsController",
            scope: scope,
            resolve: {
              eventData: function() {
                return scope.currentEvent;
              },
              gameNumber: function() {
                return getActiveRoundNum();
              }
            }
          });

        return modalDialog;
      }

    }
  };
}]);
