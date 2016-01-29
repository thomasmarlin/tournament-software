<?php
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
/* ^^ Force pages to reload every time ^^ */
/*
Plugin Name: SwccgTourny
Description: SWCCG Tournament software
Author: Tom Marlin
Version: 1.0
*/


add_shortcode("swccg-tourny", "initTourny" );

function initTourny(){

  $sosHtmlFile = plugins_url('/swccg-tourny/sos.html');

  readfile($sosHtmlFile);
  //echo file_get_contents($sosHtmlFile);

}

?>
