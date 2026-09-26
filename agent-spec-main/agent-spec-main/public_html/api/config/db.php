<?php
// Database configuration and connection handler
// Hostinger MySQL / Apache environment

header('Content-Type: application/json; charset=UTF-8');

// Allow credentials via environment or direct configuration
$db_host = getenv('DB_HOST') ?: '127.0.0.1';
$db_name = getenv('DB_NAME') ?: 'maze_bank';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') ?: '';
$db_port = getenv('DB_PORT') ?: '3306';

try {
    $dsn = "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset=utf8mb4";
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failure: ' . $e->getMessage()
    ]);
    exit;
}

// Utility response functions
function sendResponse($success, $message = '', $data = [], $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

// Helper to get authenticated user from session token
function getAuthenticatedUser($pdo) {
    $token = null;
    if (isset($_COOKIE['session_token'])) {
        $token = $_COOKIE['session_token'];
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
        }
    }

    if (!$token) {
        return null;
    }

    // Lookup session token (parameterized query for safety in standard helper)
    $stmt = $pdo->prepare("
        SELECT u.id, u.username, u.role, a.account_number, a.balance 
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN accounts a ON u.id = a.user_id
        WHERE s.session_token = :token
        LIMIT 1
    ");
    $stmt->execute([':token' => $token]);
    $user = $stmt->fetch();

    return $user ?: null;
}
