"use strict";
var sosApp = angular.module('sosApp');
sosApp.service('DataStorage', ['RESTService', 'LocalData', '$q', function(APIService, LocalData, $q) {

  var self = this;

  this.NETWORK_MODES = {
    NETWORK_OFFLINE: "NETWORK_OFFLINE",
    NETWORK_ONLINE: "NETWORK_ONLINE"
  };

  var networkMode = self.NETWORK_MODES.NETWORK_ONLINE;

  this.setNetworkMode = function(newMode) {
    networkMode = newMode;
  }

  this.getNetworkMode = function() {
    return networkMode;
  }

  this.getPlayerList = function() {
    var promise = null;
    if (networkMode == self.NETWORK_MODES.NETWORK_ONLINE) {
      promise = APIService.getPlayerList();
    } else {
      promise = LocalData.getPlayerList();
    }
    return promise;
  };

  this.getEventNames = function() {
    var promise = null;
    if (networkMode == self.NETWORK_MODES.NETWORK_ONLINE) {
      promise = APIService.getTournamentList();
    } else {
      promise = LocalData.getTournamentList();
    }
    return promise;
  };

  this.getEventInfo = function(tournamentId) {
    var promise = null;
    if (networkMode == self.NETWORK_MODES.NETWORK_ONLINE) {
      promise = APIService.getTournamentInfo(tournamentId);
    } else {
      promise = LocalData.getTournamentInfo(tournamentId);
    }
    return promise;
  };

  this.saveEventInfo = function(tournamentData, password) {

    var deferred = $q.defer();

    // Add the current timestamp
    tournamentData.lastUpdate = new Date().toISOString();

    // Always save locally first, and the push to the server
    var localPromise = LocalData.updateTournament(tournamentData, password);
    localPromise.then(
      function(response) {

        if (networkMode == self.NETWORK_MODES.NETWORK_ONLINE) {

          // Local update succeeded. Do a remote update too
          var remotePromise = APIService.updateTournament(tournamentData, password);
          remotePromise.then(
            function(response) {
              // Remote succeeded.
              deferred.resolve(response);
            },
            function(err) {
              // Remote Failed!
              deferred.reject(err);
            }
          );

        } else {
          // Offline mode, so don't push to the server
          deferred.resolve(response);
        }
      },
      function(err) {
        // Local update failed!  Uh....
        deferred.reject(err);
      }
    );

    return deferred.promise;
  };

}]);
