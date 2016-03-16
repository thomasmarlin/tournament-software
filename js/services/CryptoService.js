"use strict";
var sosApp = angular.module('sosApp');
sosApp.service('CryptoService', [function() {


  // TODO: Replace this with a proper hashing and/or encryption scheme!!!
  // THIS IS NOT AT ALL SECURE AND IS JUST A STOP-GAP FOR NOW
  this.generateHash = function(password){
    var hash = "";

    // If you are reading this, you are being a dick...
    // Don't be a dick. This is just making it more hard...that's all.
    var crappyArray1 = [8,4,6,2,6,4,3,3,8,3,2,7,9,5,0,2,3,1,4,6,8,1,5,7,9,0,4,2,3,3,5,6,8,2,3,1,5,6,8,9,5,2,2,5,6,8,2];
    var crappyArray2 = [5,8,2,0,9,7,4,9,4,4,5,9,2,3,0,7,9,8,8,9,0,7,6,5,4,4,5,6,7,2,3,3,4,6,2,1,4,7,6,4,3,3,5,6,2,4,9];
    for (var i = 0; (i < password.length) && (i < crappyArray1.length); i++) {
      var charVal = password.charCodeAt(i);
      var newCharVal = Math.ceil(charVal * crappyArray1[i] + 5 / crappyArray2[i]);

      var newChar = "" + newCharVal;
      hash += newChar;
    }

    return hash;
  }


}]);
