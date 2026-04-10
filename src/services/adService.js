import { addDoc, collection, serverTimestamp, increment, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const AD_SLOTS = {
  FEED_BANNER_TOP: 'feed_banner_top',
  FEED_INLINE: 'feed_inline',
  SIDEBAR: 'sidebar',
};

export async function trackAdImpression(slotId, userId = 'anonymous') {
  try {
    await addDoc(collection(db, 'adImpressions'), {
      slotId,
      userId,
      timestamp: serverTimestamp(),
    });

    const today = new Date().toISOString().split('T')[0];
    const statsRef = doc(db, 'adStats', `${today}_${slotId}`);
    await setDoc(statsRef, {
      date: today,
      slotId,
      impressions: increment(1),
    }, { merge: true });
  } catch (e) {
    console.warn('Ad impression tracking failed:', e);
  }
}
