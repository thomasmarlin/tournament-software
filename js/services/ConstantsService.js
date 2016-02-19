"use strict";
var sosApp = angular.module('sosApp');
sosApp.service('ConstantsService', [function() {

  this.TOURNAMENT_FORMAT = {
    SOS: "SOS",
    DIFF: "DIFF"
  };

  this.PLAYER_STATUS = {
    STATUS_ACTIVE: "STATUS_ACTIVE",
    STATUS_DROPPED: "STATUS_DROPPED"
  };

}]);
