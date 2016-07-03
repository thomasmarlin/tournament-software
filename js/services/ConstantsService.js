"use strict";
var sosApp = angular.module('sosApp');
sosApp.service('ConstantsService', [function() {

  this.TOURNAMENT_FORMAT = {
    SOS: "SOS",
    DIFF: "DIFF",
    MATCH_PLAY: "MATCH_PLAY"
  };

  this.PLAYER_STATUS = {
    STATUS_ACTIVE: "STATUS_ACTIVE",
    STATUS_DROPPED: "STATUS_DROPPED"
  };

}]);
