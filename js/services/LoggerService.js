"use strict";
var sosApp = angular.module('sosApp');
sosApp.service('LoggerService', [function() {

  this.calculation = function(str) {
    console.log("CALC: " + str);
  };
  this.decision = function(str) {
    console.log("DECISION: " + str);
  };
  this.action = function(str) {
    console.log("ACTION: " + str);
  };
  this.log = function(str) {
    console.log("INFO: " + str);
  };
  this.error = function(str) {
    console.error(str);
  };
}]);
