<?php
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');

// Inicjalizacja danych, np. z bazy danych
$onlineUsers = [];

while (true) {
    // Symulowane odczytywanie nowych wiadomości z bazy danych lub innego źródła
    $newMessages = ["Nowa wiadomość 1", "Nowa wiadomość 2"];

    // Symulowana zmiana online użytkowników
    $onlineUsers = ["user1", "user2"];

    // Wyślij dane do klienta za pomocą SSE
    echo "data: " . json_encode(["onlineUsers" => $onlineUsers, "newMessages" => $newMessages]) . "\n\n";

    // Opróżnij bufor i wyślij dane do klienta
    ob_flush();
    flush();

    // Symulowany interwał odświeżania (możesz dostosować)
    sleep(5);
}
?>
