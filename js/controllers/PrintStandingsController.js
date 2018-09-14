'use strict';
var sosApp = angular.module('sosApp');
sosApp.controller('PrintStandingsController', ['$scope', '$timeout', '$uibModal', '$uibModalInstance', '$window', 'players', 'gameNumber', 'isSos', function($scope, $timeout, $uibModal, $uibModalInstance, $window, players, gameNumber, isSos) {

  $scope.gameNumber = gameNumber;
  $scope.players = players;
  $scope.isSos = isSos;

  $scope.close = function() {
    $uibModalInstance.dismiss(null);
  };

  $timeout(function() {

    var printContents = $('#printStandingsNode').html();
    var popupWin = window.open('', '_blank', 'width=800');

    var cssIncludes =
      '<link rel="stylesheet" type="text/css" href="css/bootstrap.min.css">' +
      '<link rel="stylesheet" type="text/css" href="css/sos.css">' +
      '<link rel="stylesheet" type="text/css" href="css/findPlayer.css">' +
      '<link rel="stylesheet" type="text/css" href="css/progress.css">' +
      '<link rel="stylesheet" type="text/css" href="css/shared.css">'

    popupWin.document.open();
    //popupWin.document.write('<html><head>' + cssIncludes + '</head><body onload="window.print()">' + printContents + '</body></html>');
    popupWin.document.write('<html><head>' + cssIncludes + '</head><body>' + printContents + '</body></html>');
    popupWin.document.close();

    $uibModalInstance.dismiss();

  }, 1000);

}]);
