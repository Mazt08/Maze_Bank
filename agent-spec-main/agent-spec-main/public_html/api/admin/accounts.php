<?php
require_once __DIR__ . '/../config/db.php';

$user = getAuthenticatedUser($pdo);
if (!$user || $user['role'] !== 'admin') {
    sendResponse(false, 'Forbidden: Admin access required', null, 403);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Method not allowed', null, 405);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$targetUserId = isset($input['user_id']) ? (int)$input['user_id'] : 0;

if ($targetUserId <= 0) {
    sendResponse(false, 'Valid user ID is required', null, 400);
}

try {
    // Check if target user exists
    $userStmt = $pdo->prepare("SELECT id, username FROM users WHERE id = :id LIMIT 1");
    $userStmt->execute([':id' => $targetUserId]);
    $targetUser = $userStmt->fetch();

    if (!$targetUser) {
        sendResponse(false, 'Target user does not exist', null, 404);
    }

    // Check if target user already has an account
    $accCheckStmt = $pdo->prepare("SELECT id, account_number FROM accounts WHERE user_id = :uid LIMIT 1");
    $accCheckStmt->execute([':uid' => $targetUserId]);
    if ($accCheckStmt->fetch()) {
        sendResponse(false, 'User already has an assigned account. Each user can have exactly one account.', null, 409);
    }

    // Generate unique account number
    $accountNumber = 'MZB-' . str_pad((string)mt_rand(10000000, 99999999), 8, '0', STR_PAD_LEFT);

    // Add account: balance always 0.00, no type parameter
    $insertStmt = $pdo->prepare("INSERT INTO accounts (user_id, account_number, balance) VALUES (:user_id, :account_number, 0.00)");
    $insertStmt->execute([
        ':user_id' => $targetUserId,
        ':account_number' => $accountNumber
    ]);

    sendResponse(true, 'Account created successfully for user ' . $targetUser['username'], [
        'account_id' => (int)$pdo->lastInsertId(),
        'user_id' => $targetUserId,
        'username' => $targetUser['username'],
        'account_number' => $accountNumber,
        'balance' => 0.00
    ], 201);

} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        sendResponse(false, 'Duplicate account constraint violation: User already has an account', null, 409);
    }
    sendResponse(false, 'Failed to create account: ' . $e->getMessage(), null, 500);
}
