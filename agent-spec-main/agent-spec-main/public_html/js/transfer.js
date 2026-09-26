// Maze Bank - Transfer Module Controller

document.addEventListener('DOMContentLoaded', async () => {
    const user = await requireAuth();
    if (!user) return;

    setupNavigation(user);
    await loadSenderAccount();
    setupTransferForm();
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

async function loadSenderAccount() {
    try {
        const response = await fetch('api/accounts/balance.php');
        const data = await response.json();
        if (response.ok && data.success && data.data) {
            const acc = data.data;
            const fromAccountInput = document.getElementById('fromAccount');
            const availableBalanceEl = document.getElementById('availableBalance');

            if (fromAccountInput) fromAccountInput.value = `${acc.account_number}`;
            if (availableBalanceEl) {
                availableBalanceEl.textContent = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(acc.balance);
            }
        }
    } catch (err) {
        console.error('Failed to load sender account details:', err);
    }
}

function setupTransferForm() {
    const form = document.getElementById('transferForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAlerts();

        const submitBtn = form.querySelector('button[type="submit"]');
        const toAccount = document.getElementById('toAccount').value.trim();
        const amount = parseFloat(document.getElementById('amount').value);
        const description = document.getElementById('description').value.trim() || 'Electronic Funds Transfer';

        if (!toAccount) {
            showAlert('Please enter a valid recipient account number.', 'danger');
            return;
        }

        if (isNaN(amount) || amount <= 0) {
            showAlert('Please enter a transfer amount greater than $0.00.', 'danger');
            return;
        }

        setLoading(submitBtn, true);

        try {
            const response = await fetch('api/transfers/transfer.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to_account: toAccount,
                    amount: amount,
                    description: description
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const formattedAmount = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(amount);

                showAlert(`Successfully transferred ${formattedAmount} to account ${toAccount}.`, 'success');
                form.reset();
                await loadSenderAccount();
            } else {
                showAlert(data.message || 'Transfer failed.', 'danger');
            }
        } catch (err) {
            showAlert('Network error: Unable to process transfer request.', 'danger');
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
        button.textContent = 'Transferring...';
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || 'Send Transfer';
    }
}
