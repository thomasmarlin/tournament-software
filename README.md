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

## The Front-End
The front-end is implemented using AngularJS. The code is split up as usual:
* /js/controllers:   One controller for each of the components in the app
* /js/services:    Services which perform the guts of the applications (pairings API Calls, etc)
* /partials/XXXXXX.html:  These are all of the main HTML file
* /gen/xxxxxxxHTML.js:  Ooof... this is a little ugly. See the section below

The front-end is capable of running in 2 Modes:
### Online Mode
In Online mode, the front-end makes API calls directly to the SWCCG PC website.  Every time the user does a "Save", we make a POST to the tournament API endpoints.  We ALSO mirror those results into the user's Browser Cache.  We save this data into LocalStorage. The cool thing about this is that if you lose connectivity to the PC site (the hotel wifi goes down or something like that), you can still continue seemlessly. You just start operating in "offline" mode instead and the system reads from the JSON data in local storage.



## What's up with the /gen/xxxxxxHTML.js files?
Yeah, this is a big ugly and I can't remember exactly why I needed to do it this way. However, the basic gist of it is that the AngularJS app needs to have all of the data available as Javascript files. This means we don't need to fetch new HTML files from the server and that sort of thing. The "right" way to do this would have been to use something like GULP or another tool to convert those HTML files into JS files. But, this was done the poor-man's way.  Every time we you make an update to an HTML file, you'll have to run the script:

```bash
/scripts/buildHtmlJsFiles.sh
```

That goes through all of the files and outputs them into the /gen folder. Those files are included by the webpage when the page loads.

## The Back-End
One the original goals was to install this software on the SWCCG Player's Committe website. To facilitate that, it was developed as a Wordpress Plugin (yuck...I know).  

All of the data is stored in Files on the Server. Specifically:
* /players/players.json:   This is a list of all players from all tournaments
* /tournaments/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXX.json:  Each of these files holds the data for a tournament. The entire thing is stored as JSON in that single file.
* /users/users.json:  These are all of the users who have an account for creating tournaments

## The API
The Back-End API is a bit of a turd right now. All requests go through the following URL:
http://www.starwarsccg.org/wp/wp-content/plugins/swccg-tourny/api.php

Each of the API commands are implemented as QueryParams on that URL.  For example, getting a player-list cam be done using a GET of 
http://www.starwarsccg.org/wp/wp-content/plugins/swccg-tourny/api.php?endpoint=users

Likewise, submitting results uese a POST to:
http://www.starwarsccg.org/wp/wp-content/plugins/swccg-tourny/api.php?endpoint=tournaments&tournamentId=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXX

Those endpoints simply read the JSON data from the server's filesystem and route the data to/from the client.

The responses from the server often have a bunch of garbage that Wordpress inadveratantly outputs. Consequently, the client neeeds to "scrub" the data a bit. For example, the JSON data will often be returned like this:

```bash
garbage data
more garbage
====================JSON_RESPONSE_START====================
{
 // the real JSON content here
}
====================JSON_RESPONSE_END====================
more garbage data
...

```


It's not a true REST API, which is unfortunate, but it works. This would be a great opportunity for someone to come in and clean up.




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
