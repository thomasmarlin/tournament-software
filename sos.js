'use strict';
var sosApp = angular.module('sosApp', ['ngAnimate', 'ui.bootstrap', 'ui.bootstrap.tabs', 'angularSpinner']).config(function($locationProvider) { $locationProvider.html5Mode({enabled: true, requireBase: false}); });
sosApp.controller('sos', ['$scope', '$animate', '$animateCss', '$uibModal', '$document', '$compile', '$timeout', '$window', '$location', 'MessageBoxService', 'DataStorage', 'LocalData', 'LoggerService', 'UtilService', 'StatsService', 'TournamentService', 'ConstantsService', 'RESTService', 'CryptoService', function($scope, $animate, $animateCss, $uibModal, $document, $compile, $timeout, $window, $location, MessageBoxService, DataStorage, LocalData, LoggerService, UtilService, StatsService, TournamentService, ConstantsService, RESTService, CryptoService) {

  DataStorage.setNetworkMode(DataStorage.NETWORK_MODES.NETWORK_ONLINE);
  $scope.currentEvent = null;
  $scope.enableDebugTools = false;
  $scope.networkStatus = {
    networkMode: DataStorage.getNetworkMode()
  };
  $scope.displayUserManagement = false;

  var queryParams = $location.search();
  if (queryParams.admin) {
    $scope.displayUserManagement = true;
  }

  console.log("Location data: " + JSON.stringify(queryParams));


  function setOfflineMode() {
    DataStorage.setNetworkMode(DataStorage.NETWORK_MODES.NETWORK_OFFLINE);
    $scope.networkStatus.networkMode = DataStorage.getNetworkMode();
  }

  function setOnlineMode() {
    DataStorage.setNetworkMode(DataStorage.NETWORK_MODES.NETWORK_ONLINE);
    $scope.networkStatus.networkMode = DataStorage.getNetworkMode();
  }

  $scope.toggleOnlineMode = function() {

    function onSaveError() {
      setOfflineMode();
    }

    if (DataStorage.getNetworkMode() === DataStorage.NETWORK_MODES.NETWORK_ONLINE) {
      return;
    }

    var confirmDlg = MessageBoxService.confirmDialog("Continuing will enter ONLINE mode. Any changes you make to this event will be sent up to the SWCCG Server.\n\nAre you sure you want to continue?", $scope);
    confirmDlg.result.then(
      function() {
        setOnlineMode();
        if ($scope.currentEvent) {
          // Trigger a "Save" of this data now.
          $scope.saveData(onSaveError);
        }
      },
      //Cancel
      function() {
        setOfflineMode();
      }
    );
  };

  $scope.toggleOfflineMode = function() {

    if (DataStorage.getNetworkMode() === DataStorage.NETWORK_MODES.NETWORK_OFFLINE) {
      return;
    }

    var confirmDlg = MessageBoxService.confirmDialog("Continuing will enter OFFLINE mode. All changes will be stored inside your browser. \n\nAre you sure you want to continue?", $scope);
    confirmDlg.result.then(
      function() {
        setOfflineMode();
      },
      //Cancel
      function(){
        setOnlineMode();
      }
    );
  };

  function refreshNetworkStatus() {
    $scope.networkStatus.networkMode = DataStorage.getNetworkMode();
  }

  refreshNetworkStatus();


  var newEventData = {
    name: "",
    players: [],
    games: [],
    rounds: [],
    date: new Date().toISOString(),
    mode: ConstantsService.TOURNAMENT_FORMAT.SOS
  };

  function getNewBlankData() {
    return JSON.parse(JSON.stringify(newEventData));
  }

  $scope.getDateString = function() {
    if ($scope.currentEvent.date) {
      var date = new Date($scope.currentEvent.date);
      var dateString = "" + (date.getMonth()+1) + "-";
      dateString += "" + date.getDate() + "-";
      dateString += "" + date.getFullYear();

      return dateString;
    }

    return "Unkonwn Date";
  };


  function createEventWithName(name, mode, players, password, eventDate) {

    var newEvent = getNewBlankData();
    newEvent.name = name;
    newEvent.mode = mode;
    newEvent.date = eventDate;
    newEvent.players = players;
    newEvent.hash = CryptoService.generateHash(password);
    newEvent.id = UtilService.generateGUID();


    if (mode == ConstantsService.TOURNAMENT_FORMAT.MATCH_PLAY) {
      newEvent.seedData = [];
      for (var i = 0; i < players.length; i++) {
        newEvent.seedData.push({
          seedNum: i+1,
          playerId: players[i].id
        });
      }
    }

    $scope.currentEvent = newEvent;
    updateAllStats();
  }

  function selectCurrentRound() {

    if ($scope.currentEvent.mode == ConstantsService.TOURNAMENT_FORMAT.MATCH_PLAY) {
      return;
    }

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

        // Let's make sure we don't have a newer Local copy before we load the remote one.
        LocalData.getTournamentInfo(tournamentId).then(
          function(localData) {
            if ((localData.lastUpdate && data.lastUpdate) && localData.lastUpdate > data.lastUpdate) {
              MessageBoxService.confirmDialog("You have OFFLINE data for this event which is more current than the web data.  Are you sure you want to load the web data?", $scope, "Use Old Data?").result.then(
                function() {
                  // Local data is older
                  loadSpecificJson(data);
                },
                function() {
                  console.log("Load data Cancelled. Offline data is better.");
                  MessageBoxService.infoMessage("To use your OFFLINE data, return to the main page and select 'Manage Offline Data'", $scope);
                }
              )
            } else {
              // Local data is older
              loadSpecificJson(data);
            }
          },
          function() {
            // no local data.  That's OK!
            loadSpecificJson(data);
          }
        );
      },
      function(err) {
        console.log("Error loading event: ", err);
        MessageBoxService.errorMessage("Failed to load event. The event could not be found");
      }
    )
  }


  function getBaseUrl() {
    return $location.protocol() + '://' + $location.host() + ':' + $location.port() + $location.path()
  }

  function loadSpecificJson(evt) {

    $scope.currentEvent = JSON.parse(JSON.stringify(evt));

    $window.location.hash = evt.id;

    updateAllStats();

    selectCurrentRound();
  }

  $scope.goHome = function() {
    var confirmDialog = MessageBoxService.confirmDialog("Warning: All unsaved data will be lost. Are you sure you want to continue?", $scope, "Are You Sure?");
    confirmDialog.result.then(
      function() {

        $window.location.hash = "";
        $window.location.reload();
      }
    );
  };

  $scope.getPlayerRecord = function(playerObject) {
    //return "(444 - 333)";
    var record = "";

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

    // TODO:  If there are any unfinished games, issue a warning
    // Ensure no games in this round
    var currentRoundNum = getCurrentRoundNumber();

    var unfinishedGames = false;
    for (var i = 0; i < $scope.currentEvent.games.length; i++) {
      var game = $scope.currentEvent.games[i];
      if (game.round.num == currentRoundNum) {
        if (!game.winner) {
          unfinishedGames = true;
        }
      }
    }

    if (unfinishedGames) {
      var confirmDialog = MessageBoxService.confirmDialog("This round has games which are not finished. Continuing may create incorrect pairings! Are  you sure?", $scope, "Warning: Unfinished Games!");
      confirmDialog.result.then(
        function() {
          newRoundConfirmed();
        },
        function() {
          console.log("Generate Round with unfinished games:  CANCELLED");
        }
      );
    } else {
      // No unfinished games. We're good to go!
      newRoundConfirmed();
    }

  };


  function updateAllStats() {
    var tournamentWizard = new TournamentService.TournamentWizard($scope.currentEvent, gameCreated);
    tournamentWizard.updateMatchplayStandings();

    StatsService.updateVictoryPoints($scope.currentEvent);
  }


  function newRoundConfirmed() {

    var confirmDialog = MessageBoxService.confirmDialog("Would you like to automatically generate pairings for this game?", $scope, "Auto-generate Pairings?");
    confirmDialog.result.then(
      function() {
        console.log("Confirmed starting auto-pairings.");
        autoGenerateNextRound();
      },
      function() {
        console.log("Manual-mode selected. Just creating new game without pairings");
        manuallyGenerateNextRound();
      }
    );

  }

  function manuallyGenerateNextRound() {
    // Bump the round, but don't auto-generate pairings
    var newRoundNum = getCurrentRoundNumber() + 1;
    $scope.currentEvent.rounds.push({
      num: newRoundNum
    });

    var currentRound = UtilService.getCurrentRound($scope.currentEvent);
    currentRound.decisions = [];

    selectCurrentRound();
  }


  function autoGenerateNextRound() {
    var tournamentWizard = new TournamentService.TournamentWizard($scope.currentEvent, gameCreated);
    var warningMessages = tournamentWizard.newRound();
    var lastDecisions = tournamentWizard.getLastRoundDecisions();
    var currentRound = UtilService.getCurrentRound($scope.currentEvent);
    currentRound.decisions = lastDecisions;

    if (warningMessages.length > 0) {
      MessageBoxService.infoMessage(
        "The following unresolvable problems were detected during pairings:",
        $scope,
        warningMessages);
    }

    selectCurrentRound();
  }


  $scope.getCurrentRound = function() {
    return UtilService.getCurrentRound($scope.currentEvent);
  }


  function getCurrentRoundNumber() {
    return UtilService.getCurrentRoundNumber($scope.currentEvent);
  }
  $scope.getCurrentRoundNumber = getCurrentRoundNumber;


  $scope.getTotalGamesInRound = function() {
    var totalGamesInRound = 0;
    var roundNum = getCurrentRoundNumber();
    for (var i = 0; i < $scope.currentEvent.games.length; i++) {
      var game = $scope.currentEvent.games[i];
      if (game.round.num == roundNum) {
        totalGamesInRound++;
      }
    }
    return totalGamesInRound;
  };

  $scope.toggleTournamentFinished = function() {
    updateAllStats();

    $scope.currentEvent.finished = !$scope.currentEvent.finished;

    if ($scope.currentEvent.finished) {
      $window.scrollTo(0, 0);
    } else {
      MessageBoxService.infoMessage("This tournament has been re-opened and is ready for edits.", $scope);
    }

  }

  $scope.explainPairings = function() {
    var selectedRound = getSelectedRound();

    var modalDialog = $uibModal.open({
        template: explainPairingsHTML,
        controller: 'ExplainPairingsController',
        scope: $scope,
        resolve: {
          gameNumber: function() {
            return selectedRound.num;
          },
          decisions: function() {
            return selectedRound.decisions;
          }
        }
      }
    );

  }

  function getSelectedRound() {
    var selectedRound = null;
    for (var i = 0; i < $scope.currentEvent.rounds.length; i++) {
      var round = $scope.currentEvent.rounds[i];
      if (round.active) {
        selectedRound = round;
      }
    }
    return selectedRound;
  }

  $scope.deleteRound = function() {
    var currentRound = $scope.getCurrentRound();

    // Make sure:
    // #1:  0 games are present in this round
    // #2:  This is the last round.
    var numRounds = $scope.currentEvent.rounds.length;
    var lastRoundIndex = numRounds -1;
    var lastRound = $scope.currentEvent.rounds[lastRoundIndex];

    var selectedRound = getSelectedRound();

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
          },
          allPlayers: function() {
            return $scope.currentEvent.players;
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


  $scope.viewCommandCard = function(player) {
    var modalDialog = $uibModal.open({
        template: commandCardHTML,
        controller: 'CommandCardController',
        scope: $scope,
        resolve: {
          currentEvent: function() {
            return $scope.currentEvent;
          },
          player: function() {
            return player
          }
        }
      });
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
          },
          allPlayers: function() {
            return $scope.currentEvent.players;
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


  $scope.manageOfflineData = function() {
    var modalDialog = $uibModal.open({
        template: manageOfflineDataHTML,
        controller: 'ManageOfflineDataController',
        scope: $scope
      });

    modalDialog.result.then(
      // Success
      function(eventToLoad) {

        // Move into Offline Mode and load the data
        setOfflineMode();
        loadEventById(eventToLoad.id);

      },
      // Cancelled
      function() {
        LoggerService.log("Closed Offlien Data");
      }
    );
  }

  $scope.createEvent = function() {
    var modalDialog = $uibModal.open({
        template: createEventHTML,
        controller: 'CreateEventController',
        scope: $scope,
        resolve: {
          eventData: function() {
            return null;
          }
        }
      });

    modalDialog.result.then(
      // Success
      function(evtData) {
          LoggerService.action("Creating event with name: " + evtData.name + " mode: " + evtData.mode);
          createEventWithName(evtData.name, evtData.mode, evtData.players, evtData.password, evtData.date);
      },
      // Cancelled
      function() {
          LoggerService.log("Create Event : Cancelled");
      }
    );
  }



  $scope.editEvent = function() {
    var modalDialog = $uibModal.open({
        template: createEventHTML,
        controller: 'CreateEventController',
        scope: $scope,
        resolve: {
          eventData: function() {
            return $scope.currentEvent;
          }
        }
      });

    modalDialog.result.then(
      // Success
      function(evtData) {
        $scope.currentEvent.name = evtData.name;
        $scope.currentEvent.date = evtData.date;

        LoggerService.action("Updating event with name: " + evtData.name + " mode: " + evtData.mode);
      },
      // Cancelled
      function() {
          LoggerService.log("Update Event : Cancelled");
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

          updateAllStats();
      },
      // Cancelled
      function() {
          LoggerService.log("Game creation : Cancelled");
      }
    );
  }


  $scope.declareWinner = function(gameToUpdate, winner) {
    $scope.gameToOpen = JSON.parse(JSON.stringify(gameToUpdate));
    $scope.gameToOpen.winner = winner;
    var modalDialog = $uibModal.open({
        template: declareWinnerHTML,
        controller: 'DeclareWinnerController',
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

          updateAllStats();

      },
      // Cancelled
      function() {
          LoggerService.log("Game Update : Cancelled");
      }
    );
  };



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

          updateAllStats();

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
    //element.attr('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));
    var encodedData = encodeURIComponent(text);
    console.log("Encoded length: " + encodedData.length);

    element.attr('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(text));
    element.attr('download', filename);

    //var compiled = $compile(element)($scope);

    //element.css("display", 'none');

    var body = angular.element(document).find('body').eq(0);
    body.append(element)

    $timeout(function(){
      element.get(0).click();

      $timeout(function() {
        element.remove();
      }, 5000);

    }, 5000);

  }


  /*
  $scope.saveData = function(callbackOnError) {
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
          if (callbackOnError) {
            callbackOnError();
          }
      }
    );
  }
  */

  function loginThen(loginSuccessFunc, loginFailedFunc) {
    var modalDialog = $uibModal.open({
        template: loginHTML,
        controller: 'LoginController',
        scope: $scope
      });

    modalDialog.result.then(
      // Success
      function() {
        // User is logged in!
        if (loginSuccessFunc) {
          loginSuccessFunc();
        }
      },
      // Cancelled
      function() {
        LoggerService.log("Login  : Cancelled");
        if (loginFailedFunc) {
          loginFailedFunc();
        }
      }
    );
  }

  $scope.saveData = function(callbackOnError) {

    // If already logged in, just save it
    if (RESTService.isLoggedIn()) {
      saveDataUsingPassword();
      return;
    }

    // Not logged in, so login first, then save.
    var loginSuccessFunc = saveDataUsingPassword;
    var loginFailedFunc = callbackOnError;

    if ($scope.networkStatus.networkMode === DataStorage.NETWORK_MODES.NETWORK_ONLINE) {
      loginThen(loginSuccessFunc, loginFailedFunc);
    } else {
      saveDataUsingPassword();
    }

  }


  function saveDataUsingPassword() {

    DataStorage.saveEventInfo($scope.currentEvent).then(
      function(response) {
        console.log("Data successfully saved!");
        if (DataStorage.isOnline()) {
          MessageBoxService.infoMessage('Save Successful', $scope);
        } else {
          MessageBoxService.infoMessage('IMPORTANT: This data has been saved into your computer (in your browser) and is NOT on the SWCCG Server. To submit data to the Players Committee, you must login.', $scope);
        }
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
    return newGame;
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
        updateAllStats();
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
          (UtilService.peopleEqual(game.winner, playerToDelete)))
      {
          MessageBoxService.infoMessage("This player has active games and cannot be deleted.", $scope, ["You may drop this player by clicking 'Edit Player' and setting their status to 'Dropped'"]);
          return;
      }
    }

    var confirmDialog = MessageBoxService.confirmDialog("Are you sure you want to delete " + playerToDelete.name + "?", $scope, "Are you sure?");
    confirmDialog.result.then(
      function() {
        // Confirmed!
        for (var i = 0; i < $scope.currentEvent.players.length; i++) {
          var player = $scope.currentEvent.players[i];
          if (UtilService.peopleEqual(player, playerToDelete)) {
            $scope.currentEvent.players.splice(i, 1);
            break;
          }
        }

        updateAllStats();
      }
    );

  };

  $scope.isLoggedIn = function() {
    return RESTService.isLoggedIn();
  };
  $scope.getCurrentUser = function() {
    return RESTService.getCurrentUser();
  };
  $scope.logout = function() {
    RESTService.logout();
  };
  $scope.login = function() {
    loginThen(null, null);
  };

  // See if we are online or not by trying to fetch the tournament list
  $scope.checkingNetworkStatus = true;


  RESTService.ping().then(
    function() {
      $scope.checkingNetworkStatus = false;
      console.log("We are online!");

      // Load the current tournament (if available)
      var eventId = $location.hash();
      if (eventId && eventId.trim() !== "") {
        loadEventById(eventId);
      }

    },
    function(){
      $scope.checkingNetworkStatus = false;
      console.log("Error getting tournament list. Prompt for offline mode!");
      var confirmDlg = MessageBoxService.confirmDialog("The Tournament Server could not be reached.  Would you like to work in Offline mode?", $scope, "Work in Offline Mode?");
      confirmDlg.result.then(
        // User wants to go offline!
        function() {
          DataStorage.setNetworkMode(DataStorage.NETWORK_MODES.NETWORK_OFFLINE);
          $scope.networkStatus.networkMode = DataStorage.getNetworkMode();
        },
        //Cancel
        function() {
          DataStorage.setNetworkMode(DataStorage.NETWORK_MODES.NETWORK_ONLINE);
          $scope.networkStatus.networkMode = DataStorage.getNetworkMode();
        }
      );
    }
  )

}]);
