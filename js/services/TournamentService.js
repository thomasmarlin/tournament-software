"use strict";
var sosApp = angular.module('sosApp');
sosApp.service('TournamentService', ['MessageBoxService', 'LoggerService', 'UtilService', 'ConstantsService', 'StatsService', function(MessageBoxService, LoggerService, UtilService, ConstantsService, StatsService) {

  function getByePlayer() {
    return {
      name: "BYE",
      vp: 0,
      sos: 0.5,
      wins: 0,
      losses: 1,
      id: UtilService.generateGUID()
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

  var _decisionList = [];
  function clearDecisions() {
    _decisionList = [];
  }
  function logDecision(decisionString) {
    LoggerService.decision(decisionString);
    _decisionList.push(decisionString);
  }
  this.getLastRoundDecisions = function() {
    return _decisionList;
  }


  /**
   * Start a new Round of the tournament, creating all matchups
   *
   * Return a list of warnings generating during the pairing
   */
  this.newRound = function() {

    clearDecisions();

    // Make sure all of our totals are up-to-date before generating new pairings
    StatsService.updateVictoryPoints(eventData);

    // Bump the round
    var newRoundNum = getCurrentRoundNumber() + 1;
    eventData.rounds.push({
      num: newRoundNum
    });

    logDecision("-------- Starting New Game (" + newRoundNum + ")--------");
    if (!isOddRound()) {
      logDecision("Piles remain the same this game, but Dark/Light will swap");
    }

    // Start matchups for the next round
    var warningMessages = newMatchups();

    // Make sure all of our totals are up-to-date now that we have new assignments
    StatsService.updateVictoryPoints(eventData);

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
      logDecision("Light side was randomly chosen for the first command card! Random number was: " + randBetweenZeroAndOne);
    } else {
      putDarkPile = true;
      logDecision("Dark side was randomly chosen for the first command card!  Random number was: " + randBetweenZeroAndOne);
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

  function wasLastGameBye(player) {
    var lastRound = getCurrentRoundNumber() - 1;
    for (var i = 0; i < eventData.games.length; i++) {
      var game = eventData.games[i];
      if (game.round.num == lastRound) {
        if (UtilService.peopleEqual(game.playerDark, player) || UtilService.peopleEqual(game.playerLight, player)) {
          if (isByePlayer(game.playerDark) || isByePlayer(game.playerLight)) {
            return true;
          }
          return false;
        }
      }
    }

    // TODO: This shouldn't happen should it?
    LoggerService.error("Couldn't determine last round (" + lastRound + ") for player: " + JSON.stringify(player) + " (for checking byes)")
    return false;
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


  function getThisRoundByePlayer() {
    var currentRoundNum = getCurrentRoundNumber();
    for (var i = 0; i < eventData.games.length; i++) {
      var game = eventData.games[i];
      if (game.round.num == lastRound) {
        if (isByePlayer(game.playerDark)) {
          return game.playerLight;
        }
        if (isByePlayer(game.playerLight)) {
          return game.playerDark;
        }
      }
    }
    return null;
  }

  function buildPilesSwapAllegience(players, darkPile, lightPile) {

    var lastGameByePlayer = null;
    for (var i = 0; i < players.length; i++) {
      var player = players[i];

      if (wasLastGameBye(player)) {
        // last game was a bye.  We want to put this player into
        // the stack with the least players.  Save this guy to the end
        lastGameByePlayer = player;

      } else if (wasLastGameDark(player)) {
        lightPile.push(player);
      } else {
        darkPile.push(player);
      }
    }

    // If we have a player who's last game was a bye, put them in the pile
    // with the least players
    // Alwasy re-sort the pile so that we don't get out of order
    if (lastGameByePlayer) {
      if (lightPile.length < darkPile.length) {
        lightPile.push(lastGameByePlayer);
        StatsService.sortPlayersByScore(lightPile, eventData.mode);
      } else {
        darkPile.push(lastGameByePlayer);
        StatsService.sortPlayersByScore(darkPile, eventData.mode);
      }
    }

    evenOutPiles(lightPile, darkPile);
  }

  function evenOutPiles(lightPile, darkPile) {

    if (((lightPile.length + darkPile.length) % 2) !== 0) {
      LoggerService.error("Too many light players (likely due to a drop). Moving a light player into the dark pile.");
      MessageBoxService.errorMessage("Unexpected number of players in piles (should be even after assigning byes). Asignments may be incorrect.");
      return;
    }

    if (lightPile.length > darkPile.length) {
      var splicedPlayer = lightPile.splice(lightPile.length - 1, 1);
      darkPile.push(splicedPlayer[0]);
      logDecision("Too many light players (likely due to a drop). Moving a light player into the dark pile.");
      MessageBoxService.errorMessage("Too many light players present (likely due to a drop). The lowest-rated light player has been moved to the dark side");
    } else if (darkPile.length > lightPile.length) {
      var splicedPlayer = darkPlayer.splice(darkPlayer.length - 1, 1);
      lightPile.push(splicedPlayer[0]);
      logDecision("Too many dark players (likely due to a drop). Moving a dark player into the light pile.");
      MessageBoxService.errorMessage("Too many dark players present (likely due to a drop). The lowest-rated dark player has been moved to the light side");
    }
  }


  function buildPiles(players, darkPile, lightPile) {

    // First, assign a bye if needed
    assignBye(players);

    // On the odd rounds, just push them into piles one-one-one-one, etc
    if (isOddRound()) {
      buildPilesSequential(players, darkPile, lightPile);
    } else {
      // This is an even round, so make sure people swap allegiances from last game
      buildPilesSwapAllegience(players, darkPile, lightPile);
    }

    logDecision("Separated Command cards into piles:");
    logDecision("  -- Dark -- ");
    for (var i = 0; i < darkPile.length; i++) {
      logDecision("  " + i + ". " + UtilService.playerSummaryString(darkPile[i]));
    }
    logDecision("");
    logDecision("  -- Light -- ");
    for (var i = 0; i < lightPile.length; i++) {
      logDecision("  " + i + ". " + UtilService.playerSummaryString(lightPile[i]));
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

  function getWorstPlayerWithByeCount(pile, desiredByeCount) {

    for (var i = pile.length-1; i >= 0; i--) {
      var player = pile[i];
      if (desiredByeCount == getPlayerByeCount(player)) {
        return player;
      }
    }

    return null;
  }


  function isByePlayer(player) {
    return player && (player.name === "BYE");
  }


  function assignBye(players) {
    // The Tournament Guide is being re-worked so that the lowest-ranked player
    // always gets the bye UNLESS they've already been assigned a bye.  If all players
    // have recieved a bye, then it goes back to the lowest-ranked player again

    LoggerService.log("Assigning Byes...");

    if ((players.length % 2) === 0) {
      logDecision("Even number of active players. No byes required");
      return;
    }

    var currentRound = getCurrentRound();

    var minPlayerByeCount = 0;
    var byeAssigned = false;
    while (!byeAssigned) {

      var downgradedPlayers = [];
      var candidatePlayer = getWorstPlayerWithByeCount(players, minPlayerByeCount);
      if (candidatePlayer) {
        logDecision("Lowest-rank player (with fewest byes) is getting a bye: " + candidatePlayer.name);
        addNewGame(getByePlayer(), candidatePlayer, currentRound, downgradedPlayers, players, players, false);
        byeAssigned = true;
      }

      if (!byeAssigned) {
        // Apparently, everybody has a bye count of minPlayerByeCount.  See who has the next-fewest byes
        logDecision("Everyone has a bye count of : " + minPlayerByeCount + ".  Checking for bye counts of: " + minPlayerByeCount + 1);
        minPlayerByeCount++;
      }
    }

    LoggerService.log("Bye Assignment complete: " + byeAssigned);
  }

  /*
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
        logDecision("No byes necessary!");

      } else if (darkPile.length > lightPile.length) {

        logDecision("Dark pile has more players. Trying to assign bye to dark...")
        idealPile = darkPile;
        backupPile = lightPile;

      } else if (lightPile.length > darkPile.length) {

        logDecision("Light pile has more players. Trying to assign bye to light...");
        idealPile = lightPile;
        backupPile = darkPile;
      }

      var downgradedPlayers = [];
      var candidatePlayer = getWorstPlayerWithByeCount(idealPile, minPlayerByeCount);
      if (candidatePlayer) {
        if (idealPile === darkPile) {
          addNewGame(candidatePlayer, getByePlayer(), currentRound, downgradedPlayers, darkPile, lightPile, false);
          byeAssigned = true;
          logDecision("Lowest-rank dark player (with fewest byes) is getting a bye: " + candidatePlayer.name);
        } else {
          addNewGame(getByePlayer(), candidatePlayer, currentRound, downgradedPlayers, darkPile, lightPile, false);
          byeAssigned = true;
          logDecision("Lowest-rank dark player (with fewest byes) is getting a bye: " + candidatePlayer.name);
        }
      }

      if (!byeAssigned) {
        // Try the other pile!
        var candidatePlayer = getWorstPlayerWithByeCount(backupPile, minPlayerByeCount);
        if (candidatePlayer) {
          if (backupPile === darkPile) {
            addNewGame(candidatePlayer, getByePlayer(), currentRound, downgradedPlayers, darkPile, lightPile, false);
            byeAssigned = true;
            logDecision("Lowest-rank dark player (with fewest byes) is getting a bye: " + candidatePlayer.name);
          } else {
            addNewGame(getByePlayer(), candidatePlayer, currentRound, downgradedPlayers, darkPile, lightPile, false);
            byeAssigned = true;
            logDecision("Lowest-rank dark player (fewest byes) is getting a bye: " + candidatePlayer.name);
          }
        }
      }

      if (!byeAssigned) {
        // Apparently, everybody has a bye count of minPlayerByeCount.  See who has the next-fewest byes
        logDecision("Everyone has a bye count of : " + minPlayerByeCount + ".  Checking for bye counts of: " + minPlayerByeCount + 1);
        minPlayerByeCount++;
      }
    }

    LoggerService.log("Bye Assignment complete: " + byeAssigned);
  }
  */

  function getLostCards(player, game) {
    if (player.id == game.playerDark.id) {
      return game.darkLostCards;
    }

    if (player.id == game.playerLight.id) {
      return game.lightLostCards;
    }
    console.log("Failed to get lost cards for game!");
  }


  function areGamesEquivilent(first, second) {
    if ((first.round.num == second.round.num) &&
        (first.playerDark.id == second.playerDark.id) &&
        (first.playerLight.id == second.playerLight.id))
    {
      return true;
    }
    return false;
  }

  function updateGameIfInMatch(game, match) {
    if (!match) { return; }

    if (areGamesEquivilent(match.game1, game)) {
      match.game1 = game;
    } else if (areGamesEquivilent(match.game2, game)) {
      match.game2 = game;
    }
  }

  function propogateGamesToMatchPlay() {
    for (var i = 0; i < eventData.games.length; i++) {
      var game = eventData.games[i];
      updateGameIfInMatch(game, eventData.matches.matchA);
      updateGameIfInMatch(game, eventData.matches.matchB);
      updateGameIfInMatch(game, eventData.matches.matchC);
      updateGameIfInMatch(game, eventData.matches.matchD);
      updateGameIfInMatch(game, eventData.matches.matchE);
      updateGameIfInMatch(game, eventData.matches.matchF);
      updateGameIfInMatch(game, eventData.matches.matchG);
    }
  }

  function resolveMatch(match) {
    if (!match || !match.game1.winner || !match.game2.winner) { return; }

    // Winner is the person with the highest differential.
    // Tiebreakers are:
    // 1) Fewest cards in lost pile
    // 2) Fewest cards out of play

    var player1 = match.game1.playerDark;
    var player2 = match.game1.playerLight;
    var player1Diff = 0;
    var player2Diff = 0;
    var player1LostCards = 0;
    var player2LostCards = 0;

    if (match.game1.winner.id == player1.id) {
      player1Diff += match.game1.diff;
      player2Diff -= match.game1.diff;
      player1LostCards += getLostCards(player1, match.game1);
      player2LostCards += getLostCards(player2, match.game1);
    } else {
      player1Diff -= match.game1.diff;
      player2Diff += match.game1.diff;
      player1LostCards += getLostCards(player1, match.game1);
      player2LostCards += getLostCards(player2, match.game1);
    }

    if (match.game2.winner.id == player1.id) {
      player1Diff += match.game2.diff;
      player2Diff -= match.game2.diff;
      player1LostCards += getLostCards(player1, match.game2);
      player2LostCards += getLostCards(player2, match.game2);
    } else {
      player1Diff -= match.game2.diff;
      player2Diff += match.game2.diff;
      player1LostCards += getLostCards(player1, match.game2);
      player2LostCards += getLostCards(player2, match.game2);
    }

    if (player1Diff > player2Diff) {
      match.winner = player1;
    } else if (player1Diff < player2Diff) {
      match.winner = player2;
    } else if (player1Diff == player2Diff) {
      if (player1LostCards > player2LostCards) {
        match.winner = player2;
      } else if (player1LostCards < player2LostCards) {
        match.winner = player1;
      } else {
        MessageBoxService.errorMessage("Match has a true tie (equal diff, equal cards lost). To resolve this, please modify the Diff of one of the games.", null);
      }
    }
  }


  /*
    For 8-player match play, we use the following system:

    Match A: 1v8
    ......................Match E: Winner-A vs Winner B
    Match B: 4v5

    .................................................................. Match G: Winner-E vs Winner-F

    Match C: 2v7
    ......................Match F: Winner-C vs Winner-D
    Match D: 3v6

  */
  this.updateMatchplayStandings = function() {
    if (eventData.mode !== ConstantsService.TOURNAMENT_FORMAT.MATCH_PLAY) {
      return;
    }

    console.log("updateMatchplayStandings...");
    /*
    var currentRound = getCurrentRound();
    var currentRoundNum = currentRound.num;
    */

    if (!eventData.matches) {
      eventData.matches = {
        matchA: null,
        matchB: null,
        matchC: null,
        matchD: null,
        matchE: null,
        matchF: null,
        matchG: null
      },
      eventData.rounds = [
        {
          num: 1
        },
        {
          num: 2
        },
        {
          num: 3
        }
      ]
    }

    // Update all of the match play games from the standard games
    propogateGamesToMatchPlay();

    // Declare winners of matches (if applicable)
    resolveMatch(eventData.matches.matchA);
    resolveMatch(eventData.matches.matchB);
    resolveMatch(eventData.matches.matchC);
    resolveMatch(eventData.matches.matchD);
    resolveMatch(eventData.matches.matchE);
    resolveMatch(eventData.matches.matchF);
    resolveMatch(eventData.matches.matchG);


    // First-round pairings
    if (eventData.matches.matchA == null) {
      var seed1 = getPlayerWithSeedNumber(1);
      var seed2 = getPlayerWithSeedNumber(2);
      var seed3 = getPlayerWithSeedNumber(3);
      var seed4 = getPlayerWithSeedNumber(4);
      var seed5 = getPlayerWithSeedNumber(5);
      var seed6 = getPlayerWithSeedNumber(6);
      var seed7 = getPlayerWithSeedNumber(7);
      var seed8 = getPlayerWithSeedNumber(8);

      var round1 = UtilService.getRoundNum(1, eventData);


      // Match A:
      var matchAGame1 = addNewGame(seed1, seed8, round1, [], [], [], false);
      var matchAGame2 = addNewGame(seed8, seed1, round1, [], [], [], false);
      eventData.matches.matchA = {
        game1: matchAGame1,
        game2: matchAGame2,
        player1: seed1,
        player2: seed8,
        winner: null
      }

      // Match B:
      var matchBGame1 = addNewGame(seed4, seed5, round1, [], [], [], false);
      var matchBGame2 = addNewGame(seed5, seed4, round1, [], [], [], false);
      eventData.matches.matchB = {
        game1: matchBGame1,
        game2: matchBGame2,
        player1: seed4,
        player2: seed5,
        winner: null
      }

      // Match C:
      var matchCGame1 = addNewGame(seed2, seed7, round1, [], [], [], false);
      var matchCGame2 = addNewGame(seed7, seed2, round1, [], [], [], false);
      eventData.matches.matchC = {
        game1: matchCGame1,
        game2: matchCGame2,
        player1: seed2,
        player2: seed7,
        winner: null
      }

      // Match D:
      var matchDGame1 = addNewGame(seed3, seed6, round1, [], [], [], false);
      var matchDGame2 = addNewGame(seed6, seed3, round1, [], [], [], false);
      eventData.matches.matchD = {
        game1: matchDGame1,
        game2: matchDGame2,
        player1: seed3,
        player2: seed6,
        winner: null
      }

    }

    // Match E pairings
    if (shouldRebuildMatch(eventData.matches.matchE, eventData.matches.matchA, eventData.matches.matchB)) {
      var winnerA = eventData.matches.matchA.winner;
      var winnerB = eventData.matches.matchB.winner;
      if (winnerA && winnerB) {

        var round2 = UtilService.getRoundNum(2, eventData);

        // Match E:
        var matchEGame1 = addNewGame(winnerA, winnerB, round2, [], [], [], false);
        var matchEGame2 = addNewGame(winnerB, winnerA, round2, [], [], [], false);
        eventData.matches.matchE = {
          game1: matchEGame1,
          game2: matchEGame2,
          player1: winnerA,
          player2: winnerB,
          winner: null
        }
      }
    }


    // Match F Pairings
    if (shouldRebuildMatch(eventData.matches.matchF, eventData.matches.matchC, eventData.matches.matchD)) {
      var winnerC = eventData.matches.matchC.winner;
      var winnerD = eventData.matches.matchD.winner;
      if (winnerC && winnerD) {

        var round2 = UtilService.getRoundNum(2, eventData);

        // Match F:
        var matchFGame1 = addNewGame(winnerC, winnerD, round2, [], [], [], false);
        var matchFGame2 = addNewGame(winnerD, winnerC, round2, [], [], [], false);
        eventData.matches.matchF = {
          game1: matchFGame1,
          game2: matchFGame2,
          player1: winnerC,
          player2: winnerD,
          winner: null
        }
      }
    }


    // Match G pairings
    if (shouldRebuildMatch(eventData.matches.matchG, eventData.matches.matchE, eventData.matches.matchF)) {
      var winnerE = eventData.matches.matchE.winner;
      var winnerF = eventData.matches.matchF.winner;
      if (winnerE && winnerF) {

        var round3 = UtilService.getRoundNum(3, eventData);

        // Match G:
        var matchGGame1 = addNewGame(winnerE, winnerF, round3, [], [], [], false);
        var matchGGame2 = addNewGame(winnerF, winnerE, round3, [], [], [], false);
        eventData.matches.matchG = {
          game1: matchGGame1,
          game2: matchGGame2,
          player1: winnerE,
          player2: winnerF,
          winner: null
        }
      }
    }

    console.log("updateMatchplayStandings");
    console.log("matches: " + JSON.stringify(eventData.matches));
  }

  function removeGamesFromMatch(match) {
    var game1 = match.game1;
    if (game1) {
      removeGame(game1);
    }

    var game2 = match.game2;
    if (game2) {
      removeGame(game2);
    }
  }

  function removeGame(game) {
    for (var i = 0; i < eventData.games.length; i++) {
      var existingGame = eventData.games[i];
      if (areGamesEquivilent(existingGame, game)) {
        eventData.games.splice(i, 1);
        return;
      }
    }
  }

  function shouldRebuildMatch(currentMatch, previousMatch1, previousMatch2) {
    if (currentMatch) {

      // Make sure the matchup has the right people!
      if ((!UtilService.peopleEqual(previousMatch1.winner, currentMatch.player1)) &&
          (!UtilService.peopleEqual(previousMatch1.winner, currentMatch.player2)))
      {
        removeGamesFromMatch(currentMatch);
        return true;
      }
      if ((!UtilService.peopleEqual(previousMatch2.winner, currentMatch.player1)) &&
          (!UtilService.peopleEqual(previousMatch2.winner, currentMatch.player2)))
      {
        removeGamesFromMatch(currentMatch);
        return true;
      }

    } else {
      // In this case, we haven't built the new match yet!
      if (previousMatch1 && previousMatch1.winner && previousMatch2 && previousMatch2.winner) {
        return true;
      }
    }

    return false;
  }

  function getPlayer(playerId) {
    for (var i = 0; i < eventData.players.length; i++) {
      var player = eventData.players[i];
      if (player.id == playerId) {
        return player;
      }
    }
    console.log("Failed to get player with ID: " + playerId);
    return null;
  }

  function getPlayerWithSeedNumber(num) {
    for (var i = 0; i < eventData.seedData.length; i++) {
      var seedInfo = eventData.seedData[i];
      if (num == seedInfo.seedNum) {
        var playerId = seedInfo.playerId;
        return getPlayer(playerId);
      }
    }
    console.log("Failed to get player at seed number: " + num);
    return null;
  }


  /*
  function newMatchupsMatchPlay() {
    // The strategy for running to create pairs.
    // For the first round, build an array of pairs. This array is a round.
    // For the next round, build a 2nd array containing pairings of the winners

    // Structure for match play is:
    //

    //Game 1:
    //SeedBest vs SeedWorst
    //Seed2Best vs Seed2Worst
    //Seed3Best vs Seed3Worst
    //Seed4Best vs Seed4Worst


    var currentRound = getCurrentRound();
    var currentRoundNum = currentRound.num;

    var activePlayers = [];

    if (currentRoundNum == 0) {
      // Add all of the players!
      activePlayers = JSON.parse(JSON.stringify(eventData.players));
    } else {
      // Not the first round, so get the winners from the previous round.
      var previousRound = currentRoundNum - 1;
      for (var i = 0; i < eventData.games.length; i++) {
        var game = eventData.games[i];
        if (game.round.num == previousRound) {
          if (game.winner) {
            activePlayers.push(JSON.parse(JSON.stringify(game.winner)));
          }
        }
      }
    }

    // Odd number of players. Give the highest rated player a bye
    if (activePlayers.length % 2 == 1) {
      var highSeed = getHighestSeedPlayer(activePlayers);
      addNewGame(highSeed, getByePlayer(), currentRound, [], activePlayers, activePlayers, false);
    }

    // Assign the rest of the players to games, picking off the highest and lowest seed each time
    while (activePlayers.length > 0) {

    }
  }


  function removePlayerFromList(player, playerList) {
    var index = playerList.indexOf(player);
    if (index !== -1) {
      playerList.splice(index, 1);
    }
  }


  function getSeedNumForPlayer(player) {
    for (var i = 0; i < eventData.seedData.length; i++) {
      var seedInfo = eventData.seedData[i];
      if (player.id == seedInfo.playerId) {
        return seedInfo.seedNum;
      }
    }
    console.log("Failed to get seed number for player: " + JSON.stringify(player));
    return -1;
  }

  function getHighestSeedPlayer(players) {
    var highSeed = players[0];
    for (var i = 0; i < players.length; i++) {
      var player = players[i];
      var seedNum = getSeedNumForPlayer(player);
      if (seedNum > highSeed) {
        highSeed = player;
      }
    }

    return highSeed;
  }

  function getLowestSeedPlayer(players) {
    var lowSeed = players[0];
    for (var i = 0; i < players.length; i++) {
      var player = players[i];
      var seedNum = getSeedNumForPlayer(player);
      if (seedNum < lowSeed) {
        lowSeed = player;
      }
    }

    return lowSeed;
  }
  */


  function newMatchups() {

    var currentRound = getCurrentRound();
    var currentRoundNum = currentRound.num;
    logDecision("Generating matchups for round: " + currentRoundNum);

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
    StatsService.sortPlayersByScore(allPlayerList, eventData.mode);


    // Sort players into 2 piles (dark and light)
    var darkPile = [];
    var lightPile = [];

    buildPiles(allPlayerList, darkPile, lightPile);


    // Set a warning flag for the worst-case scenarios
    var warningMessages = [];

    // Keep track of which player has been downgraded. If we ever try to
    // downgrade this player again without creating a game in between,
    // then we need to abort (likely in a loop)
    var downgradedPlayers = [];


    // Now the tricky part...pulling cards off the 2 piles and making sure nobody has the same matchup again
    // Get the first card off of each pile
    while (darkPile.length > 0 || lightPile.length > 0) {

      // Get the next available players from the pile
      var playerDark = getNextPlayer(darkPile);
      var playerLight = getNextPlayer(lightPile);
      if (playerDark == null) {

        // Light side gets a bye!
        logDecision("Light side has an extra player somehow.  This must be manually corrected by the TD");

        LoggerService.error("Light side getting an extra bye!  This should not happen I don't think!");
        addNewGame(getByePlayer(), playerLight, currentRound, downgradedPlayers, darkPile, lightPile, false);
        warningMessages.push("Light side players recieved an extra bye. There were not enough dark side players to play against.");
        downgradedPlayers = [];

      } else if (playerLight == null) {

        // Dark gets a bye!
        logDecision("Dark side has an extra player somehow.  This must be manually corrected by the TD");

        LoggerService.error("Dark side getting an extra bye!  This should not happen I don't think!");
        addNewGame(playerDark, getByePlayer(), currentRound, downgradedPlayers, darkPile, lightPile, false);
        warningMessages.push("Dark side players recieved an extra bye. There were not enough light side players to play against.");
        downgradedPlayers = [];

      } else {

        // We have 2 opponents.  Let's make sure they are ok
        if (!hasPlayedSameAllegiance(playerDark, true, playerLight)) {

          // Sweet! Haven't played this matchup yet.  Commit it!
          addNewGame(playerDark, playerLight, currentRound, downgradedPlayers, darkPile, lightPile, false);
          downgradedPlayers = [];

        } else {

          // They've already played this matchup...see if the reverse is OK
          if (!hasPlayedSameAllegiance(playerLight, true, playerDark)) {

            logDecision("Matchup between " + playerDark.name + " & " + playerLight.name + " already played. Swapping sides...");
            // No problem!  They haven't played this match yet
            // Just swap allegiances for this matchup
            addNewGame(playerLight, playerDark, currentRound, downgradedPlayers, darkPile, lightPile, false);
            downgradedPlayers = [];

          } else {

            logDecision("Matchup between " + playerDark.name + " & " + playerLight.name + " already played (both sides). Attempting to move lower-ranked player down...");

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
              LoggerService.error("Ruh Roh...Players: " +  playerDark.name + " and " + playerLight.name + " have already played and no pair-downs were possible. Assigning anyway and TD can resolve...");
              logDecision("Ruh Roh...Players: " +  playerDark.name + " and " + playerLight.name + " have already played and no pair-downs were possible. Assigning anyway and TD can resolve...");
              warningMessages.push("Players: " +  playerDark.name + " and " + playerLight.name + " have already played and no pair-downs were possible. Assigning anyway. The TD must resolve this manually.");
              addNewGame(playerDark, playerLight, currentRound, downgradedPlayers, darkPile, lightPile, false);
              downgradedPlayers = [];

            }
          }
        }
      }
    }

    return warningMessages;
  }

  function downgradePlayerRanking(playerToMoveDown, pile) {
    logDecision("Trying to move player down a ranking: " + playerToMoveDown.name);//JSON.stringify(playerToMoveDown));

    for (var i = 0; i < pile.length; i++) {
      var pilePlayer = pile[i];
      if (UtilService.peopleEqual(pilePlayer, playerToMoveDown)) {
        if (pile.length > (i+1)) {
          pile[i] = pile[i+1];
          pile[i+1] = playerToMoveDown;
          LoggerService.log("Succesfully downgraded player...");
          return true;
        } else {
          LoggerService.error("*sigh....nobody to swap places with...");
          return false;
        }
      }
    }
  }


  function addNewGame(playerDark, playerLight, round, downgradedPlayers, darkPile, lightPile, updatePointsWhenDone) {
    logDecision("Creating next game for game #" + getCurrentRoundNumber() + ". Dark: " + playerDark.name + " Light: " + playerLight.name);

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
      diff: 0,
      darkLostCards: 0,
      lightLostCards: 0
    };

    // Also, now that we have a good matchup, clear out the past state
    removePlayerFromPiles(playerDark, darkPile, lightPile);
    removePlayerFromPiles(playerLight, darkPile, lightPile);
    downgradedPlayers.splice(0, downgradedPlayers.length);

    // Store the new game!
    var createdGame = gameCreated(game);

    if (updatePointsWhenDone) {
      StatsService.updateVictoryPoints(eventData);
    }

    return createdGame;
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


  function getLowerRankedPlayer(playerA, playerB) {

    var personSortFunc = StatsService.getSortFunc(eventData.mode);

    // Note:  Sort function is reversed from normal. Instead of lowest-first
    //        it sorts as highest-first
    if (personSortFunc(playerA, playerB) > 0) {
      return playerA;
    }
    return playerB;
  }
}


}]);
