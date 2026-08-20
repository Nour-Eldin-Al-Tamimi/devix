import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  onAuthStateChanged,
  syncUserProfile,
  listenToUserProfile,
  firebaseSignOut,
  User,
} from '../lib/firebase';
import { UserProfile, AuthModalMode } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isPro: boolean;
  loading: boolean;
  authModalOpen: boolean;
  authModalMode: AuthModalMode;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
  setAuthModalMode: (mode: AuthModalMode) => void;
  activateProLocally: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('signin');
  const [localPro, setLocalPro] = useState<boolean>(() => {
    try {
      return localStorage.getItem('devix_is_pro_v1') === 'true';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (currentUser) {
        try {
          // Ensure document exists in Firestore
          await syncUserProfile(currentUser);

          // Real-time listener for profile changes (such as Pro activation)
          unsubscribeSnapshot = listenToUserProfile(currentUser.uid, (profile) => {
            setUserProfile(profile);
            setLoading(false);
          });
        } catch (error) {
          console.warn('Error syncing user profile:', error);
          setUserProfile(null);
          setLoading(false);
        }
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  const openAuthModal = (mode: AuthModalMode = 'signin') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const activateProLocally = () => {
    setLocalPro(true);
    try {
      localStorage.setItem('devix_is_pro_v1', 'true');
    } catch (e) {
      console.warn('Could not save Pro status to localStorage:', e);
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUserProfile(null);
  };

  // isPro is active if either Firestore profile says so, or local storage contains verified purchase
  const isPro = Boolean(userProfile?.isPro || localPro);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isPro,
        loading,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode,
        activateProLocally,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
