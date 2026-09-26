<?php
require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Method not allowed', null, 405);
}

$user = getAuthenticatedUser($pdo);
if (!$user) {
    sendResponse(false, 'Unauthorized. Please log in.', null, 401);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$recipientAccount = isset($input['to_account']) ? trim($input['to_account']) : '';
$amount = isset($input['amount']) ? (float)$input['amount'] : 0.00;
$description = isset($input['description']) ? trim($input['description']) : 'Funds Transfer';

if (empty($recipientAccount)) {
    sendResponse(false, 'Recipient account number is required', null, 400);
}

if ($amount <= 0.00) {
    sendResponse(false, 'Transfer amount must be greater than $0.00', null, 400);
}

if ($recipientAccount === $user['account_number']) {
    sendResponse(false, 'Cannot transfer funds to your own account', null, 400);
}

try {
    $pdo->beginTransaction();

    // Check sender account and lock row for update
    $senderStmt = $pdo->prepare("SELECT id, account_number, balance FROM accounts WHERE user_id = :uid FOR UPDATE");
    $senderStmt->execute([':uid' => $user['id']]);
    $senderAcc = $senderStmt->fetch();

    if (!$senderAcc) {
        $pdo->rollBack();
        sendResponse(false, 'Sender account not found', null, 404);
    }

    if ((float)$senderAcc['balance'] < $amount) {
        $pdo->rollBack();
        sendResponse(false, 'Insufficient funds for this transfer', null, 400);
    }

    // Check recipient account
    $recipStmt = $pdo->prepare("SELECT id, account_number, balance FROM accounts WHERE account_number = :to_acc FOR UPDATE");
    $recipStmt->execute([':to_acc' => $recipientAccount]);
    $recipAcc = $recipStmt->fetch();

    if (!$recipAcc) {
        $pdo->rollBack();
        sendResponse(false, 'Recipient account number was not found', null, 404);
    }

    // Deduct from sender
    $deductStmt = $pdo->prepare("UPDATE accounts SET balance = balance - :amount WHERE id = :id");
    $deductStmt->execute([
        ':amount' => $amount,
        ':id' => $senderAcc['id']
    ]);

    // Add to recipient
    $creditStmt = $pdo->prepare("UPDATE accounts SET balance = balance + :amount WHERE id = :id");
    $creditStmt->execute([
        ':amount' => $amount,
        ':id' => $recipAcc['id']
    ]);

    // Record transaction
    $txStmt = $pdo->prepare("INSERT INTO transactions (from_account, to_account, amount, description) VALUES (:from_acc, :to_acc, :amount, :desc)");
    $txStmt->execute([
        ':from_acc' => $senderAcc['account_number'],
        ':to_acc' => $recipientAccount,
        ':amount' => $amount,
        ':desc' => $description
    ]);

    $pdo->commit();

    $newBalance = (float)$senderAcc['balance'] - $amount;

    sendResponse(true, 'Transfer completed successfully', [
        'from_account' => $senderAcc['account_number'],
        'to_account' => $recipientAccount,
        'amount' => $amount,
        'new_balance' => $newBalance,
        'description' => $description
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendResponse(false, 'Transfer failed: ' . $e->getMessage(), null, 500);
}
