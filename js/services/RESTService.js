"use strict";
var sosApp = angular.module('sosApp');
sosApp.service('RESTService', ['$http', '$q', function($http, $q) {

  //
  // Different configurations
  //


  // PC Site (Production)
  var PRODUCTION_ENDPOINT = 'http://www.starwarsccg.org/wp/wp-content/plugins/swccg-tourny/api.php';

  // Testing (local dev)
  var LOCAL_ENDPOINT = 'http://192.168.33.10/wp-content/plugins/swccg-tourny/api.php';

  // Testing (beta)
  var BETA_ENDPOINT = 'http://www.starwarsccg.org/wp/wp-content/plugins/tomtournytest/swccg-tourny/api.php';


  var DEFAULT_ENDPOINT = PRODUCTION_ENDPOINT;


  var JSON_RESPONSE_START = "====================JSON_RESPONSE_START====================";
  var JSON_RESPONSE_END = "====================JSON_RESPONSE_END====================";

  var currentUser = {
    username: "",
    password: ""
  };


  function getJsonDataFromResponse(response) {
    if (response === null) {
      console.log("JSON response was null. Settings empty object");
      response = "{}";
    }
    var httpResponse = response.toString();
    var jsonStart = httpResponse.indexOf(JSON_RESPONSE_START) + JSON_RESPONSE_START.length;
    var jsonEnd = httpResponse.indexOf(JSON_RESPONSE_END);

    //console.log("Response: " + httpResponse);

    if (jsonStart !== -1 && jsonEnd !== -1) {
      console.log("Found start and end of JSON response");
      var jsonContent = httpResponse.substring(jsonStart, jsonEnd);
      //console.log("JSON CONTENT: " + jsonContent);
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

        // HACK for PHP NOT SETTING HTTP STATUS CODE PROPERLY...
        if (jsonContent.errorMessage) {
          deferred.reject(jsonContent);
          return;
        }

        deferred.resolve(jsonContent);
      })
      .error(function(err) {
        console.log(err);
        // Get just the JSON data out of the response
        var jsonContent = getJsonDataFromResponse(err);
        deferred.reject(jsonContent);
      });
    return deferred.promise;
  };

  this.get = function(url, config) {
    var deferred = $q.defer();
    $http.get(url, config)
      .success(function(response) {
        // Get just the JSON data out of the response
        var jsonContent = getJsonDataFromResponse(response);

        // HACK for PHP NOT SETTING HTTP STATUS CODE PROPERLY...
        if (jsonContent.errorMessage) {
          deferred.reject(jsonContent);
          return;
        }

        deferred.resolve(jsonContent);
      })
      .error(function(err) {
        console.log(err);
        // Get just the JSON data out of the response
        var jsonContent = getJsonDataFromResponse(err);
        deferred.reject(jsonContent);
      });
    return deferred.promise;
  };

  this.delete = function(url) {
    var deferred = $q.defer();
    $http.delete(url)
      .success(function(response) {
        // Get just the JSON data out of the response
        var jsonContent = getJsonDataFromResponse(response);

        // HACK for PHP NOT SETTING HTTP STATUS CODE PROPERLY...
        if (jsonContent.errorMessage) {
          deferred.reject(jsonContent);
          return;
        }

        deferred.resolve(jsonContent);
      })
      .error(function(err) {
        console.log(err);
        // Get just the JSON data out of the response
        var jsonContent = getJsonDataFromResponse(err);
        deferred.reject(jsonContent);
      });
    return deferred.promise;
  };

  function updateCredentials(username, password) {
    currentUser.username = username;
    currentUser.password = password;

    /*
    $http.defaults.headers.post['username'] = username;
    $http.defaults.headers.post['password'] = password;
    */

    $http.defaults.headers.post['username'] = username; //jshint ignore:line
    $http.defaults.headers.post['password'] = password; //jshint ignore:line
  }

  this.isLoggedIn = function() {
    if (currentUser.username !== '' && currentUser !== '') {
      return true;
    }
    return false;
  };

  this.getCurrentUser = function() {
    return currentUser.username;
  };

  function login(username, password) {
    var url = DEFAULT_ENDPOINT + '?endpoint=login';

    updateCredentials(username, password);

    var deferred = $q.defer();
    $http.post(url)
      .success(function(response) {

        // Get just the JSON data out of the response
        var jsonContent = getJsonDataFromResponse(response);

        // HACK for PHP NOT SETTING HTTP STATUS CODE PROPERLY...
        if (jsonContent.errorMessage) {
          deferred.reject(jsonContent);
          return;
        }

        deferred.resolve(jsonContent);
      })
      .error(function(err) {
        console.log(err);

        updateCredentials("", "");

        // Get just the JSON data out of the response
        var jsonContent = getJsonDataFromResponse(err);
        deferred.reject(jsonContent);
      });
    return deferred.promise;
  }


  //
  // API Functions
  //

  this.login = function(username, password) {
    return login(username, password);
  };

  this.logout = function(username, password) {
    var deferred = $q.defer();
    updateCredentials('', '');

    deferred.resolve({});
  };

  this.createTournament = function(tournamentData) {
    var url = DEFAULT_ENDPOINT + '?endpoint=tournaments&tournamentId=' + tournamentData.id;
    return this.post(url, tournamentData);
  };

  this.updateTournament = function(tournamentData) {
    var url = DEFAULT_ENDPOINT + '?endpoint=tournaments&tournamentId=' + tournamentData.id;
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

  this.getUserList = function() {
    var url = DEFAULT_ENDPOINT + '?endpoint=users';
    return this.get(url);
  };

  this.createUser = function(userData) {
    var url = DEFAULT_ENDPOINT + '?endpoint=users&userId=' + userData.id;
    return this.post(url, userData);
  };

  this.updateUser = function(userData, password) {
    var url = DEFAULT_ENDPOINT + '?endpoint=users&userId=' + userData.id;
    return this.post(url, userData);
  };

  this.deleteUser = function(userData, password) {
    var url = DEFAULT_ENDPOINT + '?endpoint=users&userId=' + userData.id;
    return this.delete(url);
  };

  this.ping = function() {
    var url = DEFAULT_ENDPOINT + '?endpoint=ping';

    var config = {
      timeout: 15*1000
    };
    return this.get(url, config);
  };



}]);



//http://192.168.33.10api.php?endpoint=tournaments&tournamentId=XXXXXX&year=YYYYYY&pickers=Yes
