// src/services/pointsService.js
// Handles all point transactions with Firestore
import {
  doc,
  updateDoc,
  increment,
  addDoc,
  collection,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase';

export const POINTS = {
  WATCH_VIDEO: 10,       // Points earned for watching 30+ seconds
  SUBMIT_VIDEO: 5,       // Points earned for submitting a video
  INVITE_BONUS: 100,     // Points earned when someone joins via invite
  SIGNUP_BONUS: 50,      // Points given on signup
  PROMOTE_COST: 30,      // Points spent to promote a video
};

// Award points for watching a video
export async function awardWatchPoints(userId, videoId) {
  const userRef = doc(db, 'users', userId);
  const videoRef = doc(db, 'videos', videoId);

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);
    const videoSnap = await tx.get(videoRef);

    if (!userSnap.exists() || !videoSnap.exists()) return;

    // Check if this user already watched this video (prevent double-earn)
    const watchKey = `${userId}_${videoId}`;
    const watchRef = doc(db, 'watchEvents', watchKey);
    const watchSnap = await tx.get(watchRef);

    if (watchSnap.exists()) return; // Already earned for this video

    // Award points
    tx.update(userRef, {
      points: increment(POINTS.WATCH_VIDEO),
      totalWatchTime: increment(1),
    });

    // Increment video view count
    tx.update(videoRef, {
      views: increment(1),
    });

    // Record watch event
    tx.set(watchRef, {
      userId,
      videoId,
      pointsEarned: POINTS.WATCH_VIDEO,
      watchedAt: serverTimestamp(),
    });
  });

  return POINTS.WATCH_VIDEO;
}

// Like a video — one like per user per video, enforced via Firestore transaction
export async function likeVideo(userId, videoId) {
  const likeKey = `${userId}_${videoId}`;
  const likeRef = doc(db, 'likeEvents', likeKey);
  const videoRef = doc(db, 'videos', videoId);

  let alreadyLiked = false;

  await runTransaction(db, async (tx) => {
    const likeSnap = await tx.get(likeRef);

    if (likeSnap.exists()) {
      alreadyLiked = true;
      return; // Already liked — do nothing
    }

    // Record the like (keyed doc prevents any duplicate)
    tx.set(likeRef, {
      userId,
      videoId,
      likedAt: serverTimestamp(),
    });

    // Increment likes count on the video
    tx.update(videoRef, {
      likes: increment(1),
    });
  });

  if (alreadyLiked) throw new Error('already_liked');
}

// Check if a user has already liked a specific video
export async function hasUserLiked(userId, videoId) {
  const { getDoc } = await import('firebase/firestore');
  const likeKey = `${userId}_${videoId}`;
  const likeRef = doc(db, 'likeEvents', likeKey);
  const snap = await getDoc(likeRef);
  return snap.exists();
}

// Spend points to promote a video
export async function promoteVideo(userId, videoId, currentUserPoints) {
  if (currentUserPoints < POINTS.PROMOTE_COST) {
    throw new Error(`Not enough points. Need ${POINTS.PROMOTE_COST}, have ${currentUserPoints}.`);
  }

  const userRef = doc(db, 'users', userId);
  const videoRef = doc(db, 'videos', videoId);

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists()) throw new Error('User not found');

    const pts = userSnap.data().points;
    if (pts < POINTS.PROMOTE_COST) throw new Error('Insufficient points');

    // Deduct points
    tx.update(userRef, { points: increment(-POINTS.PROMOTE_COST) });

    // Boost the video's promotionScore (higher = shown earlier in feed)
    // Each promotion adds a boost that decays over time via promotedUntil
    const boostUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h boost
    tx.update(videoRef, {
      promoted: true,
      promotedUntil: boostUntil,
      promotionScore: increment(1),
      lastPromotedAt: serverTimestamp(),
    });
  });

  // Log promotion event
  await addDoc(collection(db, 'promotionEvents'), {
    userId,
    videoId,
    pointsSpent: POINTS.PROMOTE_COST,
    promotedAt: serverTimestamp(),
    // FUTURE: Used for leaderboard promotion-based ranking
  });
}

// Award points for submitting a video
export async function awardSubmitPoints(userId) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    points: increment(POINTS.SUBMIT_VIDEO),
    videosSubmitted: increment(1),
  });
}
