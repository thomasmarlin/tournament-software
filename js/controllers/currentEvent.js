"use strict";
var sosApp = angular.module('sosApp');
sosApp.directive('currentEvent', ['ConstantsService', 'DataStorage', 'RESTService', function(ConstantsService, DataStorage, RESTService) {
  return {
    restrict: 'A',
    template: currentEventHTML,
    link: function(scope, elem, attrs) {
      console.log("Loaded Current Event!");

      var allowEditTournament = false;
      var allowAddRemoveGames = false;

      scope.loggedInOrOffline = function() {
        return RESTService.isLoggedIn() || !DataStorage.isOnline();
      }

      scope.canEditTournament = function() {
        return allowEditTournament;
      };

      scope.canAddRemoveGames = function() {
        return allowEditTournament && allowAddRemoveGames;
      };

      function checkTournamentEdittable() {
        if (!scope.currentEvent) {
          return false;
        }

        if (scope.currentEvent.finished) {
          return false;
        }

        // We can edit the tournament if we are:
        // 1.  Offline Mode (regardless of logged-in state)
        // 2.  Online Mode + Logged In
        if (scope.networkStatus.networkMode === DataStorage.NETWORK_MODES.NETWORK_ONLINE) {
          return scope.isLoggedIn();
        } else {
          return true;
        }
      }

      var shouldStop = false;
      scope.stop = function() {
        shouldStop = true;
      }

      scope.toggleTournamentMode = function() {
        if (scope.currentEvent.mode == ConstantsService.TOURNAMENT_FORMAT.SOS) {
          scope.currentEvent.mode = ConstantsService.TOURNAMENT_FORMAT.DIFF;
        } else {
          scope.currentEvent.mode = ConstantsService.TOURNAMENT_FORMAT.SOS;
        }
      };
      scope.assignRandomWinners = function() {
        shouldStop = false;
        setTimeout(assignNextWinner);
      };

      function testNextRound() {
        var generateStartButton = $('.generateRoundButton');
        if (generateStartButton.length == 0) {
          alert("Can't find next round button!");
        } else {
          generateStartButton.click();
          setTimeout(function() {
            clickYesAutoGenerate();
          }, 1000);
        }
      }

      function clickYesAutoGenerate() {
        var confirmAutoGenerateButton = $('.confirmYes');
        if (confirmAutoGenerateButton.length == 0) {
          alert("Can't find auto-generate-confirm button!");
        } else {
          confirmAutoGenerateButton.click();
          setTimeout(function() {
            assignNextWinner();
          }, 3 * 1000);
        }
      }

      function assignNextWinner() {
        if (shouldStop) {
          return;
        }

        var pendingGames = $('.gamePending');
        if (pendingGames.length == 0) {
          testNextRound();
        } else {
          var rand = Math.round(Math.random());
          var addResultButton = pendingGames.first().find('.addResultButton');
          addResultButton[rand].click();

          setTimeout(function() {
            var assignWinnerButton = $('#assingWinnerOkButton');
            if (assignWinnerButton.length == 0) {
              alert("Failed to find assign winner button");
            } else {
              assignWinnerButton.click();
              setTimeout(assignNextWinner, 1 * 1000);
            }

          }, 500);
        }
      }


      function assignNextWinner_OLD() {
        if (shouldStop) {
          return;
        }

        var pendingGames = $('.gamePending');
        if (pendingGames.length == 0) {
          testNextRound();
        } else {

          var addResultButton = pendingGames.first().find('.addResultButton');
          addResultButton.click();

          setTimeout(function() {
            $('.winnerSelector').click();

            setTimeout(function() {
              var indexToSelect = Math.round(Math.random()) + 1; //use option 1 or 2 (first is a blank)
              var randomWinnerSelector = ".winnerSelector option:eq(RANDOPTION)";
              randomWinnerSelector = randomWinnerSelector.replace('RANDOPTION', indexToSelect);

              var randomWinner = $(randomWinnerSelector);
              if (randomWinner.length == 0) {
                alert("Failed to find player to select...");

              } else {
                randomWinner.prop('selected', true).change();

                setTimeout(function() {

                  setTimeout(function() {
                    var assignWinnerButton = $('#assingWinnerOkButton');
                    if (assignWinnerButton.length == 0) {
                      alert("Failed to find assign winner button");
                    } else {
                      assignWinnerButton.click();
                      setTimeout(assignNextWinner, 3000);
                    }

                  }, 500);

                }, 500);
              }

            }, 500);

          }, 500);
        }
      }


      // Watch this funciton and update our bound variable when needed (performance)
      scope.$watch(
        function() {
          return checkTournamentEdittable();
        },
        function() {
          allowEditTournament = checkTournamentEdittable();
          allowAddRemoveGames = (scope.currentEvent.mode !== ConstantsService.TOURNAMENT_FORMAT.MATCH_PLAY);
        }
      );

    }
  };
}]);
