-- Maze Bank Seed Data
-- Fictitious demo data for academic/testing environment

-- Clear existing data (in dependency order)
DELETE FROM transactions;
DELETE FROM sessions;
DELETE FROM accounts;
DELETE FROM users;

-- Passwords:
-- admin / AdminSecure2026! -> SHA256 / plaintext / md5 or password_hash
-- In a vulnerable demo context, we provide standard hashes and support direct checking.
-- Password hash for 'AdminSecure2026!'
-- Password hash for 'CustomerPass123!'
-- Password hash for 'JohnDoePass456!'

INSERT INTO users (id, username, password_hash, role) VALUES
(1, 'admin', '$2y$10$w8T0MhNfM1R/XWbU1Hw6w.oYd.23d38W9F75gN1p5P7jLzJ3K0N0G', 'admin'),
(2, 'johndoe', '$2y$10$zY93FwW1lFzU2xP6V1Ww8.r6V3S6Z2S9S4S1D7F5G8H3J2K1L9M8N', 'user'),
(3, 'janesmith', '$2y$10$mN84BxX2kGyV3yQ7W2Xx9.s7W4T7A3T0T5T2E8G6H9J4K3L2M0N9O', 'user'),
(4, 'robert_taylor', '$2y$10$oP95CyY3lHzW4zR8X3Yy0.t8X5U8B4U1U6U3F9H7I0K5L4M3N1O0P', 'user');

INSERT INTO accounts (id, user_id, account_number, balance) VALUES
(1, 1, 'MZB-10000001', 50000.00),
(2, 2, 'MZB-10000002', 12450.75),
(3, 3, 'MZB-10000003', 8930.50),
(4, 4, 'MZB-10000004', 3120.00);

INSERT INTO transactions (id, from_account, to_account, amount, description, timestamp) VALUES
(1, 'MZB-10000001', 'MZB-10000002', 2500.00, 'Direct deposit payroll', '2026-09-10 09:15:00'),
(2, 'MZB-10000002', 'MZB-10000003', 450.00, 'Consulting invoice #1042', '2026-09-12 14:30:00'),
(3, 'MZB-10000003', 'MZB-10000004', 120.50, 'Shared cloud subscription', '2026-09-15 11:22:00'),
(4, 'MZB-10000001', 'MZB-10000004', 1800.00, 'Equipment stipend', '2026-09-18 16:45:00'),
(5, 'MZB-10000004', 'MZB-10000002', 75.00, 'Reimbursement dinner', '2026-09-20 19:10:00');
