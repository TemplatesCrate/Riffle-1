import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchFeed } from '../services/videoService';
import { awardWatchPoints, likeVideo } from '../services/pointsService';
import { trackAdImpression } from '../services/adService';
import PointsPopup from '../components/PointsPopup';
import styles from './FeedPage.module.css';

const FeedPage = () => {
  const { currentUser, userData } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pointsPopup, setPointsPopup] = useState(null);
  const [likedVideos, setLikedVideos] = useState(new Set());
  const [watchedVideos, setWatchedVideos] = useState(new Set());

  useEffect(() => {
    const loadFeed = async () => {
      try {
        setLoading(true);
        const feedVideos = await fetchFeed(50);
        setVideos(feedVideos);
        await trackAdImpression('feed_banner_top', currentUser?.uid || 'anonymous');
      } catch (e) {
        console.error('Failed to load feed:', e);
        setError('Failed to load videos');
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, [currentUser]);

  const handleWatchVideo = async (videoId) => {
    if (!currentUser || watchedVideos.has(videoId)) return;

    try {
      await awardWatchPoints(currentUser.uid, videoId);
      setWatchedVideos((prev) => new Set([...prev, videoId]));
      setPointsPopup({ points: 10, type: 'earn' });
    } catch (e) {
      console.error('Failed to award points:', e);
    }
  };

  const handleLikeVideo = async (videoId) => {
    if (!currentUser) {
      setError('Please login to like videos');
      return;
    }

    if (likedVideos.has(videoId)) return;

    try {
      await likeVideo(currentUser.uid, videoId);
      setLikedVideos((prev) => new Set([...prev, videoId]));
      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId ? { ...v, likes: (v.likes || 0) + 1 } : v
        )
      );
    } catch (e) {
      if (e.message !== 'already_liked') {
        console.error('Failed to like video:', e);
        setError('Failed to like video');
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading feed...</div>
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

  if (videos.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>No videos yet</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {pointsPopup && (
        <PointsPopup
          points={pointsPopup.points}
          type={pointsPopup.type}
        />
      )}

      <div className={styles.videoGrid}>
        {videos.map((video) => (
          <div key={video.id} className={styles.videoCard}>
            <div
              className={styles.thumbnailContainer}
              onClick={() => handleWatchVideo(video.id)}
            >
              <img src={video.thumbnail} alt={video.title} />
              <div className={styles.playButton}>▶</div>
              {video.promoted && (
                <div className={styles.promotedBadge}>
                  ⭐ Promoted
                </div>
              )}
            </div>

            <div className={styles.videoInfo}>
              <h3>{video.title}</h3>
              <p className={styles.description}>{video.description}</p>
              <div className={styles.statsContainer}>
                <span>👁 {video.views || 0}</span>
                <span>❤ {video.likes || 0}</span>
              </div>
              <div className={styles.actions}>
                <button
                  className={styles.likeBtn}
                  onClick={() => handleLikeVideo(video.id)}
                  disabled={likedVideos.has(video.id)}
                >
                  {likedVideos.has(video.id) ? '❤' : '🤍'} Like
                </button>
              </div>
              <p className={styles.submitter}>
                by {video.submitterNickname}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeedPage;
