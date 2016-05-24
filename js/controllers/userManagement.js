"use strict";
var sosApp = angular.module('sosApp');
sosApp.directive('userManagement', ['$uibModal', 'RESTService', 'LoggerService', 'MessageBoxService', function($uibModal, RESTService, LoggerService, MessageBoxService) {
  return {
    restrict: 'A',
    template: userManagementHTML,
    link: function(scope, elem, attrs) {
      console.log("Loaded User Management!");

      scope.userManagement = {
        allUsers: []
      };

      scope.deleteUser = function(user) {
        MessageBoxService.errorMessage("Not Implemented Yet", scope);
      };

      scope.addUser = function() {
        addEditUser(null);
      };

      scope.editUser = function(user) {
        addEditUser(user);
      };

      scope.deleteUser = function(user) {
        deleteUser(user);
      };

      scope.isLoggedIn = function() {
        return RESTService.isLoggedIn();
      };

      scope.getCurrentUser = function() {
        return RESTService.getCurrentUser();
      };

      scope.loginClick = function() {
        var modalDialog = $uibModal.open({
            template: loginHTML,
            controller: 'LoginController',
            scope: scope
          });

        modalDialog.result.then(
          // Success
          function() {
            reloadUsers();
          },
          function() {

          }
        );

      };

      function addEditUser(optionalUser) {

        var modalDialog = $uibModal.open({
            template: createEditUserHTML,
            controller: 'CreateEditUserController',
            scope: scope,
            resolve: {
              existingUser: function() {
                return optionalUser;
              }
            }
          });

        modalDialog.result.then(
          // Success
          function(userData) {
              LoggerService.action("Creating user with name: " + userData.name);

              RESTService.createUser(userData).then(
                function() {
                  MessageBoxService.infoMessage("User Created successfully", scope);
                  reloadUsers();
                },
                function(err) {
                  MessageBoxService.errorMessage("Unable to create a user at this time. Please try again later.", scope);
                }
              );
          },
          // Cancelled
          function() {
              LoggerService.log("Create Event : Cancelled");
          }
        );
      };

      function deleteUser(user) {
        MessageBoxService.confirmDialog("Are you sure you want to remove the user: " + user.username, scope, "Are You Sure?").result.then(
          function() {
            RESTService.deleteUser(user).then(
              function() {
                MessageBoxService.infoMessage("User Removed", scope);
                reloadUsers();
              },
              function(err) {
                MessageBoxService.errorMessage("Unable to remove the user at this time. Please try again later.", scope);
              }
            );
          },
          function() {
            console.log("Cancelled...");
          }
        );
      }

      function reloadUsers() {
        RESTService.getUserList().then(
          function(userData) {
            scope.userManagement.allUsers = userData.users;
          },
          function(err) {
            console.log("Error loading user data: " + JSON.stringify(err));
          }
        )

      }

      reloadUsers();

    }
  };
}]);
