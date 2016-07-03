"use strict";
var sosApp = angular.module('sosApp');
sosApp.directive('playerDisplay', [function() {
  return {
    restrict: 'A',
    template: playerDisplayHTML
  };
}]);
