<?php
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');

// Początkowy stan licznika online
$onlineCount = 0;

while (true) {
    // Symulowane odczytywanie nowych wiadomości z bazy danych lub innego źródła
    $newMessages = ["Nowa wiadomość 1", "Nowa wiadomość 2"];

    // Aktualizacja licznika online (możesz to dostosować do swoich potrzeb)
    $onlineCount++;

    // Wyślij dane do klienta za pomocą SSE
    echo "data: " . json_encode(["onlineCount" => $onlineCount, "newMessages" => $newMessages]) . "\n\n";

    // Opróżnij bufor i wyslij dane do klienta
    ob_flush();
    flush();

    // Symulowany interwał odświeżania (możesz dostosować)
    sleep(5);
}
?>