import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, ProjectBlueprint } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore (support named database if present in config)
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

/**
 * Initializes or fetches a user's Firestore profile document upon login/register.
 */
export async function syncUserProfile(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data() as UserProfile;
    return data;
  }

  const newProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    createdAt: new Date().toISOString(),
    plan: 'free',
    isPro: false,
    paypalOrderId: null,
    paypalTransactionId: null,
    proActivatedAt: null,
  };

  await setDoc(userRef, newProfile);
  return newProfile;
}

/**
 * Real-time listener for user profile updates.
 */
export function listenToUserProfile(
  uid: string,
  onUpdate: (profile: UserProfile | null) => void,
  onError?: (error: Error) => void
) {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(
    userRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as UserProfile);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('Firestore user profile snapshot error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save a blueprint to the user's savedProjects subcollection in Firestore.
 */
export async function saveProjectToCloud(uid: string, blueprint: ProjectBlueprint): Promise<void> {
  const projectRef = doc(db, 'users', uid, 'savedProjects', blueprint.id);
  await setDoc(projectRef, blueprint);
}

/**
 * Remove a blueprint from the user's savedProjects subcollection in Firestore.
 */
export async function removeProjectFromCloud(uid: string, projectId: string): Promise<void> {
  const projectRef = doc(db, 'users', uid, 'savedProjects', projectId);
  await deleteDoc(projectRef);
}

/**
 * Real-time listener for user's saved projects in Firestore.
 */
export function listenToSavedProjects(
  uid: string,
  onUpdate: (projects: ProjectBlueprint[]) => void
) {
  const projectsCol = collection(db, 'users', uid, 'savedProjects');
  return onSnapshot(
    projectsCol,
    (snapshot) => {
      const items: ProjectBlueprint[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as ProjectBlueprint);
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(items);
    },
    (err) => {
      console.warn('Firestore saved projects snapshot error:', err);
    }
  );
}

// Re-export common Auth operations for clean consumption
export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
};
export type { User };
