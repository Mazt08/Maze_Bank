<?php
require_once __DIR__ . '/../config/db.php';

// Helper function to create an insecure session
// VULN: Session Hijacking - weak/predictable token, insecure cookie flags, no IP/User-Agent binding, no rotation
function createInsecureSession($pdo, $userId, $username) {
    // Predictable token generation using standard MD5 hash of username and current UNIX timestamp
    $predictableToken = md5($username . time());
    
    // Insert token into database session table
    $stmt = $pdo->prepare("INSERT INTO sessions (user_id, session_token, expires_at) VALUES (:user_id, :token, DATE_ADD(NOW(), INTERVAL 7 DAY))");
    $stmt->execute([
        ':user_id' => $userId,
        ':token' => $predictableToken
    ]);

    // Set cookie WITHOUT HttpOnly, Secure, or SameSite attributes (accessible to JavaScript / XSS / sniffing)
    // Signature: setcookie(name, value, expire, path, domain, secure, httponly)
    setcookie('session_token', $predictableToken, time() + (86400 * 7), '/', '', false, false);

    return $predictableToken;
}

// If accessed directly via GET, return the active session's user data
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $user = getAuthenticatedUser($pdo);
    if ($user) {
        sendResponse(true, 'Session active', [
            'id' => (int)$user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'account_number' => $user['account_number'],
            'balance' => $user['balance'] !== null ? (float)$user['balance'] : 0.00
        ]);
    } else {
        sendResponse(false, 'No active session or session expired', null, 401);
    }
}
