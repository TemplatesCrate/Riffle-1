import React, { useEffect } from 'react';
import styles from './AdBanner.module.css';
import { trackAdImpression } from '../services/adService';
import { useAuth } from '../contexts/AuthContext';

export default function AdBanner({ slotId = "feed_top" }) {
  const { currentUser } = useAuth();

  useEffect(() => {
    trackAdImpression(slotId, currentUser?.uid || "anonymous");
  }, []);

  return (
    <div className={styles.adContainer}>
      <div className={styles.adContent}>
        <p className={styles.adLabel}>Sponsored</p>

        <div className={styles.adBox}>
          <h3>🚀 Boost Your Videos</h3>
          <p>Promote your content & get more views instantly.</p>
          <button className={styles.adButton}>
            Promote Now
          </button>
        </div>
      </div>
    </div>
  );
}
