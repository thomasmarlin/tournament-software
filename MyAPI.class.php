<?php

require 'API.class.php';
class MyAPI extends API
{
    private $DEFAULT_PASSWORD = "PCl0@dl3tt3r";
    private $DEFAULT_ADMIN_GUID = "bbbb17ad-d596-487e-847b-eda05f1cb5f5";

    private $TYPE_ADMIN = 'ADMIN';
    private $TYPE_DEFAULT = 'DEFAULT';

    protected $User;

    private $JSON_RESPONSE_START = "====================JSON_RESPONSE_START====================\n";
    private $JSON_RESPONSE_END = "====================JSON_RESPONSE_END====================\n";

    public function __construct($request, $http_raw_post_data) {
        parent::__construct($request, $http_raw_post_data);

        // TODO:  Verify the username/password of a user somehow?
        //        Or maybe we just do this comparing it to the PW for the game?

        $this->User = "FakeUser";
    }

    private function getPlayersPath() {
      return 'players';
    }

    private function getPlayersFileName() {
      return 'players.json';
    }

    private function getUsersPath() {
      return 'users';
    }

    private function getUsersFilename() {
      return 'users.json';
    }

    private function getTournamentsPath() {
      return 'tournaments';
    }

    private function getTournamentIds() {
      $tournamentIds = array();

      // Get the tournament folder
      $tournamentsPath = $this->getTournamentsPath();

      // Get all files (named by tournament ID)
      $files = scandir($tournamentsPath);
      foreach ($files as $tournamentId) {
        if ($tournamentId != '.' && $tournamentId != '..') {
          array_push($tournamentIds, $tournamentId);
        }
      }

      return $tournamentIds;
    }


    private function writeFile($fileName, $filePath, $fileContents) {

      $fullPath = $filePath . '/' . $fileName;

      $jsonString = json_encode($fileContents);
      print("jsonString:\n");
      print_r($jsonString);

      $openedFile = fopen($fullPath, "w");

      $writeResult = fwrite($openedFile, $jsonString);


      print("WriteResult");
      print_r($writeResult);

      print("WroteData:\n");
      print_r($jsonString);

      $closeResult = fclose($openedFile);
      print("closeResult");
      print_r($closeResult);

      return true;
    }

    private function writeTournamentFile($tournamentId, $tournamentData) {
      return $this->writeFile($tournamentId, $this->getTournamentsPath(), $tournamentData);
    }

    private function writePlayerList($playersArray) {

      $playerData = new stdClass();
      $playerData->players = $playersArray;

      return $this->writeFile($this->getPlayersFileName(), $this->getPlayersPath(), $playerData);
    }

    private function writeUserList($usersArray) {

      $userData = new stdClass();
      $userData->users = $usersArray;

      return $this->writeFile($this->getUsersFileName(), $this->getUsersPath(), $userData);
    }


    private function updateUserInList($singleUser) {
      $alreadyExists = false;
      $allUsersList = $this->getUsersList();
      for ($i = 0; $i < count($allUsersList); $i++) {
        $existingUser = $allUsersList[$i];
        if (0 == strcmp($existingUser->id, $singleUser->id)) {
          $alreadyExists = true;
          $allUsersList = $existingUser;
        }
      }

      if (!$alreadyExists) {
        array_push($allUsersList, $singleUser);
      }

      // List now contains updated users
      return $this->writeUserList($allUsersList);
    }


    private function doesTournamentExist($tournamentId) {
      $allTournamentIds = $this->getTournamentIds();
      print_r("All tournaments: ");
      print_r($allTournamentIds);
      foreach ($allTournamentIds as $existingId) {
        if ($existingId == $tournamentId) {
          return true;
        }
      }

      return false;
    }


    private function doesUserExist($userId) {
      $allUsers = $this->getUsersList();
      print_r("All Users: ");
      print_r($allUsers);
      foreach ($allUsers as $existingUser) {
        if ($existingUser->id == $userId) {
          return true;
        }
      }

      return false;
    }

    private function getUser($userId) {
      $allUsers = $this->getUsersList();
      print_r("getting user...");
      foreach ($allUsers as $existingUser) {
        if ($existingUser->id == $userId) {
          return $eistingUser;
        }
      }

      return null;
    }

    private function getTournament($tournamentId) {
      $tournamentFileName = $this->getTournamentsPath() . '/' . $tournamentId;
      $tournamentContents = file_get_contents($tournamentFileName);
      $tournamentJson = json_decode($tournamentContents);
      return $tournamentJson;
    }

    private function getTournamentNames() {
      $tournamentIds = $this->getTournamentIds();
      $tournamentList = array();

      foreach($tournamentIds as $tournamentId) {
        $tournamentJson = $this->getTournament($tournamentId);

        $tournamentObject = new stdClass();
        $tournamentObject->id = $tournamentJson->id;
        $tournamentObject->name = $tournamentJson->name;
        array_push($tournamentList, $tournamentObject);
      }

      return $tournamentList;
    }


    private function playerInArray($player, $allPlayersArray) {
      foreach($allPlayersArray as $existingPlayer) {
        if ($player->id == $existingPlayer->id) {
          return true;
        }
      }
      return false;
    }


    /**
     * Parse all Tournament files and get all Player objects out of there
     */
    private function getPlayersFromTournaments() {

      $allPlayers =[];

      $tournamentIds = $this->getTournamentIds();

      foreach($tournamentIds as $tournamentId) {
        $tournamentJson = $this->getTournament($tournamentId);

        $playersInTournament = $tournamentJson->players;
        foreach($playersInTournament as $player) {

          if (!$this->playerInArray($player, $allPlayers)) {

            $playerObj = new stdClass();
            $playerObj->id = $player->id;
            $playerObj->name = $player->name;
            $playerObj->forum_handle = $player->forum_handle;

            array_push($allPlayers, $playerObj);
          }

        }
      }

      return $allPlayers;
    }


    /**
     * Get an array containing the current list of players
     */
    private function getPlayerList() {
      $playersFilePath = $this->getPlayersPath() . '/' . $this->getPlayersFileName();
      $playersDataString = file_get_contents($playersFilePath);
      $playersData = json_decode($playersDataString);
      return $playersData->players;
    }


    private function generateDefaultUserFile() {
      print("GENERATING DEFAULT FILE!");

      $usersFilePath = $this->getUsersPath() . '/' . $this->getUsersFileName();

      $adminUser = new stdClass();
      $adminUser->id = $this->DEFAULT_ADMIN_GUID;
      $adminUser->username = "admin";
      $adminUser->hash = $this->hashPassword($this->DEFAULT_PASSWORD);

      $usersData = new stdClass();
      $usersData->users = [
        0 => $adminUser
      ];

      print("---DEFAULT FILE---\n");
      print_r($usersData);
      print("-------\n");
      $this->writeFile($this->getUsersFileName(), $this->getUsersPath(), $usersData);
    }

    /**
     * Get an array containing the current list of users
     */
    private function getUsersList() {
      $usersFilePath = $this->getUsersPath() . '/' . $this->getUsersFileName();
      if (!file_exists($usersFilePath)) {
        $this->generateDefaultUserFile();
      }

      $usersDataString = file_get_contents($usersFilePath);
      $usersData = json_decode($usersDataString);
      return $usersData->users;
    }


    private function sendJsonResponse($success, $objectToSend, $errorString) {

      if ($success) {

        // Successfull Response!
        print($this->JSON_RESPONSE_START);
        $encodedJson = json_encode($objectToSend);
        print_r($encodedJson);
        print($this->JSON_RESPONSE_END);

        http_response_code(200);

      } else {

        // Error Condition!  TODO:  Send back an HTTP error

        print($this->JSON_RESPONSE_START);
        $errorObject = new stdClass();
        $errorObject->errorMessage = $errorString;
        $encodedError = json_encode($errorObject);
        print_r($encodedError);
        print($this->JSON_RESPONSE_END);

        http_response_code(400);

      }
    }



    protected function handleTournamentGET($tournamentId) {
      if (!$this->doesTournamentExist($tournamentId)) {
        $this->sendJsonResponse(false, null, "Tournament does not exist");
        return;
      }

      $tournamentData = $this->getTournament($tournamentId);
      $this->sendJsonResponse(true, $tournamentData, null);
    }


    protected function handleTournamentPOST($tournamentId, $tournamentData, $hash) {
      $writeTournamentResult = false;
      if ($this->doesTournamentExist($jsonData['id'])) {
        print("Updating Tournament: " . $tournamentId);
        $oldTournamentData = getTournament($tournamentId);
        if (0 != strcmp($oldTournamentData->hash, $hash)) {
          $this->sendJsonResponse(false, "{}", "Invalid Password");
          return;
        }
        $writeTournamentResult = $this->writeTournamentFile($tournamentId, $tournamentData);
      } else {
        print("Creating new tournament: " . $tournamentId);
        $writeTournamentResult = $this->writeTournamentFile($tournamentId, $tournamentData);
      }

      if ($writeTournamentResult) {
        $this->sendJsonResponse(true, $tournamentData, null);
      } else {
        $this->sendJsonResponse(true, $tournamentData, "Error writing tournament results");
      }

      // Also, update the cached player list
      $playersFromTournaments = $this->getPlayersFromTournaments();
      $this->writePlayerList($playersFromTournaments);
    }

    protected function handlePlayerListGET() {
      $playerList = $this->getPlayerList();

      $playerListData = new stdClass();
      $playerListData->players = $playerList;
      $this->sendJsonResponse(true, $playerListData, null);
    }

    protected function handleUserPOST($userId, $userData) {
      $writeUserFileResult = false;

      if ($this->doesUserExist($userData['id'])) {
        print("Updating User: " . $userId);

        // Store only the hashes of the password, not the password itself!
        $updatedUserData = new stdClass();
        $updatedUserData->id = $userId;
        $updatedUserData->username = $userData['username'];
        $updatedUserData->hash = $this->hashPassword($userData['password']);
        $updatedUserData->level = $userData['level'];
        $updatedUserData->password = "ENCRYPTED";

        $writeUserFileResult = $this->updateUserInList($updatedUserData);
      } else {
        print("Creating new user: " . $userId);

        // Store only the hashes of the password, not the password itself!
        $updatedUserData = new stdClass();
        $updatedUserData->id = $userId;
        $updatedUserData->username = $userData['username'];
        $updatedUserData->hash = $this->hashPassword($userData['password']);
        $updatedUserData->level = $userData['level'];
        $updatedUserData->password = "ENCRYPTED";

        $writeUserFileResult = $this->updateUserInList($updatedUserData);
      }

      if ($writeUserFileResult) {
        $this->sendJsonResponse(true, $userData, null);
      } else {
        $this->sendJsonResponse(true, $userData, "Error writing users results");
      }
    }

    protected function handleUserListGET() {
      $userList = $this->getUsersList();

      $userListData = new stdClass();
      $userListData->users = $userList;
      $this->sendJsonResponse(true, $userListData, null);
    }

    protected function handleUserDELETE($userId) {

      print("Deleting user: " . $userId);
      $userList = $this->getUsersList();

      $newUserList = [];
      foreach($userList as $user) {
        if ($user->id != $userId) {
          array_push($newUserList, $user);
        }
      }

      $this->writeUserList($newUserList);

      $this->sendJsonResponse(true, $newUserList, null);
    }

    protected function handleTournamentListGET() {
      $tournamenList = $this->getTournamentNames();

      $tournamentListData = new stdClass();
      $tournamentListData->tournaments = $tournamenList;
      $this->sendJsonResponse(true, $tournamentListData, null);
    }

    protected function ping() {
      $pingResponse = new stdClass();
      $pingResponse->message = "PONG";
      $this->sendJsonResponse(true, $pingResponse, null);
    }

    protected function tournaments() {

      print("-Tournament Endpoint-");

      $method = $this->method;
      $endpoint = $this->args['endpoint'];
      $tournamentId = $this->args['tournamentId'];
      $hash = $this->args['hash'];

      if ($method == "GET") {

        $this->handleTournamentGET($tournamentId);

      } else if ($method == "POST") {

        if ($this->validateCredentials(false)) {
          // We may be updating an existing tournament OR creating a new one
          $jsonData = json_decode($this->post_data, true);
          $this->handleTournamentPOST($tournamentId, $jsonData, $hash);
        }
      }
    }

    protected function users() {

      print("-users Endpoint-");

      $method = $this->method;
      $endpoint = $this->args['endpoint'];
      //$hash = $this->args['hash'];

      if ($method == "GET") {

        $this->handleUserListGET();

      } else if ($method == "POST") {

        $adminRequired = true;
        //validateCredentials($adminRequired);
        $userId = $this->args['userId'];

        // We may be updating an existing user OR creating a new one
        $jsonData = json_decode($this->post_data, true);
        $this->handleUserPOST($userId, $jsonData);

      } else if ($method == "DELETE") {

        $adminRequired = true;
        if ($this->validateCredentials($adminRequired)) {
          $userId = $this->args['userId'];

          $this->handleUserDelete($userId);
        }
      }

    }


    protected function login() {

      print("-login Endpoint-");

      $method = $this->method;
      $endpoint = $this->args['endpoint'];

      if ($this->validateCredentials(false)) {
        $this->sendJsonResponse(true, new stdClass(), "");
      }
    }



    protected function playerList() {
      $method = $this->method;
      if ($method == "GET") {

        $this->handlePlayerListGET();

      } else {
        $this->sendJsonResponse(false, null, "playerList only supports HTTP GET");
      }
    }

    protected function tournamentList() {

      $method = $this->method;
      if ($method == "GET") {

        $this->handleTournamentListGET();

      } else {
        $this->sendJsonResponse(false, null, "tournamentList only supports HTTP GET");
      }

    }


    protected function validateCredentials($adminRequired) {
      print("validateCredentials\n");

      $allHeaders = getallheaders();

      $username = $allHeaders['username'];
      $password = $allHeaders['password'];

      if (!$this->checkPassword($username, $password, $adminRequired)) {
        print("validation failed!\n");
        $this->sendJsonResponse(false, null, "Invalid Username/Password combination");
        return false;
      }

      print("validation successful!\n");
      return true;
    }

    protected function hashPassword($password) {

      print("hashPassword: $password\n");

      $hash = "";

      // If you are reading this, you are being a dick...
      // Don't be a dick. This is just making it more hard...that's all.
      // Someday this will be a proper one-way hash and not this fake stuff
      $crappyArray1 = [2,3,3,5,6,8,2,3,1,5,6,8,9,5,2,2,5,6,8,2,8,4,6,2,6,4,3,3,8,3,2,7,9,5,6,2,3,1,4,6,8,1,5,7,9,2,4];
      $crappyArray2 = [8,8,9,1,7,6,5,4,4,5,6,7,2,3,3,4,6,2,1,4,7,6,4,3,3,5,6,2,4,9,5,8,2,9,9,7,4,9,4,4,5,9,2,3,2,7,9];

      for ($i = 0; ($i < strlen($password)) && ($i < count($crappyArray1)); $i++) {
        $charVal = ord(substr($password, $i, 1));
        $newCharVal = ceil(($charVal * $crappyArray1[$i] + 9) / $crappyArray2[$i]) + floor(($charVal * $crappyArray2[$i] + 2) / $crappyArray1[$i]);

        $newChar = "" . $newCharVal;
        $hash = $hash . $newChar;
      }

      return $hash;
    }


    protected function checkPassword($username, $password, $adminRequired) {

      print("checkPassword\n");

      $userList = $this->getUsersList();

      print("----\n");
      print_r($userList);
      print("----\n");
      $newUserList = [];
      foreach($userList as $user) {
        if (0 == strcmp($user->username, $username)) {
          // Found the user!
          $passwordHash = $this->hashPassword($password);

          print("user hash: '$user->hash'\n");
          print("passwordHash: '$passwordHash'\n");
          if (0 == strcmp($passwordHash, $user->hash)) {
            if (!$adminRequired || $adminRequired && (0 == strcmp($user->level, $this->TYPE_ADMIN))) {
              return true;
            }
          }
        }
      }

      return false;
    }





    /*

    protected function games() {
      // Supported Params:
      // games?tournamentId=XXXXXXX
      // games/XXXXXXXXX

      print("-Games Endpoint-");

      $endpoint = $this->args['endpoint'];
      $tournamentId = $this->args['tournamentId'];
      $fakeValue = $this->args['fakeValue'];
      $jsonData = json_decode($this->post_data, true);

      print_r(" - endpoint: $endpoint\n");
      print(" - tournamentId: $tournamentId\n");
      print(" - fakeValue: $fakeValue");


      // Inside the JSON data, see if we have a tournament ID supplied

      $myfile = fopen("postedData.txt", "w");
      fwrite($myfile, $this->post_data);
      fclose($myfile);



      print("==========\n");

      print_r($this->args);

      print_r("--- after args --");
      print_r($this->post_data);
      print("After post data...");

      print("==========\n");

      $game1 = new stdClass();
      $game1->id = "13423423423423";
      $game2 = new stdClass();
      $game2->id = "98987987987987";


      $gamesList = array(
        $game1,
        $game2
      );


      return json_encode($gamesList);
    }
    */

    /**
     * Example of an Endpoint
     */
     protected function example() {
        if ($this->method == 'GET') {
            return "Your name is " . $this->User->name;
        } else if ($this->method == 'POST') {
            return "This was a POST!";
        } else {
            return "Only accepts GET requests";
        }
     }
 }

 ?>
