"use strict";
var sosApp = angular.module('sosApp');
sosApp.service('RESTService', ['$http', '$q', 'CryptoService', function($http, $q, CryptoService) {

  //var API_DOMAIN = 'http://192.168.33.10';
  var API_DOMAIN = 'http://www.swtournamentbeta.com';
  var DEFAULT_ENDPOINT = API_DOMAIN + '/wp-content/plugins/swccg-tourny/api.php';

  var JSON_RESPONSE_START = "====================JSON_RESPONSE_START====================";
  var JSON_RESPONSE_END = "====================JSON_RESPONSE_END====================";

  function getJsonDataFromResponse(response) {
    if (response == null) {
      console.log("JSON response was null. Settings empty object");
      response = "{}";
    }
    var httpResponse = response.toString();
    var jsonStart = httpResponse.indexOf(JSON_RESPONSE_START) + JSON_RESPONSE_START.length;
    var jsonEnd = httpResponse.indexOf(JSON_RESPONSE_END);

    console.log("Response: " + httpResponse);

    if (jsonStart != -1 && jsonEnd != -1) {
      console.log("Found start and end of JSON response");
      var jsonContent = httpResponse.substring(jsonStart, jsonEnd);
      console.log("JSON CONTENT: " + jsonContent);
      return JSON.parse(jsonContent);
    } else {
      console.log("Failed to get valid response from server!: " + response);
      return response;
    }
  }

  this.post = function(url, data) {
    var deferred = $q.defer();
    $http.post(url, data)
      .success(function(response) {
        // Get just the JSON data out of the response
        var jsonContent = getJsonDataFromResponse(response);
        deferred.resolve(jsonContent);
      })
      .error(function(err) {
        console.log(err);
        // Get just the JSON data out of the response
        var jsonContent = getJsonDataFromResponse(err);
        deferred.reject(jsonContent);
      });
    return deferred.promise;
  }

  this.get = function(url, config) {
    var deferred = $q.defer();
    $http.get(url, config)
      .success(function(response) {
        // Get just the JSON data out of the response
        var jsonContent = getJsonDataFromResponse(response);
        deferred.resolve(jsonContent);
      })
      .error(function(err) {
        console.log(err);
        // Get just the JSON data out of the response
        var jsonContent = getJsonDataFromResponse(err);
        deferred.reject(jsonContent);
      });
    return deferred.promise;
  }


  //
  // API Functions
  //

  this.createTournament = function(tournamentData) {
    var url = DEFAULT_ENDPOINT + '?endpoint=tournaments&tournamentId=' + tournamentData.id;
    return this.post(url, tournamentData);
  };

  this.updateTournament = function(tournamentData, password) {
    var hash = CryptoService.generateHash(password);
    var url = DEFAULT_ENDPOINT + '?endpoint=tournaments&tournamentId=' + tournamentData.id + '&hash=' + hash;
    return this.post(url, tournamentData);
  };

  this.getTournamentList = function() {
    var url = DEFAULT_ENDPOINT + '?endpoint=tournamentList';
    return this.get(url);
  };

  this.getPlayerList = function() {
    var url = DEFAULT_ENDPOINT + '?endpoint=playerList';
    return this.get(url);
  };

  this.getTournamentInfo = function(tournamentId) {
    var url = DEFAULT_ENDPOINT + '?endpoint=tournaments&tournamentId=' + tournamentId;
    return this.get(url);
  };


  this.ping = function() {
    var url = DEFAULT_ENDPOINT + '?endpoint=ping';

    var config = {
      timeout: 15*1000
    };
    return this.get(url, config);
  };



}]);



//http://192.168.33.10/wp-content/plugins/swccg-tourny/api.php?endpoint=tournaments&tournamentId=XXXXXX&year=YYYYYY&pickers=Yes
