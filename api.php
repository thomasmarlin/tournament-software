<?php

ob_start();

$oldErrLevel = error_reporting();
print("Error level: $oldErrLevel");

// For production, disable errors
error_reporting(0);


require 'MyAPI.class.php';


//print_r($_REQUEST);
//print_r($_SERVER);
//print_r($HTTP_RAW_POST_DATA);

try {
    //$API = new MyAPI($_REQUEST['request'], $_SERVER['HTTP_ORIGIN']);
    //$API = new MyAPI($_REQUEST['request'], $fakeOrigin);
    //$API = new MyAPI($_REQUEST, $fakeOrigin);
    $API = new MyAPI($_REQUEST, $HTTP_RAW_POST_DATA);
    echo '====JSONRESULTS====' . $API->processAPI();
    obj_end();
} catch (Exception $e) {
    echo json_encode(Array('error' => $e->getMessage()));
}

?>
