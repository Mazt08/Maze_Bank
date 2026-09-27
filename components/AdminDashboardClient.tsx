"use client";

/**
 * Admin Dashboard Client Component
 * Handles user management UI: list, search, balance adjustment, freeze
 */
import { useState, useEffect } from "react";
import {
  getAllUsers,
  searchUsers,
  creditDebitUser,
  toggleUserFreeze,
} from "@/actions/admin";
import { formatCents } from "@/lib/utils";

interface User {
  uid: string;
  name: string;
  email: string;
  accountNumber: string;
  balance: number;
  role?: string;
  isFrozen?: boolean;
  createdAt: string;
}

interface ActionState {
  isLoading: boolean;
  error?: string;
  success?: boolean;
}

export default function AdminDashboardClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionState, setActionState] = useState<ActionState>({ isLoading: false });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);

  // Load initial users
  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setIsLoadingUsers(true);
    const result = await getAllUsers(50, 0);
    if (result.error) {
      setActionState({ isLoading: false, error: result.error });
    } else {
      setUsers(result.users || []);
      setActionState({ isLoading: false });
    }
    setIsLoadingUsers(false);
  }

  async function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      loadUsers();
      return;
    }

    setIsLoadingUsers(true);
    const result = await searchUsers(query);
    if (result.error) {
      setActionState({ isLoading: false, error: result.error });
      setUsers([]);
    } else {
      setUsers(result.users || []);
      setActionState({ isLoading: false });
    }
    setIsLoadingUsers(false);
  }

  async function handleCreditDebit() {
    if (!selectedUser || !adjustmentAmount || !adjustmentReason.trim()) {
      setActionState({ isLoading: false, error: "Please fill all fields." });
      return;
    }

    const amountDollars = parseFloat(adjustmentAmount);
    if (isNaN(amountDollars)) {
      setActionState({ isLoading: false, error: "Invalid amount." });
      return;
    }

    const amountCents = Math.round(amountDollars * 100);
    setActionState({ isLoading: true });

    const result = await creditDebitUser(selectedUser.uid, amountCents, adjustmentReason);
    if (result.error) {
      setActionState({ isLoading: false, error: result.error });
    } else {
      setActionState({ isLoading: false, success: true });
      setAdjustmentAmount("");
      setAdjustmentReason("");
      setSelectedUser(null);
      loadUsers();

      // Clear success message after 2s
      setTimeout(() => setActionState({ isLoading: false }), 2000);
    }
  }

  async function handleToggleFreeze(user: User) {
    setActionState({ isLoading: true });
    const result = await toggleUserFreeze(user.uid, !(user.isFrozen ?? false));

    if (result.error) {
      setActionState({ isLoading: false, error: result.error });
    } else {
      setActionState({ isLoading: false, success: true });
      loadUsers();
      setTimeout(() => setActionState({ isLoading: false }), 2000);
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Search Users
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search by name or account number..."
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </div>

      {/* Status Messages */}
      {actionState.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {actionState.error}
        </div>
      )}
      {actionState.success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          ✓ Action completed successfully
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Email</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Account #</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Balance</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingUsers ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.uid} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{user.name}</td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 font-mono text-sm">{user.accountNumber}</td>
                    <td className="px-6 py-4 text-right font-semibold">
                      {formatCents(user.balance)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.isFrozen
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {user.isFrozen ? "🔒 Frozen" : "✓ Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowTransactionHistory(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-sm hover:underline"
                      >
                        View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowTransactionHistory(false);
                        }}
                        className="text-gold hover:text-gold-light font-sm hover:underline"
                      >
                        Adjust
                      </button>
                      <button
                        onClick={() => handleToggleFreeze(user)}
                        className="text-red-600 hover:text-red-800 font-sm hover:underline"
                        disabled={actionState.isLoading}
                      >
                        {user.isFrozen ? "Unfreeze" : "Freeze"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjustment Modal */}
      {selectedUser && !showTransactionHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h2 className="text-xl font-bold text-brand-dark mb-4">
              Balance Adjustment
            </h2>
            <p className="text-gray-600 mb-4">
              User: <strong>{selectedUser.name}</strong> ({selectedUser.accountNumber})
            </p>
            <p className="text-gray-600 mb-4">
              Current Balance: <strong>{formatCents(selectedUser.balance)}</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Amount (dollars, can be negative to debit)
                </label>
                <input
                  type="number"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  placeholder="e.g., 100 or -50"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Reason
                </label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Why is this adjustment being made?"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold h-24 resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreditDebit}
                  disabled={actionState.isLoading}
                  className="flex-1 bg-gold hover:bg-gold-light text-brand-dark font-bold py-2 rounded transition-colors disabled:opacity-50"
                >
                  {actionState.isLoading ? "Processing..." : "Apply Adjustment"}
                </button>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setAdjustmentAmount("");
                    setAdjustmentReason("");
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {selectedUser && showTransactionHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-brand-dark">
                Transactions: {selectedUser.name}
              </h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Full transaction history for {selectedUser.accountNumber}
            </p>

            <div className="text-sm text-gray-600 text-center py-8">
              Transaction details would be displayed here. Currently showing placeholder.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
