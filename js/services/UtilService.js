"use strict";
var sosApp = angular.module('sosApp');
sosApp.service('UtilService', ['ConstantsService', function(ConstantsService) {

  var self = this;

  // Fisher-Yates (aka Knuth) Shuffle
  // http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
  this.shuffle = function(array) {
    var currentIndex = array.length, temporaryValue, randomIndex ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  };

  this.playerSummaryString = function(player) {
    return player.name + "  (VP: " + player.vp + " SoS: " + player.sos + " Diff: " + player.diff + ")";
  }


  this.peopleEqual = function(p1, p2) {
    if ((p1 == null) && (p2 == null)) {
      return true;
    } else if (p1 == null) {
      return false;
    } else if (p2 == null) {
      return false;
    } else if (p1.id == p2.id) {
      return true;
    } else {
      return false;
    }
  };


  this.getCurrentRound = function(eventData) {
    if (eventData.rounds.length == 0) {
      return {
        num: 0
      };
    }
    return eventData.rounds[eventData.rounds.length-1];
  }

  this.getCurrentRoundNumber = function(eventData) {
    return self.getCurrentRound(eventData).num;
  }

  this.generateGUID = function() {
    // http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    /*jshint bitwise: false*/
    return   'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
  };


}]);
