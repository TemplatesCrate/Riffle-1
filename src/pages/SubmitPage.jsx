import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { submitVideo, extractYouTubeId, getYouTubeThumbnail } from '../services/videoService';
import PointsPopup from '../components/PointsPopup';
import styles from './SubmitPage.module.css';

const SubmitPage = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState(null);
  const [pointsPopup, setPointsPopup] = useState(null);

  const handleUrlChange = (e) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setError('');

    if (newUrl) {
      const videoId = extractYouTubeId(newUrl);
      if (videoId) {
        setPreview({
          thumbnail: getYouTubeThumbnail(videoId),
          videoId,
        });
      } else {
        setPreview(null);
      }
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentUser) {
      setError('Please login first');
      return;
    }

    try {
      setLoading(true);
      await submitVideo(
        currentUser.uid,
        userData?.nickname || 'Anonymous',
        url,
        title,
        description
      );

      setPointsPopup({ points: 5, type: 'earn' });
      setSuccess(true);
      setUrl('');
      setTitle('');
      setDescription('');
      setPreview(null);

      setTimeout(() => {
        navigate('/feed');
      }, 2000);
    } catch (e) {
      setError(e.message || 'Failed to submit video');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p>Please login to submit videos</p>
          <button onClick={() => navigate('/auth')} className={styles.btn}>
            Go to Login
          </button>
        </div>
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

      <div className={styles.card}>
        <h1>Submit a Video</h1>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>Video submitted! Redirecting...</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="url">YouTube URL</label>
            <input
              id="url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={handleUrlChange}
              required
              className={styles.input}
            />
            {preview && (
              <div className={styles.preview}>
                <img src={preview.thumbnail} alt="Preview" />
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              placeholder="Video title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              placeholder="Describe your video..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="5"
              className={styles.textarea}
            />
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Submitting...' : '🚀 Submit Video'}
          </button>
        </form>

        <p className={styles.info}>
          ⭐ You'll earn 5 points for each video submitted!
        </p>
      </div>
    </div>
  );
};

export default SubmitPage;
