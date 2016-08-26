'use strict';
var decklistApp = angular.module('decklistApp', ['ngAnimate', 'ui.bootstrap', 'ui.bootstrap.tabs', 'angularSpinner']).config(function($locationProvider) { $locationProvider.html5Mode({enabled: true, requireBase: false}); });
decklistApp.controller('decklist', ['$scope', '$http',  function($scope, $http) {
  var i = 0;

  $scope.cardsPerColumn = 38;

  $scope.cardList = [];
  $scope.decklist = [];
  for (i = 0; i < 60; i++) {
    $scope.decklist.push("");
  }

  $scope.deckshields = [];
  for (i = 0; i < 15; i++) {
    $scope.deckshields.push("");
  }

  $scope.done = function() {
    alert("done!");
  };

  function addCardsFromCdfData(data) {
    var cards = cardsFromCdfData(data);
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      $scope.cardList.push(card);
    }
  }

  function cardNameFromLine(readLine) {
    var iFirstSpace = readLine.indexOf(" ");
    var iSecondSpace = readLine.indexOf(" ", iFirstSpace + 1);
    var iEndOfName = readLine.indexOf("\\n", iSecondSpace);

    var cardName = readLine.substring(iSecondSpace + 1, iEndOfName - 1);
    cardName = cardName.replace('"', '');
    /*cardName = cardName.replace('�', '');*/
    cardName = cardName.replace(/[^\x00-\x7F]/g, "");

    var iDestinyStart = cardName.lastIndexOf('(');
    if (iDestinyStart !== -1) {
      cardName = cardName.substring(0, iDestinyStart-1);
    }

    return cardName;
  }

  function cardsFromCdfData(data) {
    var cards = [];

    // By lines
    var lines = data.split('\n');
    for(var line = 0; line < lines.length; line++){
      var lineInfo = lines[line];

      if (0 === lineInfo.indexOf("card")) {
        console.log("Detected Card: " + lineInfo);

        // Ignore Legacy cards
        if (-1 !== lineInfo.indexOf('card "/legacy')) {
          continue;
        }

        // Get the card name from the line
        var cardName = cardNameFromLine(lineInfo);
        console.log("Name: " + cardName);

        cards.push(cardName);
      }
    }

    return cards;
  }

  $http.get('lightside.cdf').success(function(data) {
    addCardsFromCdfData(data);
  });

  $http.get('darkside.cdf').success(function(data) {
    addCardsFromCdfData(data);
  });

}]);
