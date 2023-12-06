<?php

// Pobierz dane z żądania POST
$nickname = isset($_POST['nickname']) ? $_POST['nickname'] : '';
$message = isset($_POST['message']) ? $_POST['message'] : '';

// Sprawdź, czy zarówno nick, jak i wiadomość są dostarczone
if (!empty($nickname) && !empty($message)) {
    // Tutaj możesz zaimplementować kod obsługi wiadomości, np. zapisując je do pliku, bazy danych itp.

    // W tym przykładzie zapisujemy do pliku
    $logFile = 'messages.log';
    $formattedMessage = date('Y-m-d H:i:s') . " - $nickname: $message\n";
    file_put_contents($logFile, $formattedMessage, FILE_APPEND | LOCK_EX);
}