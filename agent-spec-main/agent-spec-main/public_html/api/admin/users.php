<?php
require_once __DIR__ . '/../config/db.php';

$user = getAuthenticatedUser($pdo);
if (!$user || $user['role'] !== 'admin') {
    sendResponse(false, 'Forbidden: Admin access required', null, 403);
}

try {
    $stmt = $pdo->prepare("
        SELECT 
            u.id, 
            u.username, 
            u.role, 
            u.created_at as registered_at,
            a.id as account_id,
            a.account_number, 
            a.balance
        FROM users u
        LEFT JOIN accounts a ON u.id = a.user_id
        ORDER BY u.id ASC
    ");
    $stmt->execute();
    $users = $stmt->fetchAll();

    $result = [];
    foreach ($users as $u) {
        $result[] = [
            'id' => (int)$u['id'],
            'username' => $u['username'],
            'role' => $u['role'],
            'registered_at' => $u['registered_at'],
            'has_account' => $u['account_id'] !== null,
            'account_number' => $u['account_number'],
            'balance' => $u['balance'] !== null ? (float)$u['balance'] : null
        ];
    }

    sendResponse(true, 'Users retrieved successfully', [
        'users' => $result
    ]);

} catch (PDOException $e) {
    sendResponse(false, 'Database error: ' . $e->getMessage(), null, 500);
}
