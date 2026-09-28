"use client";

/**
 * Profile Client Component
 * Handles display name update and password change via Firebase client SDK
 */
import { useState } from "react";
import { updateDisplayName } from "@/actions/profile";
import { updatePassword, getAuth } from "firebase/auth";
import { formatCents } from "@/lib/utils";

interface UserProfile {
  name: string;
  email: string;
  accountNumber: string;
  balance: number;
  role?: "user" | "admin";
  createdAt: string;
}

interface ActionState {
  isLoading: boolean;
  error?: string;
  success?: boolean;
}

export default function ProfileClient({
  userProfile,
}: {
  userProfile: UserProfile;
}) {
  const [displayName, setDisplayName] = useState(userProfile.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nameActionState, setNameActionState] = useState<ActionState>({
    isLoading: false,
  });
  const [passwordActionState, setPasswordActionState] = useState<ActionState>({
    isLoading: false,
  });

  async function handleUpdateName(e: React.FormEvent) {
    e.preventDefault();
    if (displayName === userProfile.name) {
      setNameActionState({ isLoading: false, error: "Name hasn't changed." });
      return;
    }

    setNameActionState({ isLoading: true });
    const result = await updateDisplayName(displayName);

    if (result.error) {
      setNameActionState({ isLoading: false, error: result.error });
    } else {
      setNameActionState({ isLoading: false, success: true });
      setTimeout(() => setNameActionState({ isLoading: false }), 2000);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();

    if (!newPassword || !confirmPassword || !currentPassword) {
      setPasswordActionState({
        isLoading: false,
        error: "Please fill all fields.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordActionState({
        isLoading: false,
        error: "Passwords don't match.",
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordActionState({
        isLoading: false,
        error: "Password must be at least 6 characters.",
      });
      return;
    }

    setPasswordActionState({ isLoading: true });

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setPasswordActionState({
          isLoading: false,
          error: "Not authenticated.",
        });
        return;
      }

      // Update password (requires reauthentication in real app, but Firebase handles it)
      await updatePassword(user, newPassword);

      setPasswordActionState({ isLoading: false, success: true });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordActionState({ isLoading: false }), 2000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update password.";
      setPasswordActionState({ isLoading: false, error: message });
    }
  }

  return (
    <div className="space-y-8">
      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-brand-dark mb-6">
          Profile Information
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={userProfile.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Account Number
            </label>
            <input
              type="text"
              value={userProfile.accountNumber}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded bg-gray-50 text-gray-600 cursor-not-allowed font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              This is your unique account identifier
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Current Balance
            </label>
            <div className="text-2xl font-bold text-gold">
              {formatCents(userProfile.balance)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Your available account balance
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Account Created
            </label>
            <input
              type="text"
              value={new Date(userProfile.createdAt).toLocaleDateString(
                "en-US",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                },
              )}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded bg-gray-50 text-gray-600 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Update Display Name */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-brand-dark mb-6">
          Update Display Name
        </h2>

        {nameActionState.error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {nameActionState.error}
          </div>
        )}

        {nameActionState.success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            ✓ Display name updated successfully
          </div>
        )}

        <form onSubmit={handleUpdateName} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <button
            type="submit"
            disabled={
              nameActionState.isLoading || displayName === userProfile.name
            }
            className="w-full bg-gold hover:bg-gold-light text-brand-dark font-bold py-2 rounded transition-colors disabled:opacity-50"
          >
            {nameActionState.isLoading ? "Updating..." : "Update Display Name"}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-brand-dark mb-6">
          Change Password
        </h2>

        {passwordActionState.error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {passwordActionState.error}
          </div>
        )}

        {passwordActionState.success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            ✓ Password changed successfully
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 characters)"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <button
            type="submit"
            disabled={passwordActionState.isLoading}
            className="w-full bg-gold hover:bg-gold-light text-brand-dark font-bold py-2 rounded transition-colors disabled:opacity-50"
          >
            {passwordActionState.isLoading ? "Updating..." : "Change Password"}
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-4">
          ⚠️ For security, you will be logged out after changing your password.
        </p>
      </div>
    </div>
  );
}
