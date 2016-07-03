"use strict";
var sosApp = angular.module('sosApp');
sosApp.directive('matchPlayDisplay', ['$timeout', function($timeout) {
  return {
    restrict: 'A',
    template: matchPlayDisplayHTML
  };
}]);
