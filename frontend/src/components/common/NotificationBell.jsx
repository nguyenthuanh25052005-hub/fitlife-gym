import { useState, useEffect, useRef, useCallback } from "react";
import { formatDateTime } from "../../utils/dateTime";
import api from "../../services/api";

export default function NotificationBell({ role = "member", onNotificationClick }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const pollingRef = useRef(null);
  const knownNotificationIdsRef = useRef(new Set());

  const fetchNotifications = useCallback(async () => {
    try {
      const endpoint = role === "admin" ? "/admin/notifications" : "/payments/notifications";
      const response = await api.get(endpoint);
      const data = response.data;
      if (data.success) {
        const notifs = data.data?.notifications || data.data || [];
        const previousIds = knownNotificationIdsRef.current;
        const hasNewPaymentRequest = role === "admin" && previousIds.size > 0 && notifs.some(
          (notification) => notification.type === "payment" && !previousIds.has(notification.id)
        );

        knownNotificationIdsRef.current = new Set(notifs.map((notification) => notification.id));
        setNotifications(notifs);
        setUnreadCount(data.data?.unread_count || notifs.filter(n => !n.is_read).length);

        if (hasNewPaymentRequest) {
          window.dispatchEvent(new CustomEvent("fitlife:payment-updated"));
        }
      }
    } catch {
      // silently fail
    }
  }, [role]);

  useEffect(() => {
    fetchNotifications();
    pollingRef.current = setInterval(fetchNotifications, role === "admin" ? 2500 : 5000);
    return () => clearInterval(pollingRef.current);
  }, [fetchNotifications, role]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markRead = async (notification) => {
    const id = notification.id;
    try {
      const endpoint = role === "admin" ? `/admin/notifications/${id}/read` : `/user/notifications/${id}/read`;
      if (endpoint) {
        await api.put(endpoint);
      }
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => notification.is_read ? prev : Math.max(0, prev - 1));
      if (onNotificationClick) onNotificationClick(notification);
      setShowDropdown(false);
    } catch {}
  };

  const getIcon = (type) => {
    switch(type) {
      case "order": return "🛒";
      case "payment": return "💳";
      case "member": return "👤";
      case "booking": return "📅";
      default: return "🔔";
    }
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button className="bell-btn" onClick={() => setShowDropdown(!showDropdown)}>
        🔔
        {unreadCount > 0 && <span className="bell-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>
      {showDropdown && (
        <div className="bell-dropdown">
          <div className="bell-header">
            <strong>Thông báo</strong>
            <span>{notifications.length} thông báo</span>
          </div>
          <div className="bell-list">
            {notifications.length === 0 ? (
              <div className="bell-empty">Chưa có thông báo nào</div>
            ) : (
              notifications.slice(0, 15).map(n => (
                <div
                  key={n.id}
                  className={`bell-item ${!n.is_read ? "unread" : ""}`}
                  onClick={() => markRead(n)}
                >
                  <span className="bell-icon">{getIcon(n.type)}</span>
                  <div className="bell-content">
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                    <small>{formatDateTime(n.created_at)}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}