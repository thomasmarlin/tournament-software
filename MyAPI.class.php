<?php

require 'API.class.php';
class MyAPI extends API
{
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

      $openedFile = fopen($fullPath, "w");
      fwrite($openedFile, $jsonString);
      fclose($openedFile);

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


    private function sendJsonResponse($success, $objectToSend, $errorString) {

      if ($success) {


        // Successfull Response!
        print($this->JSON_RESPONSE_START);
        $encodedJson = json_encode($objectToSend);
        print_r($encodedJson);
        print($this->JSON_RESPONSE_END);

      } else {

        // Error Condition!  TODO:  Send back an HTTP error
        print($this->JSON_RESPONSE_START);
        $errorObject = new stdClass();
        $errorObject->errorMessage = $errorString;
        $encodedError = json_encode($errorObject);
        print($this->JSON_RESPONSE_END);

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


    protected function handleTournamentPOST($tournamentId, $tournamentData) {
      $writeTournamentResult = false;
      if ($this->doesTournamentExist($jsonData['id'])) {
        print("Updating Tournament: " . $tournamentId);
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

      if ($method == "GET") {

        $this->handleTournamentGET($tournamentId);

      } else if ($method == "POST") {

        // We may be updating an existing tournament OR creating a new one
        $jsonData = json_decode($this->post_data, true);
        $this->handleTournamentPOST($tournamentId, $jsonData);

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
