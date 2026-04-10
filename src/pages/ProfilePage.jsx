import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { fetchUserVideos } from '../services/videoService';
import styles from './ProfilePage.module.css';

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [userVideos, setUserVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          setError('User profile not found');
        }

        const videos = await fetchUserVideos(currentUser.uid);
        setUserVideos(videos);
      } catch (e) {
        console.error('Failed to fetch user data:', e);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>No profile data available</div>
      </div>
    );
  }

  const watchHours = (userData.totalWatchTime || 0) / 60;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>My Profile</h1>
      </div>

      <div className={styles.infoCard}>
        <div className={styles.profileSection}>
          <div className={styles.avatarContainer}>
            <div className={styles.avatar}>
              {userData.nickname?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
          <div className={styles.userInfo}>
            <h2>{userData.nickname || 'Anonymous'}</h2>
            <p className={styles.email}>{currentUser.email}</p>
          </div>
        </div>

        <div className={styles.pointsDisplay}>
          <div className={styles.pointsValue}>{userData.points || 0}</div>
          <div className={styles.pointsLabel}>Total Points</div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{userData.videosSubmitted || 0}</div>
          <div className={styles.statLabel}>Videos Submitted</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statValue}>{userData.totalWatchTime || 0}</div>
          <div className={styles.statLabel}>Watch Time (min)</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statValue}>{watchHours.toFixed(1)}</div>
          <div className={styles.statLabel}>Watch Time (hrs)</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statValue}>{userVideos.length}</div>
          <div className={styles.statLabel}>Total Videos</div>
        </div>
      </div>

      <div className={styles.videosSection}>
        <h3>My Videos ({userVideos.length})</h3>

        {userVideos.length === 0 ? (
          <div className={styles.emptyVideos}>
            <p>You haven't submitted any videos yet</p>
            <button
              className={styles.submitBtn}
              onClick={() => navigate('/submit')}
            >
              Submit Your First Video
            </button>
          </div>
        ) : (
          <div className={styles.videosList}>
            {userVideos.map((video) => (
              <div key={video.id} className={styles.videoItem}>
                <img src={video.thumbnail} alt={video.title} />
                <div className={styles.videoInfo}>
                  <h4>{video.title}</h4>
                  <p className={styles.videoDesc}>{video.description}</p>
                  <div className={styles.videoStats}>
                    <span>👁 {video.views || 0} views</span>
                    <span>❤ {video.likes || 0} likes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
