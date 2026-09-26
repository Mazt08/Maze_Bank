<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/session.php';

// Accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Method not allowed', null, 405);
}

// Read raw JSON input or POST form data
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$username = isset($input['username']) ? trim($input['username']) : '';
$password = isset($input['password']) ? trim($input['password']) : '';

if (empty($username) || empty($password)) {
    sendResponse(false, 'Username and password are required', null, 400);
}

// VULN: Brute Force - No rate limiting, no account lockout mechanism, no CAPTCHA, and no timing delays on failed attempts.
// An attacker can issue infinite login attempts per minute to guess credentials.

// VULN: SQL Injection (string concatenation)
// User input is directly concatenated into the SQL statement without parameterization or sanitization.
// Example payload: "admin' -- " or "' OR '1'='1' -- "
$rawSql = "SELECT * FROM users WHERE username = '$username'";

try {
    $stmt = $pdo->query($rawSql);
    $user = $stmt->fetch();

    if ($user) {
        // If SQL injection was used (e.g. comment characters '--' or boolean true), password verification can be bypassed
        $isInjection = (strpos($username, "'") !== false || strpos($username, "--") !== false || strpos($username, "#") !== false);
        
        $passwordValid = false;
        if ($isInjection) {
            $passwordValid = true; // Injected query bypassed password constraint
        } elseif (password_verify($password, $user['password_hash'])) {
            $passwordValid = true; // Valid bcrypt hash match
        } elseif ($password === $user['password_hash']) {
            $passwordValid = true; // Plaintext fallback match for testing
        }

        if ($passwordValid) {
            // Create session using vulnerable session generator
            $token = createInsecureSession($pdo, $user['id'], $user['username']);

            // Fetch account details
            $accStmt = $pdo->prepare("SELECT account_number, balance FROM accounts WHERE user_id = :uid LIMIT 1");
            $accStmt->execute([':uid' => $user['id']]);
            $account = $accStmt->fetch();

            sendResponse(true, 'Login successful', [
                'id' => (int)$user['id'],
                'username' => $user['username'],
                'role' => $user['role'],
                'account_number' => $account ? $account['account_number'] : null,
                'balance' => $account ? (float)$account['balance'] : 0.00,
                'session_token' => $token
            ]);
        }
    }

    sendResponse(false, 'Invalid credentials', null, 401);
} catch (PDOException $e) {
    // In vulnerable apps, database error messages may also be surfaced
    sendResponse(false, 'Database error: ' . $e->getMessage(), null, 500);
}
