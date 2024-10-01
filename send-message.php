<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Odbieranie danych z formularza
    $name = htmlspecialchars(trim($_POST['name'])); // Zabezpieczenie przed XSS
    $email = filter_var(trim($_POST['email']), FILTER_VALIDATE_EMAIL); // Walidacja adresu email
    $message = htmlspecialchars(trim($_POST['message']));

    // Sprawdzanie, czy wszystkie pola zostały wypełnione
    if ($name && $email && $message) {
        // Adres e-mail, na który zostanie wysłana wiadomość
        $to = "janekmitrowski12@gmail.com";
        $subject = "Wiadomość od " . $name;
        $body = "Imię i nazwisko: $name\nEmail: $email\nWiadomość:\n$message";
        $headers = "From: $email";

        // Wysyłanie e-maila
        if (mail($to, $subject, $body, $headers)) {
            echo "<p>Wiadomość została wysłana. Dziękujemy za kontakt!</p>";
        } else {
            echo "<p>Wystąpił błąd przy wysyłaniu wiadomości. Spróbuj ponownie później.</p>";
        }
    } else {
        echo "<p>Upewnij się, że wszystkie pola zostały poprawnie wypełnione.</p>";
    }
}
?>
