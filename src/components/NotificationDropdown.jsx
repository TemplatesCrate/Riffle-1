import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../services/notificationService';
import styles from './NotificationDropdown.module.css';

const NotificationDropdown = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !currentUser) return;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const notifs = await getUserNotifications(currentUser.uid, 20);
        setNotifications(notifs);
      } catch (e) {
        console.error('Failed to fetch notifications:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isOpen, currentUser]);

  const handleMarkAsRead = async (notifId) => {
    try {
      await markAsRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.error('Failed to mark as read:', e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(currentUser.uid);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error('Failed to mark all as read:', e);
    }
  };

  const handleDelete = async (notifId) => {
    try {
      await deleteNotification(notifId);
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    } catch (e) {
      console.error('Failed to delete notification:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.dropdown}>
      <div className={styles.header}>
        <h3>Notifications</h3>
        {notifications.some((n) => !n.read) && (
          <button className={styles.markAllBtn} onClick={handleMarkAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : notifications.length === 0 ? (
          <div className={styles.empty}>No notifications yet</div>
        ) : (
          <ul className={styles.list}>
            {notifications.map((notif) => (
              <li
                key={notif.id}
                className={`${styles.item} ${notif.read ? styles.read : styles.unread}`}
              >
                <div className={styles.itemContent}>
                  <p className={styles.message}>{notif.message}</p>
                  <span className={styles.time}>
                    {notif.createdAt
                      ? new Date(notif.createdAt.toDate()).toLocaleString()
                      : 'just now'}
                  </span>
                </div>
                <div className={styles.actions}>
                  {!notif.read && (
                    <button
                      className={styles.readBtn}
                      onClick={() => handleMarkAsRead(notif.id)}
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(notif.id)}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
