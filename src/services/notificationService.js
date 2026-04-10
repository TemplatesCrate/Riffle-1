import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

export async function createNotification(userId, type, message, metadata = {}) {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      type,
      message,
      metadata,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.error('Failed to create notification:', e);
  }
}

export async function markAsRead(notificationId) {
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, { read: true });
  } catch (e) {
    console.error('Failed to mark notification as read:', e);
  }
}

export async function markAllAsRead(userId) {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snap = await getDocs(q);
    for (const docSnap of snap.docs) {
      await updateDoc(docSnap.ref, { read: true });
    }
  } catch (e) {
    console.error('Failed to mark all as read:', e);
  }
}

export async function getUnreadNotifications(userId, limitCount = 20) {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('Failed to get unread notifications:', e);
    return [];
  }
}

export async function getUserNotifications(userId, limitCount = 50) {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('Failed to get notifications:', e);
    return [];
  }
}

export async function deleteNotification(notificationId) {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (e) {
    console.error('Failed to delete notification:', e);
  }
}

export async function getUnreadCount(userId) {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snap = await getDocs(q);
    return snap.size;
  } catch (e) {
    console.error('Failed to get unread count:', e);
    return 0;
  }
}
