'use strict';
var sosApp = angular.module('sosApp', ['ui.bootstrap']);
sosApp.controller('sos', ['$scope', '$modal', function($scope, $modal) {

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
    rounds: [
      {
        num: 1
      }
    ]
  };

  function getNewBlankData() {
    return JSON.parse(JSON.stringify(newEventData));
  }


  function createEventWithName(name) {
    var newEvent = getNewBlankData();;
    newEvent.name = name;
    $scope.currentEvent = newEvent;
  }

  function loadEventWithName(eventName) {
    console.log("loading event: " + eventName);
    for (var i = 0; i < $scope.allEvents.length; i++) {
      var evt = $scope.allEvents[i];
      if (evt.name == eventName) {
        $scope.currentEvent = JSON.parse(JSON.stringify(evt));
        updateVictoryPoints();
        return;
      }
    }

    alert("Failed to load event. The event is not present in the system.");
  }

  $scope.newRound = function() {

    var newRoundNum = $scope.getCurrentRound().num + 1;
    $scope.currentEvent.rounds.push({
      num: newRoundNum
    });

    setTimeout(function(){
      jQuery('a[href="#round' + newRoundNum + '"]').click();
    }, 0);
  }

  $scope.getCurrentRound = function() {
    return $scope.currentEvent.rounds[$scope.currentEvent.rounds.length-1];
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
          console.log("Select person : " + JSON.stringify(selectedPerson));
          playerAdded(selectedPerson);
      },
      // Cancelled
      function() {
          console.log("Select person : Cancelled");
      }
    );
  }

  $scope.createEvent = function() {
    var modalDialog = $modal.open({
        template: "<form><div style='margin:20px'>"+
                    "<h2>Create Event</h2>" +
                    "<div>Event Name</div>" +
                    "<input ng-model='evtName' placeholder='ex: 2015 MPC' style='width:100%' autofocus>" +
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
      function(name) {
          console.log("Creating event with name: " + name);
          createEventWithName(name);
      },
      // Cancelled
      function() {
          console.log("Create Event : Cancelled");
      }
    );
  }

  $scope.loadEvent = function() {
    var modalDialog = $modal.open({
        template: "<form><div style='margin:20px'>"+
                    "<h2>Load Existing Event</h2>" +
                    "<select class='input-sm' data-ng-model='tmp.eventNameToLoad' style='min-width:200px' autofocus>" +
                    "  <option value='-- Select Event --'>-- Select Event --</option>" +
                    "  <option ng-repeat='evt in allEvents'>{{evt.name}}</option>" +
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
          console.log("Loading event with name: " + name);
          loadEventWithName(name);
      },
      // Cancelled
      function() {
          console.log("Loading Event : Cancelled");
      }
    );
  }


  var createEditGameHtml = "<form><div style='margin:20px'>"+
              "<h2>Create / Edit Game</h2>" +
              "<div class='row'>" +

                "<div class='col-xs-6'>" +
                  "" +
                  "<div>Player 1</div>" +
                  "<select ng-model='player1' ng-options='player.name for player in currentEvent.players track by player.id' autofocus>" +
                  "</select>" +
                  "" +
                  "<div>Player 2</div>" +
                  "<select ng-model='player2' ng-options='player.name for player in currentEvent.players track by player.id'>" +
                  "</select>" +

                "</div>" +

                "<div class='col-xs-6'>" +
                  "<div>Round</div>" +
                  "<select ng-model='round' ng-options='roundObj.num for roundObj in currentEvent.rounds track by roundObj.num'>" +
                  "</select>" +
                  "" +
                  "<div>Winner</div>" +
                  "<select ng-model='winner'  ng-options='player.name for player in currentEvent.players track by player.id'>" +
                  "</select>" +
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
          console.log("Game Created  : " + JSON.stringify(newGame));
          gameCreated(newGame);
          updateVictoryPoints();
      },
      // Cancelled
      function() {
          console.log("Game creation : Cancelled");
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
          console.log("Game Updated  : " + JSON.stringify(updatedGame));

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
          console.log("Game Update : Cancelled");
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
      //console.log("PeopleEqual!");
      return true;
    } else {
      return false;
    }
  }

  function getOpponentInGame(currentPlayer, game) {
    var opponent = game.player1;
    if (peopleEqual(currentPlayer, game.player1)) {
      opponent = game.player2;
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

      for (var j = 0; j < $scope.currentEvent.games.length; j++) {
        var game = $scope.currentEvent.games[j];

        // Only look at the game if someone one (not in-progress games)
        if (game.winner) {

          // See if the current player played in this game
          if (peopleEqual(player, game.player1) || peopleEqual(player, game.player2)) {

            // Add to list of opponents (if not in the list already)
            var opponent = getOpponentInGame(player, game);
            addToOpponentList(player, opponent);

            // Get winner & victory points
            if (peopleEqual(player, game.winner)) {
              player.vp += game.vp;
              player.wins += 1;
            } else {
              player.losses += 1;
            }
          }
        } else {
          console.log("Game doesn't have a winner!");
        }
      }

      console.log("Victory Points for Player: " + player.name + " : " + player.vp);
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
    console.log("Updating SOS for player: " + currentPlayer.name + " Number of opponents: " + currentPlayer.opponentsPlayed.length);

    var opponentsVictoryPoints = 0;
    var opponentsGamesPlayed = 0;
    for (var i = 0; i < currentPlayer.opponentsPlayed.length; i++) {
      var opponent = currentPlayer.opponentsPlayed[i];
      console.log("  - analyzing opponent: " + opponent.name);

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
              console.log("    ...player has (VP / GP) ratio < 0.5. Updating vp to: " + adjustedVictoryPoints);
          }


          console.log("    ...Adding victory points : " + adjustedVictoryPoints);
          console.log("    ...Adding games played : " + (player.wins + player.losses));
          opponentsVictoryPoints += adjustedVictoryPoints;
          opponentsGamesPlayed += (player.wins + player.losses);
        }
      }
    }

    //console.log("  - Opponents VP: " + opponentsVictoryPoints);
    //console.log("  - Opponents GamesPlayed: " + opponentsGamesPlayed);

    var sos = opponentsVictoryPoints / opponentsGamesPlayed;
    if (opponentsGamesPlayed == 0) {
      sos = "";
    }
    console.log("  - Totals: Opponents' VP: " + opponentsVictoryPoints + " Opponents' GP: " + opponentsGamesPlayed + ".  Calculated SOS: " + sos);
    currentPlayer.sos = sos;
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
      console.log("wiping out the world!");
      localStorage.setItem("allEvents", null);
      localStorage.setItem("data", null);
    } else {
      console.log("Whew...that was close.")
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
      console.log("Error loading stored data!");
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
        console.log("Game deleted");
        break;
      }
    }
    updateVictoryPoints();
  }

  $scope.deletePlayer = function(playerToDelete) {
    for (var i = 0; i < $scope.currentEvent.games.length; i++) {
      var game = $scope.currentEvent.games[i];
      if ((peopleEqual(game.player1, playerToDelete)) ||
          (peopleEqual(game.player2, playerToDelete)) ||
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
