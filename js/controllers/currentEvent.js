"use strict";
var sosApp = angular.module('sosApp');
sosApp.directive('currentEvent', [function() {
  return {
    restrict: 'A',
    template: currentEventHTML,
    link: function(scope, elem, attrs) {
      console.log("Loaded Current Event!");
    }
  };
}]);
