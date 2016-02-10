<?php

$oldErrLevel = error_reporting();
print("Error level: $oldErrLevel");

// For production, disable errors
//error_reporting(0);


require 'MyAPI.class.php';

/*
 // Requests from the same server don't have a HTTP_ORIGIN header
if (!array_key_exists('HTTP_ORIGIN', $_SERVER)) {
    $_SERVER['HTTP_ORIGIN'] = $_SERVER['SERVER_NAME'];
}
*/

$fakeOrigin = "dummy";
$fakeRequest = "";
//print_r($_REQUEST);
//print_r($_SERVER);
/*
print("Before post\n");
print_r($_REQUEST);
print("After post\n");
print_r($HTTP_RAW_POST_DATA);
print("After raw data");
*/

try {
    //$API = new MyAPI($_REQUEST['request'], $_SERVER['HTTP_ORIGIN']);
    //$API = new MyAPI($_REQUEST['request'], $fakeOrigin);
    //$API = new MyAPI($_REQUEST, $fakeOrigin);
    $API = new MyAPI($_REQUEST, $HTTP_RAW_POST_DATA);
    echo '====JSONRESULTS====' . $API->processAPI();
} catch (Exception $e) {
    echo json_encode(Array('error' => $e->getMessage()));
}

?>
