'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('CommandCardController', ['$scope', '$uibModalInstance', '$timeout', 'ConstantsService', 'StatsService', 'currentEvent', 'player', function($scope, $uibModalInstance, $timeout, ConstantsService, StatsService, currentEvent, player) {

  var i = 0;
  var unsortedGames = [];
  var sortedGames = [];
  var playerId = player.id;
  $scope.player = player;
  $scope.isDiff = currentEvent.mode == ConstantsService.TOURNAMENT_FORMAT.DIFF;

  $scope.commandCardGames = [];

  for (i = 0; i < currentEvent.games.length; i++) {
    var game = currentEvent.games[i];
    if ((game.playerDark.id == playerId) || (game.playerLight.id == playerId)) {
      unsortedGames.push(game);
    }
  }

  console.log("unsortedGames: " + unsortedGames.length);

  while (unsortedGames.length > 0) {
    var lowestRoundGame = unsortedGames[0];
    for (i = 0; i < unsortedGames.length; i++) {
      var unsortedGame = unsortedGames[i];
      if (unsortedGame.round < lowestRoundGame.round) {
        lowestRoundGame = unsortedGame;
      }
    }

    var gameIndex = unsortedGames.indexOf(lowestRoundGame);
    if (gameIndex != -1) {
      unsortedGames.splice(gameIndex, 1);
    }
    sortedGames.push(lowestRoundGame);
  }

  var cumulativeVP = 0;
  var cumulativeDiff = 0;

  console.log("SortedGames: " + sortedGames.length);
  // Build up the displayable games
  for (i = 0; i < sortedGames.length; i++) {
    var existingGame = sortedGames[i];

    var gameNum = existingGame.round.num;
    var lightDark = "Light"
    var opponentName = existingGame.playerDark.name;
    var opponentVp = StatsService.getCachedVpForPlayer(existingGame.playerDark, currentEvent);
    if (existingGame.playerDark.id == playerId) {
      lightDark = "Dark";
      opponentName = existingGame.playerLight.name;
      opponentVp = StatsService.getCachedVpForPlayer(existingGame.playerLight, currentEvent);
    }

    var vp = 0;
    var diff = 0;

    if (existingGame.winner) {
      if (existingGame.winner.id == playerId) {
        // Won the game!
        vp = existingGame.vp;
        diff = existingGame.diff;
      } else {
        // Lost the game!
        vp = 0;
        diff = -1 * existingGame.diff;
      }
    }

    diff = parseInt(diff);
    vp = parseInt(vp);

    cumulativeVP += vp;
    cumulativeDiff += diff;



    var displayGame = {
      num: gameNum,
      side: lightDark,
      opponentName: opponentName,
      opponentVp: opponentVp,
      vp: vp,
      diff: diff,
      cumulativeVP: cumulativeVP,
      cumulativeDiff: cumulativeDiff
    }
    $scope.commandCardGames.push(displayGame);
  }

  $scope.okClick = function() {
    $uibModalInstance.close();
  }

}]);
