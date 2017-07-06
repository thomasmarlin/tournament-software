'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('PrintPairingsController', ['$scope', '$timeout', '$uibModal', '$uibModalInstance', '$window', 'eventData', 'gameNumber', function($scope, $timeout, $uibModal, $uibModalInstance, $window, eventData, gameNumber) {

  $scope.gameNumber = gameNumber;

  function sortByLightPlayersFunc(gameA, gameB) {
    if (gameA.playerLight.name > gameB.playerLight.name) {
      return 1;
    } else if (gameA.playerLight.name < gameB.playerLight.name) {
      return -1;
    } else {
      return 0;
    }
  }

  function sortByDarkPlayersFunc(gameA, gameB) {
    if (gameA.playerDark.name > gameB.playerDark.name) {
      return 1;
    } else if (gameA.playerDark.name < gameB.playerDark.name) {
      return -1;
    } else {
      return 0;
    }
  }


  var darkPairings = [];
  var lightPairings = [];

  var i = 0;
  var game = null;

  // Get all the games in this round
  var gamesForRound = [];
  for (i = 0; i < eventData.games.length; i++) {
    game = eventData.games[i];
    if (game.round.num == gameNumber) {
      gamesForRound.push(game);
    }
  }

  // Build 2 stacks of game-pairings, but save the table-numbers (indexes) of the games
  for (i = 0; i < gamesForRound.length; i++) {
    game = gamesForRound[i];
    if (game.round.num == gameNumber) {
      var gameCopy = JSON.parse(JSON.stringify(game));
      gameCopy.tableNumber = i+1;
      darkPairings.push(gameCopy);
      lightPairings.push(gameCopy);
    }
  }


  darkPairings.sort(sortByDarkPlayersFunc);
  lightPairings.sort(sortByLightPlayersFunc);

  $scope.darkPairings = darkPairings;
  $scope.lightPairings = lightPairings;


  $scope.close = function() {
    $uibModalInstance.dismiss(null);
  };

  $timeout(function() {

    var printContents = $('#printPairingsNode').html();
    var popupWin = window.open('', '_blank', 'width=800');

    var cssIncludes =
      '<link rel="stylesheet" type="text/css" href="css/bootstrap.min.css">' +
      '<link rel="stylesheet" type="text/css" href="css/sos.css">' +
      '<link rel="stylesheet" type="text/css" href="css/findPlayer.css">' +
      '<link rel="stylesheet" type="text/css" href="css/progress.css">' +
      '<link rel="stylesheet" type="text/css" href="css/shared.css">'

    popupWin.document.open();
    popupWin.document.write('<html><head>' + cssIncludes + '</head><body onload="window.print()">' + printContents + '</body></html>');
    popupWin.document.close();

    $uibModalInstance.dismiss();

  }, 1000);

}]);
