<?php

require 'API.class.php';
class MyAPI extends API
{
    protected $User;

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
      $tournamentFileName = $this->getTournamentsPath() . $tournamentId;
      $tournyFile = fopen($tournamentFileName, "r");

      $tournamentContents = file_get_contents($tournyFile);
      $tournamentJson = json_decode($tournamentContents);
    }

    private function getTournamentNames() {
      $tournamentIds = $this->getTournamentIds();
      $tournamentNames = array();

      foreach($tournamentIds as $tournamentId) {
        $tournamentJson = $this->getTournament($tournamentId);

        $tournamentObject = new stdClass();
        $tournamentObject->id = $tournamentJson->tournamentId;
        $tournamentObject->name = $tournamentJson->name;
        array_push($tournamentNames, $tournamentObject);
      }

      return $tournamentNames;
    }

    protected function tournaments() {

      print("-Tournament Endpoint-");

      $method = $this->method;
      $endpoint = $this->args['endpoint'];
      $tournamentId = $this->args['tournamentId'];

      if ($method == "GET") {

        if (!$this->doesTournamentExist($tournamentId)) {
          print("GET FAIL!!!  Tournament with this id doesn't exist: " . $tournamentId);
          return;
        } else {
          print("Found tournament matching id: " . $tournamentId);
          $tournamentData = $this->getTournament($tournamentId);
          print_r($tournamentData);
        }

      } else if ($method == "POST") {

        // We may be updating an existing tournament OR creating a new one
        $jsonData = json_decode($this->post_data, true);

        print("jsonData['id']" . $jsonData['id']);

        if (!$this->doesTournamentExist($jsonData['id'])) {
          print("POST FAIL!!!  Tournament with this id doesn't exist: " . $tournamentId);
          return;
        } else {
          print("Found tournament matching id: " . $tournamentId);

        }
      }
    }

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
