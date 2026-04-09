// src/components/VideoCard.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { awardWatchPoints, promoteVideo, POINTS } from '../services/pointsService';
import { getYouTubeEmbedUrl, extractYouTubeId } from '../services/videoService';
import styles from './VideoCard.module.css';

const WATCH_THRESHOLD_SECONDS = 30; // Must watch 30s to earn points

export default function VideoCard({ video, onPointsEarned, onRefreshPoints }) {
  const { currentUser, userProfile } = useAuth();
  const [playing, setPlaying] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const [earned, setEarned] = useState(false);
  const [earning, setEarning] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [promoted, setPromoted] = useState(false);
  const [error, setError] = useState('');
  const intervalRef = useRef(null);
  const iframeRef = useRef(null);
  const isOwn = currentUser?.uid === video.submittedBy;

  // Resolve the YouTube ID: prefer stored youtubeId, fall back to extracting from url
  const youtubeId = video.youtubeId || extractYouTubeId(video.url || '');

  const handlePlay = useCallback(() => {
    if (earned || !currentUser || isOwn) return;
    setPlaying(true);
    intervalRef.current = setInterval(() => {
      setWatchTime((t) => {
        const next = t + 1;
        if (next >= WATCH_THRESHOLD_SECONDS) {
          clearInterval(intervalRef.current);
          handleEarnPoints();
        }
        return next;
      });
    }, 1000);
  }, [earned, currentUser, isOwn]);

  const handleEarnPoints = useCallback(async () => {
    if (earned || earning || !currentUser) return;
    setEarning(true);
    try {
      await awardWatchPoints(currentUser.uid, video.id);
      setEarned(true);
      onPointsEarned?.(POINTS.WATCH_VIDEO);
      onRefreshPoints?.();
    } catch (e) {
      console.warn('Watch points error:', e);
    } finally {
      setEarning(false);
    }
  }, [earned, earning, currentUser, video.id]);

  const handlePromote = async () => {
    if (!currentUser || promoting) return;
    setError('');
    setPromoting(true);
    try {
      await promoteVideo(currentUser.uid, video.id, userProfile?.points || 0);
      setPromoted(true);
      onRefreshPoints?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setPromoting(false);
    }
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const progress = Math.min((watchTime / WATCH_THRESHOLD_SECONDS) * 100, 100);
  const isActivelyPromoted = video.promoted && video.promotedUntil?.toDate?.() > new Date();

  return (
    <div className={`${styles.card} ${isActivelyPromoted ? styles.promoted : ''}`}>
      {isActivelyPromoted && (
        <div className={styles.promotedBadge}>
          <span>⚡ Promoted</span>
        </div>
      )}

      <div className={styles.embedWrapper}>
        {!playing ? (
          <div className={styles.thumbnail} onClick={handlePlay}>
            <img src={video.thumbnail} alt={video.title} loading="lazy" />
            <div className={styles.playOverlay}>
              <div className={styles.playBtn}>▶</div>
              {!currentUser && (
                <div className={styles.loginPrompt}>Sign in to earn points</div>
              )}
              {isOwn && (
                <div className={styles.ownBadge}>Your video</div>
              )}
            </div>
          </div>
        ) : youtubeId ? (
          <div className={styles.iframeWrapper}>
            <iframe
              ref={iframeRef}
              src={`${getYouTubeEmbedUrl(youtubeId)}&autoplay=1`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className={styles.iframe}
            />
          </div>
        ) : (
          <div className={styles.thumbnail}>
            <p style={{ color: '#aaa', padding: '1rem', textAlign: 'center' }}>
              Video unavailable — invalid YouTube URL.
            </p>
          </div>
        )}
      </div>

      {/* Watch Progress Bar */}
      {playing && !earned && currentUser && !isOwn && (
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          <span className={styles.progressText}>
            {earning ? '◆ +10 pts!' : `Watch ${WATCH_THRESHOLD_SECONDS - watchTime}s more for +10pts`}
          </span>
        </div>
      )}

      {earned && (
        <div className={styles.earnedBadge}>◆ +{POINTS.WATCH_VIDEO} points earned!</div>
      )}

      <div className={styles.info}>
        <div className={styles.infoTop}>
          <div>
            <h3 className={styles.title}>{video.title}</h3>
            <p className={styles.meta}>
              by <span className={styles.creator}>{video.submitterNickname}</span>
              {video.views > 0 && <> · {video.views} view{video.views !== 1 ? 's' : ''}</>}
            </p>
          </div>
        </div>

        {video.description && (
          <p className={styles.description}>{video.description}</p>
        )}

        {/* Promote button — only for video owner */}
        {isOwn && currentUser && (
          <div className={styles.promoteSection}>
            {error && <p className={styles.error}>{error}</p>}
            <button
              className={styles.promoteBtn}
              onClick={handlePromote}
              disabled={promoting || promoted}
            >
              {promoted ? '✓ Promoted!' : promoting ? 'Promoting…' : `⚡ Promote (${POINTS.PROMOTE_COST} pts)`}
            </button>
            <p className={styles.promoteHint}>Moves your video to the top for 24 hours</p>
          </div>
        )}
      </div>
    </div>
  );
}
