import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import NotificationBadge from './NotificationBadge';
import { auth } from '../firebase';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/auth');
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.logo} onClick={() => navigate('/')}>
          🎥 Riffle
        </div>

        {currentUser ? (
          <div className={styles.navLinks}>
            <button className={styles.navLink} onClick={() => navigate('/feed')}>
              Feed
            </button>
            <button className={styles.navLink} onClick={() => navigate('/submit')}>
              Submit
            </button>

            <div className={styles.pointsDisplay}>
              ⭐ {userData?.points || 0} pts
            </div>

            <div className={styles.notificationContainer}>
              <button
                className={styles.bellBtn}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                🔔
                <NotificationBadge />
              </button>
              <NotificationDropdown
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
              />
            </div>

            <button className={styles.navLink} onClick={() => navigate('/profile')}>
              👤 {userData?.nickname || 'Profile'}
            </button>

            <button className={styles.logoutBtn} onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <button className={styles.loginBtn} onClick={() => navigate('/auth')}>
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
