'use strict';
var sosApp = angular.module('sosApp', ['ui.bootstrap']);
sosApp.controller('sos', ['$scope', '$modal', function($scope, $modal) {

  var blankData = {
    players: [],
    games: [],
    rounds: [
      {
        num: 1
      }
    ]
  };

  function getNewBlankData() {
    return JSON.parse(JSON.stringify(blankData));
  }

  $scope.data = getNewBlankData();

  $scope.newRound = function() {

    var newRoundNum = $scope.getCurrentRound().num + 1;
    $scope.data.rounds.push({
      num: newRoundNum
    });

    setTimeout(function(){
      jQuery('a[href="#round' + newRoundNum + '"]').click();
    }, 0);
  }

  $scope.getCurrentRound = function() {
    return $scope.data.rounds[$scope.data.rounds.length-1];
  }

  $scope.addPlayer = function() {
    var modalDialog = $modal.open({
        template: "<form><div style='margin:20px'>"+
                    "<h2>Create Player</h2>" +
                    "<div>Player Name</div>" +
                    "<input ng-model='newPlayerName' placeholder='ex: John Smith' style='width:100%'>" +
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


  var createEditGameHtml = "<form><div style='margin:20px'>"+
              "<h2>Create / Edit Game</h2>" +
              "<div class='row'>" +

                "<div class='col-xs-6'>" +
                  "" +
                  "<div>Player 1</div>" +
                  "<select ng-model='player1' ng-options='player.name for player in data.players track by player.id'>" +
                  "</select>" +
                  "" +
                  "<div>Player 2</div>" +
                  "<select ng-model='player2' ng-options='player.name for player in data.players track by player.id'>" +
                  "</select>" +

                "</div>" +

                "<div class='col-xs-6'>" +
                  "<div>Round</div>" +
                  "<select ng-model='round' ng-options='roundObj.num for roundObj in data.rounds track by roundObj.num'>" +
                  "</select>" +
                  "" +
                  "<div>Winner</div>" +
                  "<select ng-model='winner'  ng-options='player.name for player in data.players track by player.id'>" +
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

          for (var i = 0; i < $scope.data.games.length; i++) {
            var game = $scope.data.games[i];
            if (game.id == updatedGame.id) {
              $scope.data.games[i] = updatedGame;
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
      console.log("PeopleEqual!");
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
    for (var i = 0; i < $scope.data.players.length; i++){
      var player = $scope.data.players[i];
      player.wins = 0;
      player.losses = 0;
      player.vp = 0;
      player.opponentsPlayed = [];

      for (var j = 0; j < $scope.data.games.length; j++) {
        var game = $scope.data.games[j];

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
    }

    // Update SOS for each player
    for (var i = 0; i < $scope.data.players.length; i++) {
      var player = $scope.data.players[i];
      updateSosForPlayer(player);
    }
  }

  function updateSosForPlayer(currentPlayer) {

    var opponentsVictoryPoints = 0;
    var opponentsGamesPlayed = 0;
    for (var i = 0; i < currentPlayer.opponentsPlayed.length; i++) {
      var opponent = currentPlayer.opponentsPlayed[i];

      for (var j = 0; j < $scope.data.players.length; j++) {
        var player = $scope.data.players[j];
        if (peopleEqual(player, opponent)) {

          var adjustedVictoryPoints = player.vp;
          var playerVictoryPointToGamePlayedRatio = (player.vp / (player.wins + player.losses));
          if (playerVictoryPointToGamePlayedRatio < 0.5) {
              adjustedVictoryPoints = 0.5 / (player.wins + player.losses);
              console.log("Player: " + JSON.stringify(player) + " has ratio < 0.5. Updating vp to: " + adjustedVictoryPoints);
          }

          opponentsVictoryPoints += adjustedVictoryPoints;
          opponentsGamesPlayed += (player.wins + player.losses);
        }
      }
    }

    var sos = opponentsVictoryPoints / opponentsGamesPlayed;
    if (opponentsGamesPlayed == 0) {
      sos = "";
    }
    currentPlayer.sos = sos;
  }

  $scope.loadData = function(){
    var dataString = localStorage.data;
    $scope.data = JSON.parse(dataString);

    updateVictoryPoints();
  }

  $scope.saveData = function(){
    localStorage.setItem("data", JSON.stringify($scope.data));
  }

  $scope.clearData = function(){
    localStorage.setItem("data", getNewBlankData());
  }

  function playerAdded(playerName){
    $scope.data.players.push({
      id: generateGUID(),
      name: playerName
    });
  }

  function gameCreated(newGame){
    newGame.id = generateGUID();
    $scope.data.games.push(newGame);
    updateVictoryPoints();
  }

  $scope.deleteGame = function(gameToDelete) {
    for (var i = 0; i < $scope.data.games.length; i++) {
      var game = $scope.data.games[i];
      if (game.id == gameToDelete.id) {
        $scope.data.games.splice(i, 1);
        console.log("Game deleted");
        break;
      }
    }
    updateVictoryPoints();
  }

  $scope.deletePlayer = function(playerToDelete) {
    for (var i = 0; i < $scope.data.games.length; i++) {
      var game = $scope.data.games[i];
      if ((peopleEqual(game.player1, playerToDelete)) ||
          (peopleEqual(game.player2, playerToDelete)) ||
          (peopleEqual(game.winner, playerToDelete))) {
            alert("Can't delete player. Player has already played a game.");
            return;
      }
    }

    for (var i = 0; i < $scope.data.players.length; i++) {
      var player = $scope.data.players[i];
      if (peopleEqual(player, playerToDelete)) {
        $scope.data.players.splice(i, 1);
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
