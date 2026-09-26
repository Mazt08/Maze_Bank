<?php
require_once __DIR__ . '/../config/db.php';

$user = getAuthenticatedUser($pdo);
if (!$user) {
    sendResponse(false, 'Unauthorized. Please log in.', null, 401);
}

// Fetch up-to-date account details
$stmt = $pdo->prepare("SELECT id, user_id, account_number, balance, created_at FROM accounts WHERE user_id = :uid LIMIT 1");
$stmt->execute([':uid' => $user['id']]);
$account = $stmt->fetch();

if (!$account) {
    sendResponse(false, 'No active account found for this user', null, 404);
}

sendResponse(true, 'Account balance retrieved', [
    'account_id' => (int)$account['id'],
    'account_number' => $account['account_number'],
    'balance' => (float)$account['balance'],
    'created_at' => $account['created_at'],
    'username' => $user['username']
]);
