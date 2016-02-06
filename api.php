<?php

require 'MyAPI.class.php';

/*
 // Requests from the same server don't have a HTTP_ORIGIN header
if (!array_key_exists('HTTP_ORIGIN', $_SERVER)) {
    $_SERVER['HTTP_ORIGIN'] = $_SERVER['SERVER_NAME'];
}
*/

$fakeOrigin = "dummy";
$fakeRequest = "";
print_r($_REQUEST);
print_r($_SERVER);


try {
    //$API = new MyAPI($_REQUEST['request'], $_SERVER['HTTP_ORIGIN']);
    $API = new MyAPI($_REQUEST['request'], $fakeOrigin);
    echo $API->processAPI();
} catch (Exception $e) {
    echo json_encode(Array('error' => $e->getMessage()));
}

?>
