"use strict";
var sosApp = angular.module('sosApp');
sosApp.directive('gamesDisplay', [function() {
  return {
    restrict: 'A',
    template: gamesDisplayHTML
  };
}]);
