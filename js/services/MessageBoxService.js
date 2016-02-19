"use strict";
var sosApp = angular.module('sosApp');
sosApp.service('MessageBoxService', ['$uibModal', function($uibModal) {


  this.infoMessage = function(infoMessage, scope, extraMessages) {
    var modalDialog = $uibModal.open({
        template: messageBoxHTML,
        controller: "MessageBoxController",
        scope: scope,
        resolve: {
          message: function() {
            return infoMessage;
          },
          extraMessages: function() {
            return extraMessages;
          },
          title: function() {
            return "Info:";
          }
        }
      });
  };

  this.errorMessage = function(errorMessage, scope, extraMessages) {
    var modalDialog = $uibModal.open({
        template: messageBoxHTML,
        controller: "MessageBoxController",
        scope: scope,
        resolve: {
          message: function() {
            return errorMessage;
          },
          extraMessages: function() {
            return extraMessages;
          },
          title: function() {
            return "Sorry!";
          }
        }
      });
      return modalDialog;
  };


  this.confirmDialog = function(confirmMessage, scope) {
    var modalDialog = $uibModal.open({
        template: confirmBoxHTML,
        controller: "ConfirmBoxController",
        scope: scope,
        resolve: {
          message: function() {
            return confirmMessage;
          },
          title: function() {
            return "Are you sure?";
          }
        }
      });
    return modalDialog;
  };

}]);
