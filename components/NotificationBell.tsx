"use client";

/**
 * Notification Bell Component
 * Shows unread count badge and dropdown with notifications
 */
import { useEffect, useRef, useState } from "react";
import { getNotifications, getUnreadCount, markAllAsRead } from "@/actions/notifications";

interface Notification {
  id: string;
  message: string;
  read: boolean;
  type: string;
  createdAt: string;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load notifications
  async function loadNotifications() {
    setIsLoading(true);
    const [notifResult, countResult] = await Promise.all([
      getNotifications(10),
      getUnreadCount(),
    ]);

    if (notifResult.notifications) {
      setNotifications(notifResult.notifications);
    }
    if (countResult.count !== undefined) {
      setUnreadCount(countResult.count);
    }
    setIsLoading(false);
  }

  // Initial load
  useEffect(() => {
    loadNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  async function handleOpenDropdown() {
    if (!isOpen) {
      setIsOpen(true);
      await loadNotifications();
      if (unreadCount > 0) {
        await markAllAsRead();
        setUnreadCount(0);
      }
    } else {
      setIsOpen(false);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpenDropdown}
        className="relative p-2 text-white hover:text-gold transition-colors"
        aria-label="Notifications"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gold-light">
          {/* Header */}
          <div className="bg-brand text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
            <h3 className="font-bold">Notifications</h3>
            {notifications.length > 0 && (
              <span className="text-xs bg-gold text-brand-dark px-2 py-1 rounded">
                {notifications.length}
              </span>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-gray-500">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                    !notif.read ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex gap-2">
                    <div className="flex-shrink-0 pt-1">
                      {notif.type === "transfer_received" && (
                        <span className="text-green-600">💰</span>
                      )}
                      {notif.type === "large_debit" && (
                        <span className="text-red-600">⚠️</span>
                      )}
                      {notif.type === "admin_action" && (
                        <span className="text-blue-600">⚙️</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notif.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t text-center">
              <button
                onClick={async () => {
                  await markAllAsRead();
                  setUnreadCount(0);
                  await loadNotifications();
                }}
                className="text-xs text-gold hover:text-gold-light font-semibold"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
