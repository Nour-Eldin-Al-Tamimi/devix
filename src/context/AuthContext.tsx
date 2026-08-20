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
  isBeta: boolean;
  betaGenerationsRemaining: number;
  loading: boolean;
  authModalOpen: boolean;
  authModalMode: AuthModalMode;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
  setAuthModalMode: (mode: AuthModalMode) => void;
  activateProLocally: () => void;
  activateBetaLocally: (generations?: number) => void;
  decrementBetaLocally: () => void;
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
  const [localBetaGenerations, setLocalBetaGenerations] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('devix_beta_generations_v1');
      return stored ? Math.max(0, parseInt(stored, 10) || 0) : 0;
    } catch (e) {
      return 0;
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

          // Real-time listener for profile changes (such as Pro activation or Beta codes)
          unsubscribeSnapshot = listenToUserProfile(currentUser.uid, (profile) => {
            setUserProfile(profile);
            if (profile?.betaGenerationsRemaining !== undefined) {
              setLocalBetaGenerations(profile.betaGenerationsRemaining);
              try {
                localStorage.setItem('devix_beta_generations_v1', String(profile.betaGenerationsRemaining));
              } catch (e) {
                // ignore
              }
            }
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

  const activateBetaLocally = (generations: number = 100) => {
    setLocalBetaGenerations(generations);
    try {
      localStorage.setItem('devix_beta_generations_v1', String(generations));
    } catch (e) {
      console.warn('Could not save Beta generations to localStorage:', e);
    }
  };

  const decrementBetaLocally = () => {
    setLocalBetaGenerations((prev) => {
      const next = Math.max(0, prev - 1);
      try {
        localStorage.setItem('devix_beta_generations_v1', String(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUserProfile(null);
  };

  // isPro is active if either Firestore profile says so, or local storage contains verified purchase
  const isPro = Boolean(userProfile?.isPro || localPro);

  // Beta status & remaining quota
  const betaGenerationsRemaining = userProfile?.betaGenerationsRemaining !== undefined
    ? userProfile.betaGenerationsRemaining
    : localBetaGenerations;

  const isBeta = Boolean(userProfile?.isBeta || betaGenerationsRemaining > 0);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isPro,
        isBeta,
        betaGenerationsRemaining,
        loading,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode,
        activateProLocally,
        activateBetaLocally,
        decrementBetaLocally,
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
