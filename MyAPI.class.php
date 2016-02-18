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

    private function writeTournamentFile($tournamentId, $tournamentData) {

      $tournamentFile = $this->getTournamentsPath() . '/' . $tournamentId;

      $jsonString = json_encode($tournamentData);

      $openedFile = fopen($tournamentFile, "w");
      fwrite($openedFile, $jsonString);
      fclose($openedFile);

      return true;
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
    }

    protected function handleTournamentListGET() {
      $tournamenList = $this->getTournamentNames();

      $tournamentListData = new stdClass();
      $tournamentListData->tournaments = $tournamenList;
      $this->sendJsonResponse(true, $tournamentListData, null);
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
