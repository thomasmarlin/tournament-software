var createPlayerHTML =  "<form>   <div style=\"margin:20px\">     <h2>Create Player</h2>     <div>Player Name</div>     <input ng-model=\"newPlayerName\" placeholder=\"ex: John Smith\" style=\"width:100%\" autofocus>     <hr>     <div>       <button class=\"btn btn-default\" style=\"float:right\" ng-click=\"okClick()\">OK</button>       <button class=\"btn btn-default\" style=\"float:right;margin-right:5px;\" ng-click=\"cancelClick()\">Cancel</button>       <div style=\"clear:both\"></div>     </div>   </div> </form>" 