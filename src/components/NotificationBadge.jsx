import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUnreadCount } from '../services/notificationService';
import styles from './NotificationBadge.module.css';

const NotificationBadge = () => {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadCount(currentUser.uid);
        setUnreadCount(count);
      } catch (e) {
        console.error('Failed to fetch unread count:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  if (loading || unreadCount === 0) return null;

  return (
    <div className={styles.badge}>
      {unreadCount > 99 ? '99+' : unreadCount}
    </div>
  );
};

export default NotificationBadge;
