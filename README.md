# Star Wars CCG Tournament Assistant
Welcome to the Star Wars CCG Tournament Assistant for Star Wars CCG! 

Running large SWCCG tournaments can be very complex and time consuming. This tool takes the load off of the tournament directory by:
- Automatically Pairings of Players
- Handling all of the SOS Calculations
- Saving tournament results (either locally in your browser OR on the SWCCG Website)

For more information about Star Wars CCG, check out the SWCCG Players Committee website here: https://www.starwarsccg.org/
* Website: https://tournament.starwarsccg.org/

## Tutorial and FAQ:
Video: https://www.starwarsccg.org/tournament-software-tutorial/
FAQ: https://www.starwarsccg.org/tournament-software-faq/

## What Technology Does This Use?
The software has 2 main components:
* AngularJS Front-End
* PHP Back-End  (Installs as a Wordpress Plugin)

Note:  If you can write Javascript, you should be able to handle 99% of the software.

## The Front-End
The front-end is implemented using AngularJS. The code is split up as usual:
* /js/controllers:   One controller for each of the components in the app
* /js/services:    Services which perform the guts of the applications (pairings API Calls, etc)
* /partials/XXXXXX.html:  These are all of the main HTML file
* /gen/xxxxxxxHTML.js:  Ooof... this is a little ugly. See the section below


### What is the difference between Online and Offline mode?
In online mode, whenever you save your tournament data, that data is saved up to the Player’s Committee server.

In offline mode, anyone can run a tournament, even without an active internet connection!  The user only needs to browse to the website once and then a copy of the site will be stored by your browser for offline use.

#### Notes about Offline Mode:
In Offline mode, all data is stored in 'LocalStorage' inside your browser.  Whenever you open/save a tournament, the JSON is read directly out of LocalStorage instead of reading that data from the main API.  Note that in Online mode, we STILL write into LocalStorage. However, dual-write so that it writes to the PC website AND LocalStorage.  This allows us to seamlessly switch from an Online mode to Offline mode if there is a wifi-outage or other issue.


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


## How Do I Run This Locally?
To run locally, the basic steps are:
1) Create a Wordpress VM  (Recommend using Vagrant + VirtualBox)
2) Place the entire code folder into the wordpress/plugins/swccg-tourney folder so that it runs as a Wordpress Plugin

### Detailed Steps:
1. Install VirtualBox: https://www.virtualbox.org/
2. Install Vagrant: https://www.vagrantup.com/downloads.html
3. Install Wordpress via Vagrant: via instructions here (https://deliciousbrains.com/vagrant-docker-wordpress-development/)
   * vagrant plugin install vagrant-hostsupdater
   * git clone -b master git://github.com/Varying-Vagrant-Vagrants/VVV.git ~/vagrant-local
   * cd ~/vagrant-local && vagrant up
   
   You can log into Wordpress using UN: wp  PW: wp
   
4. Now that the Vagrant Wordpress install exists, go to that folder where you placed the vagrant file.  You will see a folder "www" which hosts the wordpress install. Inside that there are 2 copies of wordpress:  "wordpress-one" and "wordpress-two". Navigate to wordpress-one\public_html\wp-content\plugins. 

5. Copy the entire tournament software source folder into the "plugins" folder above.  For exmaple, if you have the code checked out into folder "swccg-tourny", copy that folder so that it is available in wordpress\wp-content\plugins\swccg-tourny

6. You can now access the website by navigating here:
http://one.wordpress.test/wp-content/plugins/swccg-tourny/sos.html

7. You'll initially see that the site is only available in "offline" mode.  This is because the code is trying to point to the production site (you don't want to do that). Instead, update the \js\services\RESTService.js file to point to the local endpoint:

```
 // PC Site (Production)
  var PRODUCTION_ENDPOINT = 'http://www.starwarsccg.org/wp/wp-content/plugins/swccg-tourny/api.php';

  // Testing (local dev)
  var LOCAL_ENDPOINT = 'http://one.wordpress.test/wp-content/plugins/swccg-tourny/api.php';

  var DEFAULT_ENDPOINT = LOCAL_ENDPOINT;
```

8. Refresh the page and you'll see the website available now!


## Where Can I Ask Questions?
The best place to ask questions about this project is on the Star Wars CCG Players Committee Forums. Specifically, the "Resources" Sub-Form: https://forum.starwarsccg.org/viewforum.php?f=188

## How To Contribute?
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
