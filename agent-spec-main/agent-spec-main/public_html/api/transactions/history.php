<?php
require_once __DIR__ . '/../config/db.php';

$user = getAuthenticatedUser($pdo);
if (!$user) {
    sendResponse(false, 'Unauthorized. Please log in.', null, 401);
}

$userAccount = $user['account_number'] ?? '';
$search = isset($_GET['search']) ? $_GET['search'] : '';
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;

try {
    // VULN: SQL Injection in search/filter
    // The search parameter is directly concatenated into the SQL statement without parameterization or sanitization.
    // Example attack payload: ' OR '1'='1' -- or ' UNION SELECT 1, username, password_hash, 0, 'leaked', NOW() FROM users -- 
    if (!empty($search)) {
        $rawSql = "SELECT * FROM transactions 
                   WHERE (from_account = '$userAccount' OR to_account = '$userAccount') 
                   AND (description LIKE '%$search%' OR to_account LIKE '%$search%' OR from_account LIKE '%$search%') 
                   ORDER BY timestamp DESC LIMIT " . $limit;
        $stmt = $pdo->query($rawSql);
    } else {
        // If no search filter is applied, run standard query
        $rawSql = "SELECT * FROM transactions 
                   WHERE (from_account = '$userAccount' OR to_account = '$userAccount') 
                   ORDER BY timestamp DESC LIMIT " . $limit;
        $stmt = $pdo->query($rawSql);
    }

    $rawTransactions = $stmt->fetchAll();

    $transactions = [];
    foreach ($rawTransactions as $tx) {
        $isDebit = ($tx['from_account'] === $userAccount);
        $transactions[] = [
            'id' => (int)($tx['id'] ?? 0),
            'from_account' => $tx['from_account'] ?? '',
            'to_account' => $tx['to_account'] ?? '',
            'amount' => (float)($tx['amount'] ?? 0.00),
            'type' => $isDebit ? 'debit' : 'credit',
            'description' => $tx['description'] ?? '',
            'timestamp' => $tx['timestamp'] ?? ''
        ];
    }

    sendResponse(true, 'Transaction history retrieved', [
        'account_number' => $userAccount,
        'count' => count($transactions),
        'transactions' => $transactions
    ]);

} catch (PDOException $e) {
    sendResponse(false, 'Database query error: ' . $e->getMessage(), null, 500);
}
