// Maze Bank - Transaction History Controller

document.addEventListener('DOMContentLoaded', async () => {
    const user = await requireAuth();
    if (!user) return;

    setupNavigation(user);
    await loadTransactions();
    setupSearch();
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
    } catch (e) {
        window.location.href = 'index.html';
        return null;
    }
}

function setupNavigation(user) {
    const userNameEl = document.getElementById('sidebarUserName');
    const userRoleEl = document.getElementById('sidebarUserRole');
    if (userNameEl) userNameEl.textContent = user.username;
    if (userRoleEl) userRoleEl.textContent = user.role;

    const adminNav = document.getElementById('adminNav');
    if (adminNav) {
        if (user.role === 'admin') {
            adminNav.classList.remove('d-none');
        } else {
            adminNav.classList.add('d-none');
        }
    }

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

async function loadTransactions(searchQuery = '') {
    const tableBody = document.getElementById('historyTableBody');
    const countBadge = document.getElementById('txCount');
    if (!tableBody) return;

    try {
        let url = 'api/transactions/history.php?limit=100';
        if (searchQuery) {
            url += `&search=${encodeURIComponent(searchQuery)}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (response.ok && data.success && data.data) {
            const txs = data.data.transactions;
            if (countBadge) countBadge.textContent = `${txs.length} records`;

            if (txs.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-state">No transaction records match the specified query.</td>
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
                        <td>#${tx.id}</td>
                        <td>${escapeHtml(tx.timestamp)}</td>
                        <td><span class="badge ${badgeClass}">${escapeHtml(tx.type)}</span></td>
                        <td>${escapeHtml(tx.description || 'Electronic Transfer')}</td>
                        <td>${counterparty}</td>
                        <td class="${amountClass} tabular-nums" style="text-align: right;">${amountDisplay}</td>
                    </tr>
                `;
            }).join('');
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">${escapeHtml(data.message || 'Error fetching records.')}</td>
                </tr>
            `;
        }
    } catch (err) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">Network error retrieving transaction statement.</td>
            </tr>
        `;
    }
}

function setupSearch() {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const resetBtn = document.getElementById('resetBtn');

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput ? searchInput.value.trim() : '';
            loadTransactions(query);
        });
    }

    if (resetBtn && searchInput) {
        resetBtn.addEventListener('click', () => {
            searchInput.value = '';
            loadTransactions('');
        });
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
