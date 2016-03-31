'use strict';
var sosApp = angular.module('sosApp', ['ngAnimate', 'ui.bootstrap', 'ui.bootstrap.tabs', 'angularSpinner']);
sosApp.controller('sos', ['$scope', '$animate', '$animateCss', '$uibModal', '$document', '$compile', '$timeout', '$window', 'MessageBoxService', 'DataStorage', 'LoggerService', 'UtilService', 'StatsService', 'TournamentService', 'ConstantsService', 'RESTService', 'CryptoService', function($scope, $animate, $animateCss, $uibModal, $document, $compile, $timeout, $window, MessageBoxService, DataStorage, LoggerService, UtilService, StatsService, TournamentService, ConstantsService, RESTService, CryptoService) {

  $scope.currentEvent = null;

  $scope.toggleOnlineMode = function() {
    if (DataStorage.getNetworkMode() === DataStorage.NETWORK_MODES.NETWORK_ONLINE) {
      return;
    }

    var confirmDlg = MessageBoxService.confirmDialog("Continuing will enter ONLINE mode. Any changes you make to this event will be sent up to the SWCCG Server.\n\nAre you sure you want to continue?", $scope);
    confirmDlg.result.then(
      function() {
        DataStorage.setNetworkMode(DataStorage.NETWORK_MODES.NETWORK_ONLINE);
        $scope.networkMode = DataStorage.getNetworkMode();
      },
      //Cancel
      function() {
        DataStorage.setNetworkMode(DataStorage.NETWORK_MODES.NETWORK_OFFLINE);
        $scope.networkMode = DataStorage.getNetworkMode();
      }
    );
  };

  $scope.toggleOfflineMode = function() {

    var confirmDlg = MessageBoxService.confirmDialog("Continuing will enter OFFLINE mode. All changes will be stored inside your browser. \n\nAre you sure you want to continue?", $scope);
    confirmDlg.result.then(
      function() {
        DataStorage.setNetworkMode(DataStorage.NETWORK_MODES.NETWORK_OFFLINE);
        $scope.networkMode = DataStorage.getNetworkMode();
      },
      //Caancel
      function(){
        DataStorage.setNetworkMode(DataStorage.NETWORK_MODES.NETWORK_ONLINE);
        $scope.networkMode = DataStorage.getNetworkMode();
      }
    );
  };

  function refreshNetworkStatus() {
    $scope.networkMode = DataStorage.getNetworkMode();
  }

  refreshNetworkStatus();


  var newEventData = {
    name: "",
    players: [],
    games: [],
    rounds: [],
    mode: ConstantsService.TOURNAMENT_FORMAT.SOS
  };

  function getNewBlankData() {
    return JSON.parse(JSON.stringify(newEventData));
  }


  function createEventWithName(name, mode, password) {
    var newEvent = getNewBlankData();
    newEvent.name = name;
    newEvent.mode = mode;
    newEvent.hash = CryptoService.generateHash(password);
    newEvent.id = UtilService.generateGUID();
    $scope.currentEvent = newEvent;
  }

  function selectCurrentRound() {
    $timeout(function(){

      var currentRound = UtilService.getCurrentRound($scope.currentEvent);
      for (var i = 0; i < $scope.currentEvent.rounds.length; i++) {
        var round = $scope.currentEvent.rounds[i];
        if (round != currentRound) {
          round.active = false;
        }
      }
      currentRound.active = true;
      $scope.$apply();

      /*
      var roundNum = getCurrentRoundNumber();
      var roundTab = jQuery('a[href="#round' + roundNum + '"]');
      roundTab.click();
      */
    }, 0);
  }

  function loadEventById(tournamentId) {
    DataStorage.getEventInfo(tournamentId).then(
      function(data) {
        loadSpecificJson(data);
      },
      function(err) {
        MessageBoxService.errorMessage("Failed to load event. The event could not be found");
      }
    )
  }

  function loadSpecificJson(evt) {
    $scope.currentEvent = JSON.parse(JSON.stringify(evt));
    StatsService.updateVictoryPoints($scope.currentEvent);

    selectCurrentRound();
  }

  $scope.goHome = function() {
    var confirmDialog = MessageBoxService.confirmDialog("Warning: All unsaved data will be lost. Are you sure you want to continue?", $scope, "Are You Sure?");
    confirmDialog.result.then(
      function() {
        $window.location.reload();
      }
    );
  };

  $scope.getPlayerRecord = function(playerObject) {
    var record = "ERR";

    for (var i = 0; i < $scope.currentEvent.players.length; i++) {
      var player = $scope.currentEvent.players[i];
      if (player.id == playerObject.id) {
        record = "(" + player.wins + "-" + player.losses + ")";
      }
    }

    return record;
  }

  /**
   * Start a new round and automatically create matchups
   */
  $scope.newRound = function() {

    var tournamentWizard = new TournamentService.TournamentWizard($scope.currentEvent, gameCreated);
    var warningMessages = tournamentWizard.newRound();

    if (warningMessages.length > 0) {
      MessageBoxService.infoMessage(
        "The following unresolvable problems were detected during pairings:",
        $scope,
        warningMessages);
    }

    selectCurrentRound();
  };


  $scope.getCurrentRound = function() {
    return UtilService.getCurrentRound($scope.currentEvent);
  }

  function getCurrentRoundNumber() {
    return UtilService.getCurrentRoundNumber($scope.currentEvent);
  }


  $scope.deleteRound = function() {
    var currentRound = $scope.getCurrentRound();

    // Make sure:
    // #1:  0 games are present in this round
    // #2:  This is the last round.
    var numRounds = $scope.currentEvent.rounds.length;
    var lastRoundIndex = numRounds -1;
    var lastRound = $scope.currentEvent.rounds[lastRoundIndex];

    var selectedRound = null;
    for (var i = 0; i < $scope.currentEvent.rounds.length; i++) {
      var round = $scope.currentEvent.rounds[i];
      if (round.active) {
        selectedRound = round;
      }
    }

    if (!selectedRound) {
      MessageBoxService.errorMessage("There isn't a 'round' selected. Try clicking on one of the 'round' tabs and try again.");
      return;
    }

    console.log("last round num: " + lastRound.num);
    console.log("current round num: " + currentRound.num);

    if (lastRound.num != selectedRound.num) {
      MessageBoxService.errorMessage("You can only delete the last round of an event.");
      return;
    }

    // Ensure no games in this round
    var containsGames = false;
    for (var i = 0; i < $scope.currentEvent.games.length; i++) {
      var game = $scope.currentEvent.games[i];
      if (game.round.num == currentRound.num) {
        containsGames = true;
      }
    }
    if (containsGames) {
      var confirmDialog = MessageBoxService.confirmDialog("This round has active games. Are you sure you want to delete this round?", $scope, "Are You Sure?");
      confirmDialog.result.then(
        function() {
          console.log("Confirmed deletion of round. Removing games!");

          var containsGames = true;
          while (containsGames) {
            containsGames = false;
            for (var i = 0; i < $scope.currentEvent.games.length; i++) {
              var game = $scope.currentEvent.games[i];
              if (game.round.num == currentRound.num) {
                containsGames = true;
                $scope.currentEvent.games.splice(i, 1);
              }
            }
          }

          // All games have been deleted.  Now, kill the round...
          var roundIndex = $scope.currentEvent.rounds.indexOf(currentRound);
          if (roundIndex != -1) {
            $scope.currentEvent.rounds.splice(roundIndex, 1);
          } else {
            MessageBoxService.errorMessage("Could not find the active round!");
          }

        },
        function() {
          console.log("User cancelled game deletion!");
        }
      );

      return;
    }

    // Ok - No games in this round and we are the last round, so just move back a step
    var roundIndex = $scope.currentEvent.rounds.indexOf(currentRound);
    if (roundIndex != -1) {
      $scope.currentEvent.rounds.splice(roundIndex, 1);
    } else {
      MessageBoxService.errorMessage("Could not find the active round!");
    }
  }


  $scope.editPlayer = function(player) {
    var modalDialog = $uibModal.open({
        template: editPlayerHTML,
        controller: 'EditPlayerController',
        scope: $scope,
        resolve: {
          playerToEdit: function() {
            return player;
          }
        }
      });

      modalDialog.result.then(
        //Success
        function(newPlayer) {
          replacePlayer(player.id, newPlayer);
        }
      );
  }

  function replacePlayer(playerId, newPlayer) {

    LoggerService.action("Replacing Player : " + playerId + " with: " + JSON.stringify(newPlayer));

    // First, replace him in the 'players' list
    for (var i = 0; i < $scope.currentEvent.players.length; i++) {
      var player = $scope.currentEvent.players[i];
      if (player.id == playerId) {
        $scope.currentEvent.players[i] = newPlayer;
      }
    }

    // Next, replace the person in all of the games {
    for (var i = 0; i < $scope.currentEvent.games.length; i++) {
      var game = $scope.currentEvent.games[i];
      if (game.playerDark.id == playerId) {
        game.playerDark = newPlayer;
      }
      if (game.playerLight.id == playerId) {
        game.playerLight = newPlayer;
      }
      if (game.winner && game.winner.id == playerId) {
        game.winner = newPlayer;
      }
    }
  }


  $scope.addPlayer = function() {

    var newPlayer = {
      name: "",
      id: UtilService.generateGUID(),
      status: ConstantsService.PLAYER_STATUS.STATUS_ACTIVE
    };

    var modalDialog = $uibModal.open({
        template: editPlayerHTML,
        controller: 'EditPlayerController',
        scope: $scope,
        resolve: {
          playerToEdit: function() {
            return newPlayer;
          }
        }
      });

      modalDialog.result.then(
        // Success
        function(selectedPerson) {
            LoggerService.action("Added Player : " + JSON.stringify(selectedPerson));

            $scope.currentEvent.players.push({
              id: selectedPerson.id,
              name: selectedPerson.name,
              forum_handle: selectedPerson.forum_handle,
              forum_handle_lower: selectedPerson.forum_handle_lower,
              status: ConstantsService.PLAYER_STATUS.STATUS_ACTIVE
            });
        },
        // Cancelled
        function() {
            LoggerService.log("Add Player : Cancelled");
        }
      );
  }

  $scope.createEvent = function() {
    var modalDialog = $uibModal.open({
        template: createEventHTML,
        controller: 'CreateEventController',
        scope: $scope
      });

    modalDialog.result.then(
      // Success
      function(evtData) {
          LoggerService.action("Creating event with name: " + evtData.name + " mode: " + evtData.mode);
          createEventWithName(evtData.name, evtData.mode, evtData.password);
      },
      // Cancelled
      function() {
          LoggerService.log("Create Event : Cancelled");
      }
    );
  }

  $scope.loadEvent = function() {
    var modalDialog = $uibModal.open({
        template: loadEventHTML,
        controller: 'LoadEventController',
        scope: $scope
      });

    modalDialog.result.then(
      // Success
      function(tournamentId, name) {
          LoggerService.action("Loading event with name: " + name + " id: " + tournamentId);
          loadEventById(tournamentId);
      },
      // Cancelled
      function() {
          LoggerService.log("Loading Event : Cancelled");
      }
    );
  }


  $scope.loadEventFromFile = function() {
    var input, file, fr;

    if (typeof window.FileReader !== 'function') {
      alert("The file API isn't supported on this browser yet.");
      return;
    }

    input = angular.element('#fileinput').get(0);
    input.onchange = function() {
      if (!input) {
        alert("Um, couldn't find the fileinput element.");
      }
      else if (!input.files) {
        alert("This browser doesn't seem to support the `files` property of file inputs.");
      }
      else if (!input.files[0]) {
        alert("Please select a file before clicking 'Load'");
      }
      else {
        file = input.files[0];
        fr = new FileReader();
        fr.onload = receivedText;
        fr.readAsText(file);
      }

      function receivedText(e) {
        var lines = e.target.result;
        var newArr = JSON.parse(lines);
        loadSpecificJson(newArr);
        $scope.$apply();
      }
    }
    input.click();
  }

  // createEditGameHTML is generated off of createEditGameHTML at compile-time
  // This is required so that we can run this app in 100% offline-mode
  var createEditGameHtml = createEditGameHTML;


  $scope.createGame = function() {
    var modalDialog = $uibModal.open({
        template: createEditGameHtml,
        controller: 'CreateGameController',
        scope: $scope
      });

    modalDialog.result.then(
      // Success
      function(newGame) {
          LoggerService.action("Manual Game Created  : " + JSON.stringify(newGame));
          gameCreated(newGame);
          StatsService.updateVictoryPoints($scope.currentEvent);
      },
      // Cancelled
      function() {
          LoggerService.log("Game creation : Cancelled");
      }
    );
  }


  $scope.addResult = function(gameToUpdate) {
    $scope.gameToOpen = JSON.parse(JSON.stringify(gameToUpdate));
    var modalDialog = $uibModal.open({
        template: createEditGameHtml,
        controller: 'AssignWinnerController',
        scope: $scope
      });

    modalDialog.result.then(
      // Success
      function(updatedGame) {
          LoggerService.action("Manual Game Updated  : " + JSON.stringify(updatedGame));

          for (var i = 0; i < $scope.currentEvent.games.length; i++) {
            var game = $scope.currentEvent.games[i];
            if (game.id == updatedGame.id) {
              $scope.currentEvent.games[i] = updatedGame;
            }
          }

          StatsService.updateVictoryPoints($scope.currentEvent);

      },
      // Cancelled
      function() {
          LoggerService.log("Game Update : Cancelled");
      }
    );
  }


  $scope.exportData = function() {

    var filename = $scope.currentEvent.name;
    var text = JSON.stringify($scope.currentEvent);

    var elementId = UtilService.generateGUID();
    var element = angular.element('<a id="' + elementId + '">ClickMe</a>');
    element.attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.attr('download', filename);

    var compiled = $compile(element)($scope);

    element.css("display", 'none');

    var body = angular.element(document).find('body').eq(0);
    body.append(element)

    element.get(0).click();
    element.remove();
  }

  $scope.saveData = function() {
    var modalDialog = $uibModal.open({
        template: passwordPromptHTML,
        controller: 'PasswordPromptController',
        scope: $scope
      });

    modalDialog.result.then(
      // Success
      function(password) {
          saveDataUsingPassword(password );
      },
      // Cancelled
      function() {
          LoggerService.log("Loading Event : Cancelled");
      }
    );
  }

  function saveDataUsingPassword(password) {

    DataStorage.saveEventInfo($scope.currentEvent, password).then(
      function(response) {
        console.log("Data successfully saved!");
      },
      function(err) {
        MessageBoxService.errorMessage("Error saving event data.");
      }
    );
  }

  $scope.clearAllData = function(){
    var confirmDialog = MessageBoxService.confirmDialog("This will wipe out all data from all events. Are you sure?");
    confirmDialog.result.then(
      //Confirmed
      function() {
        LoggerService.action("wiping out the world!");
        DataStorage.deleteAllEvents();
      },
      //Cancelled
      function() {
        LoggerService.log("Whew...that was close.")
      }
    );
  }


  function gameCreated(newGame){
    newGame.id = UtilService.generateGUID();
    $scope.currentEvent.games.push(newGame);
    StatsService.updateVictoryPoints($scope.currentEvent);
  }

  $scope.deleteGame = function(gameToDelete) {

    var confirmDialog = MessageBoxService.confirmDialog("This game will be deleted and cannot be undone. Are you sure?");
    confirmDialog.result.then(
      //Confirmed
      function() {
        for (var i = 0; i < $scope.currentEvent.games.length; i++) {
          var game = $scope.currentEvent.games[i];
          if (game.id == gameToDelete.id) {
            $scope.currentEvent.games.splice(i, 1);
            LoggerService.action("Game deleted");
            break;
          }
        }
        StatsService.updateVictoryPoints($scope.currentEvent);
      },
      // Cancelled
      function(){
        console.log("Cancelled Game Deletion...");
      }
    );
  };

  $scope.deletePlayer = function(playerToDelete) {
    for (var i = 0; i < $scope.currentEvent.games.length; i++) {
      var game = $scope.currentEvent.games[i];
      if ((UtilService.peopleEqual(game.playerDark, playerToDelete)) ||
          (UtilService.peopleEqual(game.playerLight, playerToDelete)) ||
          (UtilService.peopleEqual(game.winner, playerToDelete))) {
            alert("Can't delete player. Player has already played a game.");
            return;
      }
    }

    for (var i = 0; i < $scope.currentEvent.players.length; i++) {
      var player = $scope.currentEvent.players[i];
      if (UtilService.peopleEqual(player, playerToDelete)) {
        $scope.currentEvent.players.splice(i, 1);
        break;
      }
    }

    StatsService.updateVictoryPoints($scope.currentEvent);
  };


  // See if we are online or not by trying to fetch the tournament list
  $scope.checkingNetworkStatus = true;
  RESTService.ping().then(
    function() {
      $scope.checkingNetworkStatus = false;
      console.log("We are online!");
    },
    function(){
      $scope.checkingNetworkStatus = false;
      console.log("Error getting tournament list. Prompt for offline mode!");
      var confirmDlg = MessageBoxService.confirmDialog("The Tournament Server could not be reached.  Would you like to work in Offline mode?", $scope, "Work in Offline Mode?");
      confirmDlg.result.then(
        // User wants to go offline!
        function() {
          DataStorage.setNetworkMode(DataStorage.NETWORK_MODES.NETWORK_OFFLINE);
          $scope.networkMode = DataStorage.getNetworkMode();
        },
        //Cancel
        function() {
          DataStorage.setNetworkMode(DataStorage.NETWORK_MODES.NETWORK_ONLINE);
          $scope.networkMode = DataStorage.getNetworkMode();
        }
      );
    }
  )

}]);
