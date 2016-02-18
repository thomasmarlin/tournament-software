"use strict";
var sosApp = angular.module('sosApp');
sosApp.service('LocalData', ['$q', function($q) {

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
      Logger.error("Error loading stored data!");
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
  this.updateTournament = function(tournamentData) {
    var deferred = $q.defer();
    self.saveEvent(tournamentData);
    deferred.resolve(tournamentData);

    return deferred.promise;
  };


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
