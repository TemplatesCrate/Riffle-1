// src/services/videoService.js
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  serverTimestamp,
  limit,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { awardSubmitPoints } from './pointsService';

// Extract YouTube video ID from various URL formats
export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;

  try {
    const parsed = new URL(url.trim());

    // youtu.be/VIDEO_ID
    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.slice(1).split('/')[0];
      return id || null;
    }

    // youtube.com/shorts/VIDEO_ID
    if (parsed.pathname.startsWith('/shorts/')) {
      const id = parsed.pathname.split('/shorts/')[1]?.split('/')[0];
      return id || null;
    }

    // youtube.com/embed/VIDEO_ID
    if (parsed.pathname.startsWith('/embed/')) {
      const id = parsed.pathname.split('/embed/')[1]?.split('/')[0];
      return id || null;
    }

    // youtube.com/watch?v=VIDEO_ID  (v= can appear anywhere in the query string)
    if (parsed.hostname.includes('youtube.com') && parsed.searchParams.has('v')) {
      return parsed.searchParams.get('v') || null;
    }
  } catch {
    // URL constructor failed — fall back to regex for malformed URLs
    const match = url.match(/(?:v=|youtu\.be\/|\/shorts\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  return null;
}

export function getYouTubeThumbnail(videoId) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function getYouTubeEmbedUrl(videoId) {
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1`;
}

// Submit a new video
export async function submitVideo(userId, userNickname, url, title, description) {
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error('Invalid YouTube URL. Please paste a valid YouTube link.');

  const videoData = {
    submittedBy: userId,
    submitterNickname: userNickname,
    url,
    youtubeId: videoId,
    title: title || 'Untitled Video',
    description: description || '',
    thumbnail: getYouTubeThumbnail(videoId),
    views: 0,
    promoted: false,
    promotedUntil: null,
    promotionScore: 0,
    lastPromotedAt: null,
    submittedAt: serverTimestamp(),
    // FUTURE: leaderboardEligible, categoryTags, creatorTier
  };

  const docRef = await addDoc(collection(db, 'videos'), videoData);
  await awardSubmitPoints(userId);
  return { id: docRef.id, ...videoData };
}

// Fetch video feed - promoted videos first, then by recency
export async function fetchFeed(limitCount = 50) {
  const now = new Date();

  // Fetch all recent videos
  const q = query(
    collection(db, 'videos'),
    orderBy('submittedAt', 'desc'),
    limit(limitCount)
  );

  const snap = await getDocs(q);
  const videos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Sort: active promotions first (by promotionScore), then recency
  return videos.sort((a, b) => {
    const aPromoted = a.promoted && a.promotedUntil?.toDate?.() > now;
    const bPromoted = b.promoted && b.promotedUntil?.toDate?.() > now;
    if (aPromoted && !bPromoted) return -1;
    if (!aPromoted && bPromoted) return 1;
    if (aPromoted && bPromoted) return (b.promotionScore || 0) - (a.promotionScore || 0);
    return 0; // Keep submission order for unpromoted
  });
}

// Fetch videos submitted by a specific user
export async function fetchUserVideos(userId) {
  const q = query(
    collection(db, 'videos'),
    where('submittedBy', '==', userId),
    orderBy('submittedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
