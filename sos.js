'use strict';
var sosApp = angular.module('sosApp', ['ui.bootstrap']);
sosApp.controller('sos', ['$scope', '$modal', '$document', '$compile', function($scope, $modal, $document, $compile) {

  var Logger = new function() {
    this.calculation = function(str) {
      console.log("CALC: " + str);
    };
    this.decision = function(str) {
      console.log("DECISION: " + str);
    };
    this.action = function(str) {
      console.log("ACTION: " + str);
    };
    this.log = function(str) {
      console.log("INFO: " + str);
    };
    this.err = function(str) {
      console.error(str);
    };
  };

  var FORMAT = {
    SOS: "SOS",
    DIFF: "DIFF"
  };

  $scope.allEvents = [];
  $scope.currentEvent = null;

  function loadAllEvents() {
    loadData();
  }

  loadAllEvents();

  var newEventData = {
    name: "",
    players: [],
    games: [],
    rounds: [],
    mode: FORMAT.SOS
  };

  function getNewBlankData() {
    return JSON.parse(JSON.stringify(newEventData));
  }


  function createEventWithName(name, mode) {
    var newEvent = getNewBlankData();;
    newEvent.name = name;
    newEvent.mode = mode;
    $scope.currentEvent = newEvent;
  }

  function clickFirstRound() {
    setTimeout(function(){
      var roundNum = getCurrentRoundNumber();
      jQuery('a[href="#round' + roundNum + '"]').click();
    }, 0);
  }

  function loadEventWithName(eventName) {
    Logger.action("loading event: " + eventName);
    for (var i = 0; i < $scope.allEvents.length; i++) {
      var evt = $scope.allEvents[i];
      if (evt.name == eventName) {
        loadSpecificJson(evt);
        /*
        $scope.currentEvent = JSON.parse(JSON.stringify(evt));
        updateVictoryPoints();

        clickFirstRound();
        */
        return;
      }
    }

    alert("Failed to load event. The event is not present in the system.");
  }

  function loadSpecificJson(evt) {
    $scope.currentEvent = JSON.parse(JSON.stringify(evt));
    updateVictoryPoints();

    clickFirstRound();
  }

  function playerSummaryString(player) {
    return player.name + "  (VP: " + player.vp + " SoS: " + player.sos + " Diff: " + player.diff + ")";
  }

  $scope.newRound = function() {


    var newRoundNum = getCurrentRoundNumber() + 1;
    Logger.decision("-------- Starting New Round (" + newRoundNum + ")--------");
    if (!isOddRound()) {
      Logger.decision("Piles remain the same this round, but Dark/Light will swap");
    }

    $scope.currentEvent.rounds.push({
      num: newRoundNum
    });

    updateVictoryPoints();
    newMatchups();

    clickFirstRound();
  };

  function isOddRound() {
    return getCurrentRoundNumber() % 2;
  }

  function hasPlayedSameAllegiance(player1, p1Dark, player2) {
    for (var i = 0; i < $scope.currentEvent.games.length; i++) {
      var game = $scope.currentEvent.games[i];

      if (p1Dark) {
        if (peopleEqual(game.playerDark, player1) && peopleEqual(game.playerLight, player2)) {
          return true;
        }
      }

      if (!p1Dark) {
        if (peopleEqual(game.playerLight, player1) && peopleEqual(game.playerDark, player2)) {
          return true;
        }
      }
    }
    return false;
  }


  // Fisher-Yates (aka Knuth) Shuffle
  // http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
  function shuffle(array) {
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
  }

  function sortPlayersByScore(players) {
    players.sort(personSortHelper);
    Logger.decision("Sorting players by score...");
    for (var i = 0; i < players.length; i++) {
      Logger.decision("  " + i + ". " + playerSummaryString(players[i]));
    }
  }

  function personSortHelper(playerA, playerB) {
    if (playerA.vp > playerB.vp) {
      return -1;
    } else if (playerA.vp < playerB.vp) {
      return 1;
    } else {
      if ($scope.currentEvent.mode == FORMAT.DIFF) {
        if (playerA.diff > playerB.diff) {
          return -1;
        } else if (playerA.diff < playerB.diff) {
          return 1;
        } else {
          return 0;
        }
      } else if ($scope.currentEvent.mode == FORMAT.SOS) {
        if (playerA.sos > playerB.sos) {
          return -1;
        } else if (playerA.sos < playerB.sos) {
          return 1;
        } else {
          return 0;
        }
      }
    }
  }


  function buildPilesSequential(players, darkPile, lightPile) {
    var randBetweenZeroAndOne = Math.random();
    Logger.action("Choosing starting allegiance: " + randBetweenZeroAndOne);

    var putDarkPile = true;
    if (randBetweenZeroAndOne > 0.5) {
      putDarkPile = false;
      Logger.decision("First command card to light pile!");
    } else {
      putDarkPile = true;
      Logger.decision("First command card to dark pile!");
    }

    for (var i = 0; i < players.length; i++) {
      if (putDarkPile) {
        darkPile.push(players[i]);
      } else {
        lightPile.push(players[i]);
      }
      putDarkPile = !putDarkPile;
    }

    Logger.log("Separated into piles. Dark: " + darkPile.length + " Light: " + lightPile.length);
  }

  function wasLastGameDark(player) {
    var lastRound = getCurrentRoundNumber() - 1;
    for (var i = 0; i < $scope.currentEvent.games.length; i++) {
      var game = $scope.currentEvent.games[i];
      if (game.round.num == lastRound) {
        if (peopleEqual(game.playerDark, player)) {
          return true;
        }

        if (peopleEqual(game.playerLight, player)) {
          return false;
        }
      }
    }

    // TODO: This shouldn't happen should it?
    Logger.error("Couldn't determine last round (" + lastRound + ") for player: " + JSON.stringify(player))
    return false;
  }

  function buildPilesSwapAllegience(players, darkPile, lightPile) {
    for (var i = 0; i < players.length; i++) {
      var player = players[i];
      if (wasLastGameDark(player)) {
        lightPile.push(player);
      } else {
        darkPile.push(player);
      }
    }
  }


  function buildPiles(players, darkPile, lightPile) {
    // On the odd rounds, just push them into piles one-one-one-one, etc
    if (isOddRound()) {
      buildPilesSequential(players, darkPile, lightPile);
    } else {
      // This is an even round, so make sure people swap allegiances from last game
      buildPilesSwapAllegience(players, darkPile, lightPile);
    }

    Logger.decision("Separated Command cards into piles:");
    Logger.decision("  -- Dark -- ");
    for (var i = 0; i < darkPile.length; i++) {
      Logger.decision("  " + i + ". " + playerSummaryString(darkPile[i]));
    }
    Logger.decision("");
    Logger.decision("  -- Light -- ");
    for (var i = 0; i < lightPile.length; i++) {
      Logger.decision("  " + i + ". " + playerSummaryString(lightPile[i]));
    }

  };


  function getNextPlayer(pile) {
    if (pile.length == 0) {
      return null;
    }
    return pile[0];
  }

  function getPlayerByeCount(player) {
    var byeCount = 0;
    for (var i = 0; i < $scope.currentEvent.games.length; i++) {
      var game = $scope.currentEvent.games[i];
      if (peopleEqual(game.playerDark, player) && (isByePlayer(game.playerLight))) {
        byeCount++;
      }
      if (peopleEqual(game.playerLight, player) && (isByePlayer(game.playerDark))) {
        byeCount++;
      }
    }
    return byeCount;
  }

  function getWorstPlayerWithByeCount(pile, desiredByCount) {
    for (var i = pile.length-1; i >= 0; i--) {
      var player = pile[i];
      if (desiredByCount == getPlayerByeCount(player)) {
        return player;
      }
    }

    return null;
  }

  function getByePlayer() {
    return {
      name: "BYE",
      isByePlayer: true,
      vp: 0,
      sos: 0.5,
      wins: 0,
      losses: 1
    }
  }

  function isByePlayer(player) {
    return player && player.hasOwnProperty('isByePlayer') && player.isByePlayer;
  }


  function assignByes(darkPile, lightPile, warningsExist) {

    Logger.log("Assigning Byes...");

    var currentRound = $scope.getCurrentRound();

    var minPlayerByeCount = 0;
    var byeAssigned = false;
    while (!byeAssigned) {

      var idealPile = darkPile;
      var backupPile = lightPile;

      if (darkPile.length == lightPile.length) {
        byeAssigned = true;
        continue;

        // No byes necessary!
        Logger.decision("No byes necessary!");

      } else if (darkPile.length > lightPile.length) {

        Logger.decision("Dark pile has more players. Trying to assign bye to dark...")
        idealPile = darkPile;
        backupPile = lightPile;

      } else if (lightPile.length > darkPile.length) {

        Logger.decision("Light pile has more players. Trying to assign bye to light...");
        idealPile = lightPile;
        backupPile = darkPile;
      }

      var downgradedPlayers = [];
      var candidatePlayer = getWorstPlayerWithByeCount(idealPile, minPlayerByeCount);
      if (candidatePlayer) {
        if (idealPile === darkPile) {
          addNewGame(candidatePlayer, getByePlayer(), currentRound, downgradedPlayers, darkPile, lightPile);
          byeAssigned = true;
          Logger.decision("Lowest-rank dark player (with fewest byes) is getting a bye: " + candidatePlayer.name);
        } else {
          addNewGame(getByePlayer(), candidatePlayer, currentRound, downgradedPlayers, darkPile, lightPile);
          byeAssigned = true;
          Logger.decision("Lowest-rank dark player (with fewest byes) is getting a bye: " + candidatePlayer.name);
        }
      }

      if (!byeAssigned) {
        // Try the other pile!
        var candidatePlayer = getWorstPlayerWithByeCount(backupPile, minPlayerByeCount);
        if (candidatePlayer) {
          if (backupPile === darkPile) {
            addNewGame(candidatePlayer, getByePlayer(), currentRound, downgradedPlayers, darkPile, lightPile);
            byeAssigned = true;
            Logger.decision("Lowest-rank dark player (with fewest byes) is getting a bye: " + candidatePlayer.name);
          } else {
            addNewGame(getByePlayer(), candidatePlayer, currentRound, downgradedPlayers, darkPile, lightPile);
            byeAssigned = true;
            Logger.decision("Lowest-rank dark player (fewest byes) is getting a bye: " + candidatePlayer.name);
          }
        }
      }

      if (!byeAssigned) {
        // Apparently, everybody has a bye count of minPlayerByeCount.  See who has the next-fewest byes
        Logger.decision("Everyone has a bye count of : " + minPlayerByeCount + ".  Checking for bye counts of: " + minPlayerByeCount + 1);
        minPlayerByeCount++;
      }
    }

    Logger.log("Bye Assignment complete: " + byeAssigned);
  }

  function newMatchups() {

    var currentRound = $scope.getCurrentRound();
    var currentRoundNum = currentRound.num;
    Logger.decision("Generating matchups for round: " + currentRoundNum);

    var allPlayerList = [];
    for (var i = 0; i < $scope.currentEvent.players.length; i++) {
      var player = $scope.currentEvent.players[i];
      allPlayerList.push(player);
    }

    // Always shuffle the player list first
    allPlayerList = shuffle(allPlayerList);

    // Sort Players by their scores
    sortPlayersByScore(allPlayerList);


    // Sort players into 2 piles (dark and light)
    var darkPile = [];
    var lightPile = [];
    buildPiles(allPlayerList, darkPile, lightPile);


    // Set a warning flag for the worst-case scenarios
    var warningsExist = false;
    var downgradedPlayers = [];

    assignByes(darkPile, lightPile);

    // Now the tricky part...pulling cards off the 2 piles and making sure nobody has the same matchup again
    // Get the first card off of each pile
    while (darkPile.length > 0 || lightPile.length > 0) {

      // Get the next available players from the pile
      var playerDark = getNextPlayer(darkPile);
      var playerLight = getNextPlayer(lightPile);
      if (playerDark == null) {

        // Light side gets a bye!
        Logger.error("Light side getting an extra bye!  This should not happen I don't think!");
        addNewGame(getByePlayer(), playerLight, currentRound, downgradedPlayers, darkPile, lightPile);
        warningsExist = true;

      } else if (playerLight == null) {

        // Dark gets a bye!
        Logger.error("Dark side getting an extra bye!  This should not happen I don't think!");
        addNewGame(playerDark, getByePlayer(), currentRound, downgradedPlayers, darkPile, lightPile);
        warningsExist = true;

      } else {

        // We have 2 opponents.  Let's make sure they are ok
        if (!hasPlayedSameAllegiance(playerDark, true, playerLight)) {

          // Sweet! Haven't played this matchup yet.  Commit it!
          addNewGame(playerDark, playerLight, currentRound, downgradedPlayers, darkPile, lightPile);

        } else {

          // They've already played this matchup...see if the reverse is OK
          if (!hasPlayedSameAllegiance(playerLight, true, playerDark)) {

            Logger.decision("Matchup between " + playerDark.name + " & " + playerLight.name + " already played. Swapping sides...");
            // No problem!  They haven't played this match yet
            // Just swap allegiances for this matchup
            addNewGame(playerLight, playerDark, currentRound, downgradedPlayers, darkPile, lightPile);

          } else {

            Logger.decision("Matchup between " + playerDark.name + " & " + playerLight.name + " already played (both sides). Attempting to move a player down...");

            // Bummer...they've already played both sides against eachother.
            // Pick the lower ranking of the two players and drop them down in the rankings 1 spot.
            var lowerRankedPlayer = getLowerRankedPlayer(playerDark, playerLight);
            if (downgradedPlayers.indexOf(lowerRankedPlayer) == -1) {

              // Haven't tried to downgrade this guy yet!...downgrade him now and try again
              if (peopleEqual(lowerRankedPlayer, playerDark)) {
                downgradePlayerRanking(playerDark, darkPile);
              } else if (peopleEqual(lowerRankedPlayer,playerLight)) {
                downgradePlayerRanking(playerLight, lightPile);
              }
              downgradedPlayers.push(lowerRankedPlayer);

            } else {

              // Ruh Roh...The players have already played eachother AND downgrading players didn't help.
              // Go ahead and create this game as-is and fire up a warning after we've finished.
              Logger.error("Ruh Roh...The players have already played eachother AND downgrading players didn't help... Compromising for now.");
              warningsExist = true;
              addNewGame(playerDark, playerLight, currentRound, downgradedPlayers, darkPile, lightPile);

            }
          }
        }
      }
    }
  }

  function downgradePlayer1Ranking(playerToMoveDown, pile) {
    Logger.decision("Trying to move player down a ranking: " + playerToMoveDown.name);//JSON.stringify(playerToMoveDown));

    for (var i = 0; i < pile.length; i++) {
      var pilePlayer = pile[i];
      if (peopleEqual(pilePlayer,playerToMoveDown)) {
        if (pile.length > (i+1)) {
          pile[i] = pile[i+1];
          pile[i+1] = playerToMoveDown;
          Logger.log("Succesfully downgraded player...");
        } else {
          Logger.error("*sigh....nobody to swap places with...");
          return false;
        }
      }
    }
  }

  function getLowerRankedPlayer(playerA, playerB) {
    if (personSortHelper(playerA, playerB) < 0) {
      return playerA;
    }
    return playerB;
  }

  function addNewGame(playerDark, playerLight, round, downgradedPlayers, darkPile, lightPile) {
    Logger.decision("Creating game for round " + getCurrentRoundNumber() + ". Dark: " + playerDark.name + " Light: " + playerLight.name);

    var winner = null;
    if (isByePlayer(playerDark)) {
      winner = playerLight;
    }
    if (isByePlayer(playerLight)) {
      winner = playerDark;
    }

    var game = {
      playerDark: playerDark,
      playerLight: playerLight,
      winner: winner,
      vp: 2,
      round: round,
      diff: 0
    };

    // Also, now that we have a good matchup, clear out the past state
    removePlayerFromPiles(playerDark, darkPile, lightPile);
    removePlayerFromPiles(playerLight, darkPile, lightPile);
    downgradedPlayers.splice(0, downgradedPlayers.length);

    // Store the new game!
    gameCreated(game);
    updateVictoryPoints();
  }

  function removeFromPile(player, pile) {
    var index = pile.indexOf(player);
    if (index != -1) {
      pile.splice(index, 1);
    }
  }

  function removePlayerFromPiles(player, darkPile, lightPile) {
    removeFromPile(player, darkPile);
    removeFromPile(player, lightPile);
  }


  $scope.getCurrentRound = function() {
    if ($scope.currentEvent.rounds.length == 0) {
      return {
        num: 0
      };
    }
    return $scope.currentEvent.rounds[$scope.currentEvent.rounds.length-1];
  }

  function getCurrentRoundNumber() {
    return $scope.getCurrentRound().num;
    /*
    var currentRound = $scope.getCurrentRound();
    if (currentRound) {
      return currentRound.num;
    }
    return 0;
    */
  }

  $scope.addPlayer = function() {
    var modalDialog = $modal.open({
        template: "<form><div style='margin:20px'>"+
                    "<h2>Create Player</h2>" +
                    "<div>Player Name</div>" +
                    "<input ng-model='newPlayerName' placeholder='ex: John Smith' style='width:100%' autofocus>" +
                    "<hr>" +
                    "<div>" +
                    "  <button class='btn btn-success btn-default' style='float:right' ng-click='okClick()'>OK</button>" +
                    "  <button class='btn btn-fatal' style='float:right;margin-right:5px;' ng-click='cancelClick()'>Cancel</button>" +
                    "  <div style='clear:both'></div>" +
                    "</div>" +
                  "</div></form>",
        controller: 'AddPlayerController',
        scope: $scope
      });

    modalDialog.result.then(
      // Success
      function(selectedPerson) {
          Logger.action("Added Player : " + JSON.stringify(selectedPerson));
          playerAdded(selectedPerson);
      },
      // Cancelled
      function() {
          Logger.log("Select person : Cancelled");
      }
    );
  }

  $scope.createEvent = function() {
    var modalDialog = $modal.open({
        template: "<form><div style='margin:20px'>"+
                    "<h2>Create Event</h2>" +
                    "<div>Event Name</div>" +
                    "<input ng-model='creatingEventData.name' placeholder='ex: 2015 MPC' style='width:100%' autofocus>" +
                    "<label><input type='radio' ng-model='creatingEventData.mode' value='SOS'>  SOS  </label>" +
                    "<div style='width:30px'></div>" +
                    "<label><input type='radio' ng-model='creatingEventData.mode' value='DIFF'>  DIFF  </label>" +
                    "<hr>" +
                    "<div>" +
                    "  <button class='btn btn-success btn-default' style='float:right' ng-click='okClick()'>OK</button>" +
                    "  <button class='btn btn-fatal' style='float:right;margin-right:5px;' ng-click='cancelClick()'>Cancel</button>" +
                    "  <div style='clear:both'></div>" +
                    "</div>" +
                  "</div></form>",
        controller: 'CreateEventController',
        scope: $scope
      });

    modalDialog.result.then(
      // Success
      function(evtData) {
          Logger.action("Creating event with name: " + evtData.name + " mode: " + evtData.mode);
          createEventWithName(evtData.name, evtData.mode);
      },
      // Cancelled
      function() {
          Logger.log("Create Event : Cancelled");
      }
    );
  }

  $scope.loadEvent = function() {
    var modalDialog = $modal.open({
        template: "<form><div style='margin:20px'>"+
                    "<h2>Load Existing Event</h2>" +
                    "<select class='input-sm' data-ng-model='tmp.eventNameToLoad' style='min-width:200px' autofocus>" +
                    "  <option value='-- Select Event --'>-- Select Event --</option>" +
                    "  <option ng-repeat='evt in allEvents track by $index'>{{evt.name}}</option>" +
                    "</select>" +
                    "<hr>" +
                    "<div>" +
                    "  <button class='btn btn-success btn-default' style='float:right' ng-click='okClick()'>OK</button>" +
                    "  <button class='btn btn-fatal' style='float:right;margin-right:5px;' ng-click='cancelClick()'>Cancel</button>" +
                    "  <div style='clear:both'></div>" +
                    "</div>" +
                  "</div></form>",
        controller: 'LoadEventController',
        scope: $scope
      });

    modalDialog.result.then(
      // Success
      function(name) {
          Logger.action("Loading event with name: " + name);
          loadEventWithName(name);
      },
      // Cancelled
      function() {
          Logger.log("Loading Event : Cancelled");
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

  var createEditGameHtml = "<form><div style='margin:20px'>"+
              "<h2>Create / Edit Game</h2>" +
              "<div class='row'>" +

                "<div class='col-xs-6'>" +
                  "" +
                  "<div>Player (DS)</div>" +
                  "<select ng-model='playerDark' ng-options='player.name for player in currentEvent.players track by player.id' autofocus>" +
                  "</select>" +
                  "" +
                  "<div>Player (LS)</div>" +
                  "<select ng-model='playerLight' ng-options='player.name for player in currentEvent.players track by player.id'>" +
                  "</select>" +
                  "" +
                  "<div>Round</div>" +
                  "<select ng-model='round' ng-options='roundObj.num for roundObj in currentEvent.rounds track by roundObj.num'>" +
                  "</select>" +
                  "" +
                "</div>" +

                "<div class='col-xs-6'>" +
                  "" +
                  "<div>Winner</div>" +
                  "<select ng-model='winner' ng-options='player.name for player in getPlayers() track by player.id'>" +
                  "</select>" +
                  "<div>Differential</div>" +
                  "<input ng-model='diff'>" +
                  "" +
                "</div>" +

              "</div>" +
              "<hr>" +
              "" +
              "<div>" +
              "  <button class='btn btn-success btn-default' style='float:right;' ng-click='okClick()'>OK</button>" +
              "  <button class='btn btn-fatal' style='float:right;margin-right:5px;' ng-click='cancelClick()'>Cancel</button>" +
              "  <div style='clear:both'></div>" +
              "</div>" +
            "</div></form>";


  $scope.createGame = function() {
    var modalDialog = $modal.open({
        template: createEditGameHtml,
        controller: 'CreateGameController',
        scope: $scope
      });

    modalDialog.result.then(
      // Success
      function(newGame) {
          Logger.action("Manual Game Created  : " + JSON.stringify(newGame));
          gameCreated(newGame);
          updateVictoryPoints();
      },
      // Cancelled
      function() {
          Logger.log("Game creation : Cancelled");
      }
    );
  }


  $scope.addResult = function(gameToUpdate) {
    $scope.gameToOpen = JSON.parse(JSON.stringify(gameToUpdate));
    var modalDialog = $modal.open({
        template: createEditGameHtml,
        controller: 'AssignWinnerController',
        scope: $scope
      });

    modalDialog.result.then(
      // Success
      function(updatedGame) {
          Logger.action("Manual Game Updated  : " + JSON.stringify(updatedGame));

          for (var i = 0; i < $scope.currentEvent.games.length; i++) {
            var game = $scope.currentEvent.games[i];
            if (game.id == updatedGame.id) {
              $scope.currentEvent.games[i] = updatedGame;
            }
          }

          updateVictoryPoints();

      },
      // Cancelled
      function() {
          Logger.log("Game Update : Cancelled");
      }
    );
  }

  function peopleEqual(p1, p2) {
    if ((p1 == null) && (p2 == null)) {
      return true;
    } else if (p1 == null) {
      return false;
    } else if (p2 == null) {
      return false;
    } else if (p1.id == p2.id) {
      //Logger.log("PeopleEqual!");
      return true;
    } else {
      return false;
    }
  }

  function getOpponentInGame(currentPlayer, game) {
    var opponent = game.playerDark;
    if (peopleEqual(currentPlayer, game.playerDark)) {
      opponent = game.playerLight;
    }
    return opponent;
  }

  function addToOpponentList(currentPlayer, opponent) {
    var opponentAdded = false;
    for (var i = 0; i < currentPlayer.opponentsPlayed.length; i++) {
      var op = currentPlayer.opponentsPlayed[i];
      if (peopleEqual(op, opponent)) {
        opponentAdded = true;
      }
    }

    if (!opponentAdded) {
      currentPlayer.opponentsPlayed.push(opponent);
    }
  }

  function updateVictoryPoints() {
    for (var i = 0; i < $scope.currentEvent.players.length; i++){
      var player = $scope.currentEvent.players[i];
      player.wins = 0;
      player.losses = 0;
      player.vp = 0;
      player.opponentsPlayed = [];
      player.diff = 0;

      for (var j = 0; j < $scope.currentEvent.games.length; j++) {
        var game = $scope.currentEvent.games[j];

        // Only look at the game if someone one (not in-progress games)
        if (game.winner) {

          // See if the current player played in this game
          if (peopleEqual(player, game.playerDark) || peopleEqual(player, game.playerLight)) {

            // Add to list of opponents (if not in the list already)
            var opponent = getOpponentInGame(player, game);
            addToOpponentList(player, opponent);

            // Get winner & victory points
            if (peopleEqual(player, game.winner)) {
              player.vp += game.vp;
              player.wins += 1;
              player.diff += parseInt(game.diff);
            } else {
              player.losses += 1;
              player.diff -= parseInt(game.diff);
            }
          }
        } else {
          Logger.calculation("Game doesn't have a winner!");
        }
      }

      Logger.calculation("Victory Points for Player: " + player.name + " : " + player.vp);
    }

    // Update SOS for each player
    for (var i = 0; i < $scope.currentEvent.players.length; i++) {
      var player = $scope.currentEvent.players[i];
      updateSosForPlayer(player);
    }
  }


  /* SOS Calculations from the SWCCG Tournament Guide:

  9. Strength of Schedule: Strength of Schedule is the recommended scoring method for
     breaking ties at the end of a Swiss tournament that has more than 8 participants.
     The calculation method is as follows:
      •For all of your opponents: Calculate their total victory points, and then
       calculate the total number of games they played. Divide the total VP by the
       total number of games played; this is your Strength of Schedule score.

      •If a player has fewer than .5 victory points per game played, adjust that
       players victory point total so it is equal to .5 VP/GP

      •In the case of two or more players having equal Strength of Schedules,
       drop each player’s lowest opponent until the tie is resolved.

   */

  function updateSosForPlayer(currentPlayer) {
    Logger.log("Updating SOS for player: " + currentPlayer.name + " Number of opponents: " + currentPlayer.opponentsPlayed.length);

    var opponentsVictoryPoints = 0;
    var opponentsGamesPlayed = 0;
    for (var i = 0; i < currentPlayer.opponentsPlayed.length; i++) {
      var opponent = currentPlayer.opponentsPlayed[i];

      Logger.calculation("  - analyzing opponent: " + opponent.name);

      for (var j = 0; j < $scope.currentEvent.players.length; j++) {
        var player = $scope.currentEvent.players[j];
        if (peopleEqual(player, opponent)) {

          var adjustedVictoryPoints = player.vp;

          // Tournament Guide:
          // "If a player has fewer than .5 victory points per game played, adjust that players victory point total so it is equal to .5 VP/GP"
          var playerVictoryPointToGamePlayedRatio = (player.vp / (player.wins + player.losses));
          if (playerVictoryPointToGamePlayedRatio < 0.5) {

              // Need to make this:  (VP / played) = 0.5
              // VP = 0.5 * played
              adjustedVictoryPoints = 0.5 * (player.wins + player.losses);
              Logger.calculation("    ...player has (VP / GP) ratio < 0.5. Updating vp to: " + adjustedVictoryPoints);
          }


          Logger.calculation("    ...Adding victory points : " + adjustedVictoryPoints);
          Logger.calculation("    ...Adding games played : " + (player.wins + player.losses));
          opponentsVictoryPoints += adjustedVictoryPoints;
          opponentsGamesPlayed += (player.wins + player.losses);
        }
      }
    }

    //Logger.log("  - Opponents VP: " + opponentsVictoryPoints);
    //Logger.log("  - Opponents GamesPlayed: " + opponentsGamesPlayed);

    var sos = opponentsVictoryPoints / opponentsGamesPlayed;
    if (opponentsGamesPlayed == 0) {
      sos = "";
    }
    Logger.calculation("  - Totals: Opponents' VP: " + opponentsVictoryPoints + " Opponents' GP: " + opponentsGamesPlayed + ".  Calculated SOS: " + sos);
    currentPlayer.sos = sos;
  }

  $scope.exportData = function() {

    var filename = $scope.currentEvent.name;
    var text = JSON.stringify($scope.currentEvent);

    var elementId = generateGUID();
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

  $scope.saveData = function(){

    var eventAdded = false;
    var eventName = $scope.currentEvent.name;
    for (var i = 0; i < $scope.allEvents.length; i++) {
      var evt = $scope.allEvents[i];
      if (evt.name == $scope.currentEvent.name) {
        $scope.allEvents[i] = $scope.currentEvent;
        eventAdded = true;
      }
    }

    if (!eventAdded) {
      $scope.allEvents.push($scope.currentEvent);
    }

    saveData($scope.allEvents);
  }

  $scope.clearAllData = function(){
    if (confirm("This will wipe out all data from all events. Are you sure?")) {
      Logger.action("wiping out the world!");
      localStorage.setItem("allEvents", null);
      localStorage.setItem("data", null);
    } else {
      Logger.log("Whew...that was close.")
    }
  }

  function loadData() {

    var data = localStorage.data;
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
    $scope.allEvents = allEvents;
  }

  function saveData(events) {
    var storableData = {
      allEvents: JSON.parse(JSON.stringify(events))
    };
    var eventsString = JSON.stringify(storableData);
    localStorage.setItem('data', eventsString);
  }

  function playerAdded(playerName){
    $scope.currentEvent.players.push({
      id: generateGUID(),
      name: playerName
    });
  }

  function gameCreated(newGame){
    newGame.id = generateGUID();
    $scope.currentEvent.games.push(newGame);
    updateVictoryPoints();
  }

  $scope.deleteGame = function(gameToDelete) {

    if (!confirm("This game will be deleted and cannot be undone. Are you sure?")) {
      return;
    }

    for (var i = 0; i < $scope.currentEvent.games.length; i++) {
      var game = $scope.currentEvent.games[i];
      if (game.id == gameToDelete.id) {
        $scope.currentEvent.games.splice(i, 1);
        Logger.action("Game deleted");
        break;
      }
    }
    updateVictoryPoints();
  }

  $scope.deletePlayer = function(playerToDelete) {
    for (var i = 0; i < $scope.currentEvent.games.length; i++) {
      var game = $scope.currentEvent.games[i];
      if ((peopleEqual(game.playerDark, playerToDelete)) ||
          (peopleEqual(game.playerLight, playerToDelete)) ||
          (peopleEqual(game.winner, playerToDelete))) {
            alert("Can't delete player. Player has already played a game.");
            return;
      }
    }

    for (var i = 0; i < $scope.currentEvent.players.length; i++) {
      var player = $scope.currentEvent.players[i];
      if (peopleEqual(player, playerToDelete)) {
        $scope.currentEvent.players.splice(i, 1);
        break;
      }
    }

    updateVictoryPoints();
  }

  function generateGUID() {
    // http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    /*jshint bitwise: false*/
    return   'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
  };

}]);
