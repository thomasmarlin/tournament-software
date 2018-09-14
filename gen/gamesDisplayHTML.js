var gamesDisplayHTML =  "<!-- Games --> <div class=\"mainContentBox\">   <div class=\"mainContentHeader\">     <h2 class=\"mainContentHeaderName\">Games</h2>     <div class=\"mainContentHeaderButtons\">       <button data-ng-if='loggedInOrOffline()' class=\"btn btn-default\" style=\"float:right\" data-ng-click=\"toggleTournamentFinished()\">{{currentEvent.finished ? 'Re-Open Tournament' : 'Finish Tournament'}}</button>       <button data-ng-if=\"canAddRemoveGames()\" class=\"generateRoundButton btn btn-default\" style=\"float:right; margin-right: 15px;\" data-ng-click=\"newRound()\">Generate Next Game</button>        <div style=\"clear:both\"></div>     </div>   </div>    <hr>    <uib-tabset>     <uib-tab active='round.active'           heading='Game {{round.num}}'           ng-repeat='round in currentEvent.rounds'>       <div style=\"border: 3px solid white; border-radius: 5px; padding-top: 5px; padding-bottom: 5px;\">          <div data-ng-if=\"currentEvent.games.length == 0\" style=\"margin:50px\">           <h3 style=\"font-style:italic; color:gray\">Click 'Generate Next Game' to generate matchups...</h3>         </div>          <div data-ng-if=\"currentEvent.games.length > 0\">           <!-- Headers -->           <div style=\"margin-left:20px; margin-right:20px\">             <div class=\"row\" >                 <div class=\"col-xs-1\">                   <h5>Table</h5>                 </div>                 <div class=\"col-xs-5\">                   <h5>Players</h5>                 </div>                 <div class=\"col-xs-6\">                   <h5 style='text-align:center'>Winner</h5>                 </div>             </div>           </div>            <div data-ng-if='getTotalGamesInRound() < 1' style='text-align: center; font-style: italic; color: gray;'>             <h3>No Games Created. Click 'Add Single Game' to add a new game.</h3>           </div>            <div ng-repeat=\"game in currentEvent.games | filter: {round: {num: round.num}};\" style=\"margin-left:20px; margin-right:20px\">              <div>                <!-- Games Table -->               <div class=\"row playerBox\" ng-class=\"{'gameFinished': game.winner, 'gamePending': !game.winner }\">                    <div class='col-xs-1' style=\"margin-top: 5px\">                     #{{$index + 1}}                   </div>                   <div class=\"col-xs-5\" style=\"margin-top:5px\">                       <div>Dark: <span style=\"font-weight:bold; font-style:italic;\">{{game.playerDark.name}}</span><span style=\"margin-left:10px; height: 10px; width: 10px\"></span>{{getPlayerRecord(game.playerDark)}}</div>                       <div>Light: <span style=\"font-weight:bold; font-style:italic;\">{{game.playerLight.name}}</span><span style=\"margin-left:10px; height: 10px; width: 10px\"></span>{{getPlayerRecord(game.playerLight)}}</div>                   </div>                   <div class=\"col-xs-6\" style=\"margin-top:5px\">                        <div data-ng-if=\"game.winner\" style='text-align:center'>                           <div style=\"font-weight:bold\">{{game.winner.name}}                             <span data-ng-if='currentEvent.mode !== \"SOS\"' style=\"margin-left: 5px\"> (+{{game.diff}})</span>                           </div>                           <button data-ng-if='canEditTournament()' class=\"btn btn-default\" data-ng-click=\"addResult(game)\">Change</button>                           <div data-ng-if='canAddRemoveGames()' data-ng-click=\"deleteGame(game)\" class=\"deleteGameButton glyphicon glyphicon-remove\"></div>                       </div>                        <div data-ng-if=\"!game.winner && canEditTournament()\">                         <div class='declareWinnerLabel'>Declare Winner:</div>                          <div style=\"text-align: center;\">                           <button class=\"addResultButton btn btn-default\" style='max-width: 250px' data-ng-click=\"declareWinner(game, game.playerDark)\">{{game.playerDark.name}}</button>                           <button class=\"addResultButton btn btn-default\" style='max-width: 250px' data-ng-click=\"declareWinner(game, game.playerLight)\">{{game.playerLight.name}}</button>                         </div>                          <!--                         <button class=\"addResultButton btn btn-default\" data-ng-click=\"addResult(game)\">Add Result</button>                         -->                          <div data-ng-if='canAddRemoveGames()' data-ng-click=\"deleteGame(game)\" class=\"deleteGameButton glyphicon glyphicon-remove\"></div>                        </div>                    </div>               </div>             </div>            </div>          </div>          <div style=\"height: 10px; width: 10px\"></div>          <button class=\"btn btn-default\" data-ng-click=\"printCurrentRound(false)\" style='margin-left: 4px; float:left;'>Print<span class=\"glyphicon glyphicon-print\" style='margin-left:10px'></span></button>         <button class=\"btn btn-default\" data-ng-click=\"printCurrentRound(true)\" style='margin-left: 4px; float:left;'>View Summary</button>         <button data-ng-if=\"currentEvent.rounds.length > 0 && canAddRemoveGames()\" class=\"btn btn-default\" style=\"float:right; margin-right: 5px;\" data-ng-click=\"deleteRound()\">Delete Matchups</button>         <button data-ng-if=\"currentEvent.rounds.length > 0 && canAddRemoveGames()\" class=\"btn btn-default\" style=\"float:right; margin-right: 15px\" data-ng-click=\"createGame()\">Add Single Game</button>         <button data-ng-if=\"currentEvent.rounds.length > 0 && canAddRemoveGames()\" class=\"btn btn-default\" style=\"float:right; margin-right: 15px\" data-ng-click=\"explainPairings()\">Pairing Log</button>         <div style=\"clear:both\"></div>        </div>     </uib-tab>   </uib-tabset> </div>" 