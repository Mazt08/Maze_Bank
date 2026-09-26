<?php
require_once __DIR__ . '/../config/db.php';

$token = null;
if (isset($_COOKIE['session_token'])) {
    $token = $_COOKIE['session_token'];
}

if ($token) {
    $stmt = $pdo->prepare("DELETE FROM sessions WHERE session_token = :token");
    $stmt->execute([':token' => $token]);
}

// Clear cookie
setcookie('session_token', '', time() - 3600, '/', '', false, false);

sendResponse(true, 'Logged out successfully');
