"use strict";
var sosApp = angular.module('sosApp');
sosApp.directive('matchItem', [function() {
  return {
    restrict: 'A',
    template: matchItemHTML,
    scope: {
      matchName: '&',
      eventData: '='
    },
    link: function(scope, element, attrs) {

      scope.matchData = scope.eventData.matches[attrs.matchName];

      scope.$watch(
        function() {
          var p1Name = 'empty';
          var p2Name = 'empty';

          if (scope.eventData.matches[attrs.matchName] &&
              scope.eventData.matches[attrs.matchName].player1) {
            p1Name = scope.eventData.matches[attrs.matchName].player1.name;
          }
          if (scope.eventData.matches[attrs.matchName] &&
              scope.eventData.matches[attrs.matchName].player2) {
            p2Name = scope.eventData.matches[attrs.matchName].player2.name;
          }
          return p1Name + 'vs' + p2Name;
        },
        function() {
          scope.matchData = scope.eventData.matches[attrs.matchName];
        },
        true
      );
    }
  };
}]);
