import React, { useState, useEffect } from 'react';
import styles from './PointsPopup.module.css';

const PointsPopup = ({ points, type = 'earn', duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!isVisible) return null;

  const icon = type === 'earn' ? '+' : '-';
  const label = type === 'earn' ? 'Points Earned!' : 'Points Spent';

  return (
    <div className={`${styles.popup} ${styles[type]}`}>
      <div className={styles.content}>
        <span className={styles.icon}>{icon}</span>
        <div>
          <p className={styles.label}>{label}</p>
          <p className={styles.points}>{points} points</p>
        </div>
      </div>
    </div>
  );
};

export default PointsPopup;
