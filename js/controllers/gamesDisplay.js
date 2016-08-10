"use strict";
var sosApp = angular.module('sosApp');
sosApp.directive('gamesDisplay', [function() {
  return {
    restrict: 'A',
    template: gamesDisplayHTML,
    link: function(scope, element, attrs) {

      scope.printCurrentRound = function() {
        var printContents = element.html();
        var popupWin = window.open('', '_blank', 'width=800');

        var cssIncludes =
          '<link rel="stylesheet" type="text/css" href="/wp-content/plugins/swccg-tourny/css/bootstrap.min.css">' +
          '<link rel="stylesheet" type="text/css" href="/wp-content/plugins/swccg-tourny/css/sos.css">' +
          '<link rel="stylesheet" type="text/css" href="/wp-content/plugins/swccg-tourny/css/findPlayer.css">' +
          '<link rel="stylesheet" type="text/css" href="/wp-content/plugins/swccg-tourny/css/progress.css">' +
          '<link rel="stylesheet" type="text/css" href="/wp-content/plugins/swccg-tourny/css/shared.css">'

        popupWin.document.open();
        popupWin.document.write('<html><head>' + cssIncludes + '</head><body onload="window.print()">' + printContents + '</body></html>');
        popupWin.document.close();
      }

    }
  };
}]);
