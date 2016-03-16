"use strict";
var sosApp = angular.module('sosApp');
sosApp.service('LocalData', ['$q', 'LoggerService', 'CryptoService', function($q, LoggerService, CryptoService) {

  var LOCAL_STORAGE_KEY = 'LOCAL_STORAGE_KEY';
  var self = this;

  this.loadData = function() {
    var data = localStorage[LOCAL_STORAGE_KEY];
    var allEvents = [];

    try {
      if (data) {
        var parsedData = JSON.parse(data);
        if (parsedData) {
          allEvents = parsedData.allEvents;
        }
      }
    } catch(ex) {
      LoggerService.error("Error loading stored data!");
    }

    return allEvents;
  };

  this.saveData = function(allEvents) {
    var data = localStorage[LOCAL_STORAGE_KEY];

    var storableData = {
      allEvents: JSON.parse(JSON.stringify(allEvents))
    };
    var eventsString = JSON.stringify(storableData);
    localStorage.setItem(LOCAL_STORAGE_KEY, eventsString);
  };


  this.saveEvent = function(event) {
    var allEvents = self.loadData();

    var foundEvent = false;
    for (var i = 0; i < allEvents.length; i++) {
      var existingEvent = allEvents[i];
      if (existingEvent.id == event.id) {
        foundEvent = true;
        allEvents[i] = event;
      }
    }

    if (!foundEvent) {
      allEvents.push(event);
    }

    self.saveData(allEvents);
  };


  this.deleteAllEvents = function() {
    var allEvents = [];
    self.saveData(allEvents);
  }

  // Creates a new tournament
  this.createTournament = function(tournamentData) {
    console.log("Creating new tournament");
    return self.updateTournament(tournamentData);
  };


  // Updates a tournament
  this.updateTournament = function(tournamentData, password) {

    var deferred = $q.defer();

    var hash = CryptoService.generateHash(password);
    if (hash != tournamentData.hash) {
      console.log("Error validating hash! 1: " + hash + "  2: " + tournamentData.hash);
      deferred.reject("Invalid Password");
    } else {
      self.saveEvent(tournamentData);
      deferred.resolve(tournamentData);
    }

    return deferred.promise;
  };

  function isPlayerInList(playerId, playerArray) {

  }

  // Get a list of all of the registered Players
  this.getPlayerList = function() {
    var deferred = $q.defer();
    var allEvents = self.loadData();

    var allPlayers = [];
    for (var i = 0; i < allEvents.length; i++) {
      var existingEvent = allEvents[i];

      for (var j = 0; j < existingEvent.players.length; j++) {
        var player = existingEvent.players[j];
        if (!isPlayerInList(player.id, allPlayers)) {
          allPlayers.push(player);
        }
      }

    }

    var playersResponse = {
      players: allPlayers
    };

    deferred.resolve(playersResponse);

    return deferred.promise;
  }


  // Get a list of all of the Tournament Ids
  this.getTournamentList = function() {
    var deferred = $q.defer();
    var allEvents = self.loadData();

    var eventSummaries = [];
    for (var i = 0; i < allEvents.length; i++) {
      var existingEvent = allEvents[i];
      eventSummaries.push({
        id: existingEvent.id,
        name: existingEvent.name
      });
    }

    var tournamentListResponse = {
      tournaments: eventSummaries
    };

    deferred.resolve(tournamentListResponse);

    return deferred.promise;
  };


  // Gets the specific Tournament Info
  this.getTournamentInfo = function(tournamentId) {
    var deferred = $q.defer();
    var allEvents = self.loadData();

    var foundEvent = false;
    for (var i = 0; i < allEvents.length; i++) {
      var existingEvent = allEvents[i];
      if (existingEvent.id === tournamentId) {
        foundEvent = true;
        deferred.resolve(existingEvent);
      }
    }

    if (!foundEvent) {
      deferred.reject("Failed to find tournament id: " + tournamentId);
    }

    return deferred.promise;
  };


}]);
