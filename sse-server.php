<?php
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');

$onlineCount = 0;
$messages = [];

while (true) {
    $newMessages = ["Nowa wiadomość 1", "Nowa wiadomość 2"];

    $onlineCount++;

    echo "data: " . json_encode(["onlineCount" => $onlineCount, "newMessages" => $newMessages]) . "\n\n";
    ob_flush();
    flush();

    sleep(5);
}
?>
