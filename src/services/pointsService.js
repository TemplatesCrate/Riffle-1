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
import { createNotification } from './notificationService';

export const POINTS = {
  WATCH_VIDEO: 10,
  SUBMIT_VIDEO: 5,
  INVITE_BONUS: 100,
  SIGNUP_BONUS: 50,
  PROMOTE_COST: 30,
};

export async function awardWatchPoints(userId, videoId) {
  const userRef = doc(db, 'users', userId);
  const videoRef = doc(db, 'videos', videoId);

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);
    const videoSnap = await tx.get(videoRef);

    if (!userSnap.exists() || !videoSnap.exists()) return;

    const watchKey = `${userId}_${videoId}`;
    const watchRef = doc(db, 'watchEvents', watchKey);
    const watchSnap = await tx.get(watchRef);

    if (watchSnap.exists()) return;

    tx.update(userRef, {
      points: increment(POINTS.WATCH_VIDEO),
      totalWatchTime: increment(1),
    });

    tx.update(videoRef, {
      views: increment(1),
    });

    tx.set(watchRef, {
      userId,
      videoId,
      pointsEarned: POINTS.WATCH_VIDEO,
      watchedAt: serverTimestamp(),
    });
  });

  await createNotification(
    userId,
    'points_earned',
    `You earned ${POINTS.WATCH_VIDEO} points for watching a video!`,
    { pointsAmount: POINTS.WATCH_VIDEO, type: 'watch' }
  );

  return POINTS.WATCH_VIDEO;
}

export async function likeVideo(userId, videoId) {
  const likeKey = `${userId}_${videoId}`;
  const likeRef = doc(db, 'likeEvents', likeKey);
  const videoRef = doc(db, 'videos', videoId);

  let alreadyLiked = false;

  await runTransaction(db, async (tx) => {
    const likeSnap = await tx.get(likeRef);

    if (likeSnap.exists()) {
      alreadyLiked = true;
      return;
    }

    tx.set(likeRef, {
      userId,
      videoId,
      likedAt: serverTimestamp(),
    });

    tx.update(videoRef, {
      likes: increment(1),
    });
  });

  if (alreadyLiked) throw new Error('already_liked');
}

export async function hasUserLiked(userId, videoId) {
  const { getDoc } = await import('firebase/firestore');
  const likeKey = `${userId}_${videoId}`;
  const likeRef = doc(db, 'likeEvents', likeKey);
  const snap = await getDoc(likeRef);
  return snap.exists();
}

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

    tx.update(userRef, { points: increment(-POINTS.PROMOTE_COST) });

    const boostUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    tx.update(videoRef, {
      promoted: true,
      promotedUntil: boostUntil,
      promotionScore: increment(1),
      lastPromotedAt: serverTimestamp(),
    });
  });

  await addDoc(collection(db, 'promotionEvents'), {
    userId,
    videoId,
    pointsSpent: POINTS.PROMOTE_COST,
    promotedAt: serverTimestamp(),
  });
}

export async function awardSubmitPoints(userId) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    points: increment(POINTS.SUBMIT_VIDEO),
    videosSubmitted: increment(1),
  });

  await createNotification(
    userId,
    'points_earned',
    `You earned ${POINTS.SUBMIT_VIDEO} points for submitting a video!`,
    { pointsAmount: POINTS.SUBMIT_VIDEO, type: 'submit' }
  );
}
