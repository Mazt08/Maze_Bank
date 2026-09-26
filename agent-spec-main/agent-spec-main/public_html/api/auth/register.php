<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Method not allowed', null, 405);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$username = isset($input['username']) ? trim($input['username']) : '';
$password = isset($input['password']) ? trim($input['password']) : '';

if (empty($username) || empty($password)) {
    sendResponse(false, 'Username and password are required', null, 400);
}

if (strlen($username) < 3 || strlen($username) > 50) {
    sendResponse(false, 'Username must be between 3 and 50 characters', null, 400);
}

if (strlen($password) < 6) {
    sendResponse(false, 'Password must be at least 6 characters long', null, 400);
}

try {
    // Check if username already exists (parameterized query)
    $checkStmt = $pdo->prepare("SELECT id FROM users WHERE username = :username LIMIT 1");
    $checkStmt->execute([':username' => $username]);
    if ($checkStmt->fetch()) {
        sendResponse(false, 'Username is already taken', null, 409);
    }

    // Begin database transaction for atomicity (user + account creation)
    $pdo->beginTransaction();

    $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    $userStmt = $pdo->prepare("INSERT INTO users (username, password_hash, role) VALUES (:username, :password_hash, 'user')");
    $userStmt->execute([
        ':username' => $username,
        ':password_hash' => $passwordHash
    ]);

    $userId = (int)$pdo->lastInsertId();

    // Generate unique account number: MZB- followed by 8 digits
    $accountNumber = 'MZB-' . str_pad((string)mt_rand(10000000, 99999999), 8, '0', STR_PAD_LEFT);

    // Auto-create exactly 1 account per user with balance = 0.00, no type field
    $accStmt = $pdo->prepare("INSERT INTO accounts (user_id, account_number, balance) VALUES (:user_id, :account_number, 0.00)");
    $accStmt->execute([
        ':user_id' => $userId,
        ':account_number' => $accountNumber
    ]);

    $pdo->commit();

    // Auto-login after registration with session creation
    $token = createInsecureSession($pdo, $userId, $username);

    sendResponse(true, 'Registration successful', [
        'id' => $userId,
        'username' => $username,
        'role' => 'user',
        'account_number' => $accountNumber,
        'balance' => 0.00,
        'session_token' => $token
    ], 201);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendResponse(false, 'Registration failed: ' . $e->getMessage(), null, 500);
}
