import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getYouTubeEmbedUrl } from '../services/videoService';
import styles from '../pages/PublicFeedPage.module.css';

export default function VideoCard({ video, onWatch }) {
  const { currentUser } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);

    // Only trigger points if logged in
    if (currentUser && onWatch) {
      onWatch(video.id);
    }
  };

  return (
    <div className={styles.videoCard}>
      <div className={styles.thumbnailContainer}>
        {isPlaying ? (
          <iframe
            src={getYouTubeEmbedUrl(video.youtubeId) + "&autoplay=1"}
            title={video.title}
            className={styles.videoFrame}
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        ) : (
          <>
            <img src={video.thumbnail} alt={video.title} />

            <button className={styles.playButton} onClick={handlePlay}>
              ▶
            </button>

            {!currentUser && (
              <div className={styles.guestOverlay}>
                Login to earn points
              </div>
            )}
          </>
        )}
      </div>

      <h3>{video.title}</h3>
      <p>By {video.submitterNickname}</p>
    </div>
  );
}
