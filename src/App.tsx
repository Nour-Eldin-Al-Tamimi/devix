import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HeroGenerator } from './components/HeroGenerator';
import { ProjectBlueprintView } from './components/ProjectBlueprintView';
import { AddSkillModal } from './components/AddSkillModal';
import { HowItWorksModal } from './components/HowItWorksModal';
import { PricingModal } from './components/PricingModal';
import { SavedProjectsDrawer } from './components/SavedProjectsDrawer';
import { InfoLegalModal } from './components/InfoLegalModal';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { ProjectBlueprint, ProjectGeneratorInput } from './types';
import {
  saveProjectToCloud,
  removeProjectFromCloud,
  listenToSavedProjects,
} from './lib/firebase';

const STORAGE_KEY_SAVED = 'devix_saved_blueprints_v1';
const STORAGE_KEY_USAGE = 'devix_usage_count_v1';

function AppContent() {
  const { user, isPro, openAuthModal } = useAuth();
  const [skills, setSkills] = useState<string[]>(['Python', 'React', 'SQL']);
  const [currentBlueprint, setCurrentBlueprint] = useState<ProjectBlueprint | null>(null);
  const [savedProjects, setSavedProjects] = useState<ProjectBlueprint[]>([]);
  const [usageCount, setUsageCount] = useState<number>(3);
  const maxUsage = isPro ? 999 : 5;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');

  // Modals state
  const [isSkillModalOpen, setIsSkillModalOpen] = useState<boolean>(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState<boolean>(false);
  const [isPricingOpen, setIsPricingOpen] = useState<boolean>(false);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState<boolean>(false);
  const [infoModalType, setInfoModalType] = useState<'privacy' | 'terms' | 'support' | null>(null);

  // Sync saved projects: from Firestore if logged in, otherwise from localStorage
  useEffect(() => {
    if (user) {
      // Real-time Firestore sync for authenticated user
      const unsubscribe = listenToSavedProjects(user.uid, (cloudProjects) => {
        setSavedProjects(cloudProjects);
      });
      return () => unsubscribe();
    } else {
      // Local storage fallback for guest/unauthenticated users
      try {
        const savedRaw = localStorage.getItem(STORAGE_KEY_SAVED);
        if (savedRaw) {
          setSavedProjects(JSON.parse(savedRaw));
        }
      } catch (e) {
        console.warn('Could not load local storage data:', e);
      }
    }
  }, [user]);

  // Load temporary guest usage counter on mount
  useEffect(() => {
    try {
      const usageRaw = localStorage.getItem(STORAGE_KEY_USAGE);
      if (usageRaw) {
        setUsageCount(Number(usageRaw));
      }
    } catch (e) {
      console.warn('Could not load usage data:', e);
    }
  }, []);

  // Skill management
  const handleAddSkill = (skill: string) => {
    if (!skills.includes(skill)) {
      setSkills((prev) => [...prev, skill]);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  // Project generation handler
  const handleGenerate = async (input: ProjectGeneratorInput) => {
    if (!isPro && usageCount >= maxUsage) {
      setIsPricingOpen(true);
      return;
    }

    setIsLoading(true);
    setLoadingStep('Analyzing skills & architecture...');

    const stepTimer1 = setTimeout(() => {
      setLoadingStep('Synthesizing SQL schema & API contracts...');
    }, 900);

    const stepTimer2 = setTimeout(() => {
      setLoadingStep('Drafting Google XYZ resume bullets...');
    }, 1800);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user) {
        try {
          const idToken = await user.getIdToken();
          headers['Authorization'] = `Bearer ${idToken}`;
        } catch (e) {
          // Token fetch note
        }
      }

      const response = await fetch('/api/generate-project', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...input,
          userId: user?.uid,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          const rateData = await response.json().catch(() => ({}));
          const retryMsg = rateData.retryAfter ? ` Please wait ${rateData.retryAfter} seconds.` : '';
          throw new Error(rateData.error || `Generation rate limit reached.${retryMsg}`);
        }
        throw new Error(`Server returned status ${response.status}`);
      }

      const blueprint: ProjectBlueprint = await response.json();
      setCurrentBlueprint(blueprint);

      // Increment usage count if not Pro
      if (!isPro) {
        const nextUsage = Math.min(usageCount + 1, maxUsage);
        setUsageCount(nextUsage);
        try {
          localStorage.setItem(STORAGE_KEY_USAGE, String(nextUsage));
        } catch (e) {
          // ignore
        }
      }

      // Trigger celebratory confetti
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#9A6F52', '#7A5338', '#EAE1DC', '#F0DCD0'],
      });

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error('Error generating project blueprint:', error);
      alert(error?.message || 'Error generating project blueprint. Please try again.');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleSaveToggle = async (blueprint: ProjectBlueprint) => {
    const exists = savedProjects.some((p) => p.id === blueprint.id);
    if (exists) {
      if (user) {
        await removeProjectFromCloud(user.uid, blueprint.id);
      } else {
        const updated = savedProjects.filter((p) => p.id !== blueprint.id);
        setSavedProjects(updated);
        try {
          localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(updated));
        } catch (e) {
          console.warn('Could not save to localStorage:', e);
        }
      }
    } else {
      if (user) {
        await saveProjectToCloud(user.uid, blueprint);
      } else {
        const updated = [blueprint, ...savedProjects];
        setSavedProjects(updated);
        try {
          localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(updated));
        } catch (e) {
          console.warn('Could not save to localStorage:', e);
        }
      }
      confetti({
        particleCount: 40,
        spread: 40,
        origin: { y: 0.5 },
        colors: ['#9A6F52', '#7A5338'],
      });
    }
  };

  const handleDeleteSaved = async (projectId: string) => {
    if (user) {
      await removeProjectFromCloud(user.uid, projectId);
    } else {
      const updated = savedProjects.filter((p) => p.id !== projectId);
      setSavedProjects(updated);
      try {
        localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save to localStorage:', e);
      }
    }
  };

  const handleUpgradeToPro = () => {
    // Pro state is driven by verified Firestore user profile
  };

  const isCurrentSaved = currentBlueprint
    ? savedProjects.some((p) => p.id === currentBlueprint.id)
    : false;

  const usageRemaining = Math.max(0, maxUsage - usageCount);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F5] text-[#1F1B18] selection:bg-[#F0DCD0] selection:text-[#7A5338]">
      {/* Top Navigation */}
      <Navbar
        usageCount={usageCount}
        maxUsage={maxUsage}
        savedCount={savedProjects.length}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        onOpenPricing={() => setIsPricingOpen(true)}
        onOpenSaved={() => setIsSavedDrawerOpen(true)}
        onResetToHome={() => setCurrentBlueprint(null)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {currentBlueprint ? (
          <ProjectBlueprintView
            blueprint={currentBlueprint}
            onBack={() => setCurrentBlueprint(null)}
            onSave={handleSaveToggle}
            isSaved={isCurrentSaved}
            onRegenerate={() => {
              if (currentBlueprint) {
                handleGenerate({
                  level: currentBlueprint.level,
                  skills: currentBlueprint.skills,
                  goal: currentBlueprint.goal,
                  projectType: currentBlueprint.projectType,
                  availableTime: currentBlueprint.availableTime,
                });
              }
            }}
          />
        ) : (
          <HeroGenerator
            onGenerate={handleGenerate}
            isLoading={isLoading}
            loadingStep={loadingStep}
            usageRemaining={isPro ? 999 : usageRemaining}
            onOpenSkillModal={() => setIsSkillModalOpen(true)}
            skills={skills}
            onRemoveSkill={handleRemoveSkill}
            onAddSkill={handleAddSkill}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenPrivacy={() => setInfoModalType('privacy')}
        onOpenTerms={() => setInfoModalType('terms')}
        onOpenSupport={() => setInfoModalType('support')}
      />

      {/* Modals & Slide-over Drawers */}
      <AddSkillModal
        isOpen={isSkillModalOpen}
        onClose={() => setIsSkillModalOpen(false)}
        currentSkills={skills}
        onAddSkill={handleAddSkill}
        onRemoveSkill={handleRemoveSkill}
      />

      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        onStartGenerating={() => {
          setCurrentBlueprint(null);
        }}
      />

      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        isPro={isPro}
        onUpgradeToPro={handleUpgradeToPro}
      />

      <SavedProjectsDrawer
        isOpen={isSavedDrawerOpen}
        onClose={() => setIsSavedDrawerOpen(false)}
        savedProjects={savedProjects}
        onSelectProject={(project) => {
          setCurrentBlueprint(project);
        }}
        onDeleteProject={handleDeleteSaved}
      />

      <InfoLegalModal
        type={infoModalType}
        onClose={() => setInfoModalType(null)}
      />

      {/* User Authentication Modal */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

