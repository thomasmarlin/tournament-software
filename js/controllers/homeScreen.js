"use strict";
var sosApp = angular.module('sosApp');
sosApp.directive('homeScreen', [function() {
  return {
    restrict: 'A',
    template: homeScreenHTML,
    link: function(scope, elem, attrs) {
      console.log("Loading Home Screen!");
    }
  };
}]);
