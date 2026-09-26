// Maze Bank - Dashboard Application Controller

document.addEventListener('DOMContentLoaded', async () => {
    const user = await requireAuth();
    if (!user) return;

    setupNavigation(user);
    await loadAccountData();
    await loadRecentTransactions();
});

async function requireAuth() {
    try {
        const response = await fetch('api/auth/session.php');
        if (!response.ok) {
            window.location.href = 'index.html';
            return null;
        }

        const data = await response.json();
        if (!data.success || !data.data) {
            window.location.href = 'index.html';
            return null;
        }

        return data.data;
    } catch (err) {
        window.location.href = 'index.html';
        return null;
    }
}

function setupNavigation(user) {
    // Populate user profile info in sidebar
    const userNameEl = document.getElementById('sidebarUserName');
    const userRoleEl = document.getElementById('sidebarUserRole');
    const greetingEl = document.getElementById('userGreeting');

    if (userNameEl) userNameEl.textContent = user.username;
    if (userRoleEl) userRoleEl.textContent = user.role;
    if (greetingEl) greetingEl.textContent = user.username;

    // Show admin navigation link if user is administrator
    const adminNav = document.getElementById('adminNav');
    if (adminNav) {
        if (user.role === 'admin') {
            adminNav.classList.remove('d-none');
        } else {
            adminNav.classList.add('d-none');
        }
    }

    // Logout button handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await fetch('api/auth/logout.php');
            } finally {
                window.location.href = 'index.html';
            }
        });
    }
}

async function loadAccountData() {
    try {
        const response = await fetch('api/accounts/balance.php');
        const data = await response.json();

        if (response.ok && data.success && data.data) {
            const acc = data.data;
            const accNumEl = document.getElementById('accountNumber');
            const accBalEl = document.getElementById('accountBalance');

            if (accNumEl) accNumEl.textContent = acc.account_number;
            if (accBalEl) {
                accBalEl.textContent = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(acc.balance);
            }
        }
    } catch (err) {
        console.error('Failed to load account details:', err);
    }
}

async function loadRecentTransactions() {
    const tableBody = document.getElementById('recentTransactionsBody');
    if (!tableBody) return;

    try {
        const response = await fetch('api/transactions/history.php?limit=5');
        const data = await response.json();

        if (response.ok && data.success && data.data) {
            const txs = data.data.transactions;
            if (txs.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="empty-state">No recent transactions recorded.</td>
                    </tr>
                `;
                return;
            }

            tableBody.innerHTML = txs.map(tx => {
                const isCredit = tx.type === 'credit';
                const formattedAmount = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(tx.amount);

                const amountDisplay = isCredit ? `+${formattedAmount}` : `-${formattedAmount}`;
                const amountClass = isCredit ? 'amount-credit' : 'amount-debit';
                const badgeClass = isCredit ? 'badge-credit' : 'badge-debit';
                const counterparty = isCredit ? `From: ${escapeHtml(tx.from_account)}` : `To: ${escapeHtml(tx.to_account)}`;

                return `
                    <tr>
                        <td>${escapeHtml(tx.timestamp)}</td>
                        <td><span class="badge ${badgeClass}">${escapeHtml(tx.type)}</span></td>
                        <td>${escapeHtml(tx.description || 'Transfer')}</td>
                        <td>${counterparty}</td>
                        <td class="${amountClass} tabular-nums" style="text-align: right;">${amountDisplay}</td>
                    </tr>
                `;
            }).join('');
        }
    } catch (err) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">Unable to load recent transactions.</td>
            </tr>
        `;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
