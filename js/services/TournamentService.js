"use strict";
var sosApp = angular.module('sosApp');
sosApp.service('TournamentService', ['LoggerService', 'UtilService', 'ConstantsService', 'StatsService', function(LoggerService, UtilService, ConstantsService, StatsService) {

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
  this.getByePlayer = getByePlayer;



this.TournamentWizard = function(eventData, gameCreated) {

  function getCurrentRoundNumber() {
    return UtilService.getCurrentRoundNumber(eventData);
  }

  function getCurrentRound() {
    return UtilService.getCurrentRound(eventData);
  }

  function isOddRound() {
    return getCurrentRoundNumber() % 2;
  }


  /**
   * Start a new Round of the tournament, creating all matchups
   *
   * Return a list of warnings generating during the pairing
   */
  this.newRound = function() {

    // Make sure all of our totals are up-to-date before generating new pairings
    StatsService.updateVictoryPoints(eventData);

    // Bump the round
    var newRoundNum = getCurrentRoundNumber() + 1;
    LoggerService.decision("-------- Starting New Round (" + newRoundNum + ")--------");
    if (!isOddRound()) {
      LoggerService.decision("Piles remain the same this round, but Dark/Light will swap");
    }

    eventData.rounds.push({
      num: newRoundNum
    });

    // Start matchups for the next round
    var warningMessages = newMatchups();
    return warningMessages
  }


  function hasPlayedSameAllegiance(player1, p1Dark, player2) {
    for (var i = 0; i < eventData.games.length; i++) {
      var game = eventData.games[i];

      if (p1Dark) {
        if (UtilService.peopleEqual(game.playerDark, player1) && UtilService.peopleEqual(game.playerLight, player2)) {
          return true;
        }
      }

      if (!p1Dark) {
        if (UtilService.peopleEqual(game.playerLight, player1) && UtilService.peopleEqual(game.playerDark, player2)) {
          return true;
        }
      }
    }
    return false;
  }



  function buildPilesSequential(players, darkPile, lightPile) {
    var randBetweenZeroAndOne = Math.random();
    LoggerService.action("Choosing starting allegiance: " + randBetweenZeroAndOne);

    var putDarkPile = true;
    if (randBetweenZeroAndOne > 0.5) {
      putDarkPile = false;
      LoggerService.decision("First command card to light pile!");
    } else {
      putDarkPile = true;
      LoggerService.decision("First command card to dark pile!");
    }

    for (var i = 0; i < players.length; i++) {
      if (putDarkPile) {
        darkPile.push(players[i]);
      } else {
        lightPile.push(players[i]);
      }
      putDarkPile = !putDarkPile;
    }

    LoggerService.log("Separated into piles. Dark: " + darkPile.length + " Light: " + lightPile.length);
  }

  function wasLastGameDark(player) {
    var lastRound = getCurrentRoundNumber() - 1;
    for (var i = 0; i < eventData.games.length; i++) {
      var game = eventData.games[i];
      if (game.round.num == lastRound) {
        if (UtilService.peopleEqual(game.playerDark, player)) {
          return true;
        }

        if (UtilService.peopleEqual(game.playerLight, player)) {
          return false;
        }
      }
    }

    // TODO: This shouldn't happen should it?
    LoggerService.error("Couldn't determine last round (" + lastRound + ") for player: " + JSON.stringify(player))
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

    LoggerService.decision("Separated Command cards into piles:");
    LoggerService.decision("  -- Dark -- ");
    for (var i = 0; i < darkPile.length; i++) {
      LoggerService.decision("  " + i + ". " + UtilService.playerSummaryString(darkPile[i]));
    }
    LoggerService.decision("");
    LoggerService.decision("  -- Light -- ");
    for (var i = 0; i < lightPile.length; i++) {
      LoggerService.decision("  " + i + ". " + UtilService.playerSummaryString(lightPile[i]));
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
    for (var i = 0; i < eventData.games.length; i++) {
      var game = eventData.games[i];
      if (UtilService.peopleEqual(game.playerDark, player) && (isByePlayer(game.playerLight))) {
        byeCount++;
      }
      if (UtilService.peopleEqual(game.playerLight, player) && (isByePlayer(game.playerDark))) {
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


  function isByePlayer(player) {
    return player && player.hasOwnProperty('isByePlayer') && player.isByePlayer;
  }


  function assignByes(darkPile, lightPile) {

    LoggerService.log("Assigning Byes...");

    var currentRound = getCurrentRound();

    var minPlayerByeCount = 0;
    var byeAssigned = false;
    while (!byeAssigned) {

      var idealPile = darkPile;
      var backupPile = lightPile;

      if (darkPile.length == lightPile.length) {
        byeAssigned = true;
        continue;

        // No byes necessary!
        LoggerService.decision("No byes necessary!");

      } else if (darkPile.length > lightPile.length) {

        LoggerService.decision("Dark pile has more players. Trying to assign bye to dark...")
        idealPile = darkPile;
        backupPile = lightPile;

      } else if (lightPile.length > darkPile.length) {

        LoggerService.decision("Light pile has more players. Trying to assign bye to light...");
        idealPile = lightPile;
        backupPile = darkPile;
      }

      var downgradedPlayers = [];
      var candidatePlayer = getWorstPlayerWithByeCount(idealPile, minPlayerByeCount);
      if (candidatePlayer) {
        if (idealPile === darkPile) {
          addNewGame(candidatePlayer, getByePlayer(), currentRound, downgradedPlayers, darkPile, lightPile);
          byeAssigned = true;
          LoggerService.decision("Lowest-rank dark player (with fewest byes) is getting a bye: " + candidatePlayer.name);
        } else {
          addNewGame(getByePlayer(), candidatePlayer, currentRound, downgradedPlayers, darkPile, lightPile);
          byeAssigned = true;
          LoggerService.decision("Lowest-rank dark player (with fewest byes) is getting a bye: " + candidatePlayer.name);
        }
      }

      if (!byeAssigned) {
        // Try the other pile!
        var candidatePlayer = getWorstPlayerWithByeCount(backupPile, minPlayerByeCount);
        if (candidatePlayer) {
          if (backupPile === darkPile) {
            addNewGame(candidatePlayer, getByePlayer(), currentRound, downgradedPlayers, darkPile, lightPile);
            byeAssigned = true;
            LoggerService.decision("Lowest-rank dark player (with fewest byes) is getting a bye: " + candidatePlayer.name);
          } else {
            addNewGame(getByePlayer(), candidatePlayer, currentRound, downgradedPlayers, darkPile, lightPile);
            byeAssigned = true;
            LoggerService.decision("Lowest-rank dark player (fewest byes) is getting a bye: " + candidatePlayer.name);
          }
        }
      }

      if (!byeAssigned) {
        // Apparently, everybody has a bye count of minPlayerByeCount.  See who has the next-fewest byes
        LoggerService.decision("Everyone has a bye count of : " + minPlayerByeCount + ".  Checking for bye counts of: " + minPlayerByeCount + 1);
        minPlayerByeCount++;
      }
    }

    LoggerService.log("Bye Assignment complete: " + byeAssigned);
  }

  function newMatchups() {

    var currentRound = getCurrentRound();
    var currentRoundNum = currentRound.num;
    LoggerService.decision("Generating matchups for round: " + currentRoundNum);

    var allPlayerList = [];
    for (var i = 0; i < eventData.players.length; i++) {
      var player = eventData.players[i];
      if (player.status == ConstantsService.PLAYER_STATUS.STATUS_ACTIVE) {
        allPlayerList.push(player);
      }
    }

    // Always shuffle the player list first
    allPlayerList = UtilService.shuffle(allPlayerList);

    // Sort Players by their scores
    sortPlayersByScore(allPlayerList);


    // Sort players into 2 piles (dark and light)
    var darkPile = [];
    var lightPile = [];
    buildPiles(allPlayerList, darkPile, lightPile);


    // Set a warning flag for the worst-case scenarios
    var warningMessages = [];
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
        LoggerService.error("Light side getting an extra bye!  This should not happen I don't think!");
        addNewGame(getByePlayer(), playerLight, currentRound, downgradedPlayers, darkPile, lightPile);
        warningMessages.push("Light side players recieved an extra bye. 2 Light players will have to play eachother.");

      } else if (playerLight == null) {

        // Dark gets a bye!
        LoggerService.error("Dark side getting an extra bye!  This should not happen I don't think!");
        addNewGame(playerDark, getByePlayer(), currentRound, downgradedPlayers, darkPile, lightPile);
        warningMessages.push("Dark side players recieved an extra bye. 2 Dark players will have to play eachother.");

      } else {

        // We have 2 opponents.  Let's make sure they are ok
        if (!hasPlayedSameAllegiance(playerDark, true, playerLight)) {

          // Sweet! Haven't played this matchup yet.  Commit it!
          addNewGame(playerDark, playerLight, currentRound, downgradedPlayers, darkPile, lightPile);

        } else {

          // They've already played this matchup...see if the reverse is OK
          if (!hasPlayedSameAllegiance(playerLight, true, playerDark)) {

            LoggerService.decision("Matchup between " + playerDark.name + " & " + playerLight.name + " already played. Swapping sides...");
            // No problem!  They haven't played this match yet
            // Just swap allegiances for this matchup
            addNewGame(playerLight, playerDark, currentRound, downgradedPlayers, darkPile, lightPile);

          } else {

            LoggerService.decision("Matchup between " + playerDark.name + " & " + playerLight.name + " already played (both sides). Attempting to move a player down...");

            // Bummer...they've already played both sides against eachother.
            // Pick the lower ranking of the two players and drop them down in the rankings 1 spot.
            var lowerRankedPlayer = getLowerRankedPlayer(playerDark, playerLight);
            if (downgradedPlayers.indexOf(lowerRankedPlayer) == -1) {

              // Haven't tried to downgrade this guy yet!...downgrade him now and try again
              if (UtilService.peopleEqual(lowerRankedPlayer, playerDark)) {
                downgradePlayerRanking(playerDark, darkPile);
              } else if (UtilService.peopleEqual(lowerRankedPlayer,playerLight)) {
                downgradePlayerRanking(playerLight, lightPile);
              }
              downgradedPlayers.push(lowerRankedPlayer);

            } else {

              // Ruh Roh...The players have already played eachother AND downgrading players didn't help.
              // Go ahead and create this game as-is and fire up a warning after we've finished.
              LoggerService.error("Ruh Roh...The players have already played eachother AND downgrading players didn't help... Compromising for now.");
              warningMessages.push("Players: " +  playerDark.name + " and " + playerLight.name + " have already played and no pair-downs were possible. Assigning anyway.");
              addNewGame(playerDark, playerLight, currentRound, downgradedPlayers, darkPile, lightPile);

            }
          }
        }
      }
    }

    return warningMessages;
  }

  function downgradePlayerRanking(playerToMoveDown, pile) {
    LoggerService.decision("Trying to move player down a ranking: " + playerToMoveDown.name);//JSON.stringify(playerToMoveDown));

    for (var i = 0; i < pile.length; i++) {
      var pilePlayer = pile[i];
      if (UtilService.peopleEqual(pilePlayer,playerToMoveDown)) {
        if (pile.length > (i+1)) {
          pile[i] = pile[i+1];
          pile[i+1] = playerToMoveDown;
          LoggerService.log("Succesfully downgraded player...");
        } else {
          LoggerService.error("*sigh....nobody to swap places with...");
          return false;
        }
      }
    }
  }


  function addNewGame(playerDark, playerLight, round, downgradedPlayers, darkPile, lightPile) {
    LoggerService.decision("Creating game for round " + getCurrentRoundNumber() + ". Dark: " + playerDark.name + " Light: " + playerLight.name);

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
    StatsService.updateVictoryPoints(eventData);
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

  function personSortHelper(playerA, playerB) {
    if (playerA.vp > playerB.vp) {
      return -1;
    } else if (playerA.vp < playerB.vp) {
      return 1;
    } else {
      if (eventData.mode === ConstantsService.TOURNAMENT_FORMAT.DIFF) {
        if (playerA.diff > playerB.diff) {
          return -1;
        } else if (playerA.diff < playerB.diff) {
          return 1;
        } else {
          return 0;
        }
      } else if (eventData.mode === ConstantsService.TOURNAMENT_FORMAT.SOS) {
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


  function sortPlayersByScore(players) {
    players.sort(personSortHelper);
    LoggerService.decision("Sorting players by score...");
    for (var i = 0; i < players.length; i++) {
      LoggerService.decision("  " + i + ". " + UtilService.playerSummaryString(players[i]));
    }
  }


  function getLowerRankedPlayer(playerA, playerB) {
    if (personSortHelper(playerA, playerB) < 0) {
      return playerA;
    }
    return playerB;
  }
}


}]);
