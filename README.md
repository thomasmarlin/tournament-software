# Star Wars CCG Tournament Assistant
Welcome to the Star Wars CCG Tournament Assistant for Star Wars CCG! 

Running large SWCCG tournaments can be very complex and time consuming. This tool takes the load off of the tournament directory by:
- Automatically Pairings of Players
- Handling all of the SOS Calculations
- Saving tournament results (either locally in your browser OR on the SWCCG Website)

For more information about Star Wars CCG, check out the SWCCG Players Committee website here: https://www.starwarsccg.org/
* Website: https://www.starwarsccg.org/vkit/

## What Technology Does This Use?
The software has 2 main components:
* AngularJS Front-End
* PHP Back-End  (Installs as a Wordpress Plugin)

## The Back-End
One the original goals was to install this software on the SWCCG Player's Committe website. To facilitate that, it was developed as a Wordpress Plugin (yuck...I know).  

All of the data is stored in Files on the Server. Specifically:
* /players/players.json:   This is a list of all players from all tournaments
* /tournaments/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXX.json:  Each of these files holds the data for a tournament. The entire thing is stored as JSON in that single file.
* /users/users.json:  These are all of the users who have an account for creating tournaments


## Where Can I Ask Questions?
The best place to ask questions about this project is on the Star Wars CCG Players Committee Forums. Specifically, the "Resources" Sub-Form: https://forum.starwarsccg.org/viewforum.php?f=188

##How To Contribute?
If you see bugs or have improvements, please contribute!

Here's a brief overview of what you will need to do:
1. Create a Fork of the code
2. Create a new branch inside your fok
3. Commit your changes in that branch
4. Create a pull request (PR)
5. Someone on the team will review your PR and get it merged?

There is a nice tutorial here:
https://www.thinkful.com/learn/github-pull-request-tutorial/Time-to-Submit-Your-First-PR#Time-to-Submit-Your-First-PR


## Attribution
This code is a fork of the original here: https://github.com/thomasmarlin/tournament-software
