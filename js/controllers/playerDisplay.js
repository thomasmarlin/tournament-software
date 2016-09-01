"use strict";
var sosApp = angular.module('sosApp');
sosApp.directive('playerDisplay', ['MessageBoxService', '$uibModal', function(MessageBoxService, $uibModal) {
  return {
    restrict: 'A',
    template: playerDisplayHTML,
    link: function(scope, elem, attrs) {

      scope.printPlayerSummary = function() {

        var modalDialog = $uibModal.open({
            template: printStandingsHTML,
            controller: "PrintStandingsController",
            scope: scope,
            resolve: {
              players: function() {
                return scope.currentEvent.players;
              },
              gameNumber: function() {
                return scope.getCurrentRoundNumber();
              }
            }
          });

        return modalDialog;
      }


      scope.showSosFormulas = function() {

        var calculationInfo = "The Player's Committee is adjusting the method for calculating the Strength of Schedule tiebreaker. Following issues with the prior system at Worlds 2015 the Player's Committee undertook an extensive review of the system and explored many possible methods of calculation. After much deliberation, the Player's Committee has decided that the following system best meets its goals of fairness and ease of administration:\n";

        var extraMessages = [
          "(1) Compute for each player their total Victory Points. If they dropped, give them 1 Victory Point for each game they didn't play.",
          "(2) Apply a floor of 1 Victory Point for every round (i.e., 1 Victory Point for every two games) to each player, including the bye.",
          "(3) Each player's Strength Of Schedule score is the sum of all their opponents adjusted Victory Points, including the bye.",
          "In the case of two or more players having equal Strength of Schedules, drop each player's lowest opponent until the tie is resolved.",
          "If this does not resolve the tie, the player with the better head-to-head victory margin should be placed ahead of the other.",
          "If this does not resolve the tie, flip a coin."
        ];

        MessageBoxService.infoMessage(calculationInfo, scope, extraMessages);
      }
    }
  };
}]);
