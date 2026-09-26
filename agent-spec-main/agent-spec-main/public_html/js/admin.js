// Maze Bank - Admin Panel Controller

document.addEventListener('DOMContentLoaded', async () => {
    const user = await requireAuth();
    if (!user || user.role !== 'admin') {
        window.location.href = 'dashboard.html';
        return;
    }

    setupNavigation(user);
    await loadUsers();
    setupAddAccountForm();
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
    if (adminNav) adminNav.classList.remove('d-none');

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

async function loadUsers() {
    const tableBody = document.getElementById('usersTableBody');
    const userCountEl = document.getElementById('userCount');
    if (!tableBody) return;

    try {
        const response = await fetch('api/admin/users.php');
        const data = await response.json();

        if (response.ok && data.success && data.data) {
            const users = data.data.users;
            if (userCountEl) userCountEl.textContent = `${users.length} registered`;

            if (users.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-state">No registered users found.</td>
                    </tr>
                `;
                return;
            }

            tableBody.innerHTML = users.map(u => {
                const roleBadge = u.role === 'admin'
                    ? '<span class="badge badge-admin">Admin</span>'
                    : '<span class="badge badge-user">User</span>';

                const balanceDisplay = u.balance !== null
                    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(u.balance)
                    : 'N/A';

                const accountDisplay = u.account_number || 'None';

                return `
                    <tr>
                        <td>${u.id}</td>
                        <td>${escapeHtml(u.username)}</td>
                        <td>${roleBadge}</td>
                        <td>${escapeHtml(accountDisplay)}</td>
                        <td class="tabular-nums">${balanceDisplay}</td>
                        <td>${escapeHtml(u.registered_at)}</td>
                    </tr>
                `;
            }).join('');
        }
    } catch (err) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">Failed to load user data.</td>
            </tr>
        `;
    }
}

function setupAddAccountForm() {
    const form = document.getElementById('addAccountForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAlerts();

        const submitBtn = form.querySelector('button[type="submit"]');
        const userId = parseInt(document.getElementById('addAccountUserId').value, 10);

        if (isNaN(userId) || userId <= 0) {
            showAlert('Enter a valid user ID.', 'danger');
            return;
        }

        setLoading(submitBtn, true);

        try {
            const response = await fetch('api/admin/accounts.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showAlert(`Account ${data.data.account_number} created for user ${data.data.username}.`, 'success');
                form.reset();
                await loadUsers();
            } else {
                showAlert(data.message || 'Failed to create account.', 'danger');
            }
        } catch (err) {
            showAlert('Network error: Unable to create account.', 'danger');
        } finally {
            setLoading(submitBtn, false);
        }
    });
}

function showAlert(message, type = 'danger') {
    const alertBox = document.getElementById('alertBox');
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.classList.remove('d-none');
}

function clearAlerts() {
    const alertBox = document.getElementById('alertBox');
    if (!alertBox) return;
    alertBox.textContent = '';
    alertBox.classList.add('d-none');
}

function setLoading(button, isLoading) {
    if (!button) return;
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = 'Processing...';
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || 'Submit';
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
