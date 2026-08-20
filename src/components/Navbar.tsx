import React from 'react';
import { Sparkles, Bookmark, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  usageCount: number;
  maxUsage: number;
  savedCount: number;
  onOpenHowItWorks: () => void;
  onOpenPricing: () => void;
  onOpenSaved: () => void;
  onResetToHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  usageCount,
  maxUsage,
  savedCount,
  onOpenHowItWorks,
  onOpenPricing,
  onOpenSaved,
  onResetToHome,
}) => {
  const { isPro, isBeta, betaGenerationsRemaining } = useAuth();

  return (
    <header className="w-full border-b border-[#E5DDD2] bg-[#FFF8F5]/90 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <button
            id="brand-logo-btn"
            onClick={onResetToHome}
            className="text-2xl font-serif font-bold tracking-tight text-[#1F1B18] hover:text-[#7A5338] transition-colors focus:outline-none flex items-center gap-1.5"
          >
            DEVIX
          </button>
        </div>

        {/* Center / Right Navigation Actions */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <button
            id="nav-how-it-works-btn"
            onClick={onOpenHowItWorks}
            className="text-sm font-medium text-[#50443D] hover:text-[#1F1B18] transition-colors py-1.5 px-2.5 rounded-lg hover:bg-[#F3EDE4]"
          >
            How it works
          </button>

          <button
            id="nav-pricing-btn"
            onClick={onOpenPricing}
            className="text-sm font-medium text-[#50443D] hover:text-[#1F1B18] transition-colors py-1.5 px-2.5 rounded-lg hover:bg-[#F3EDE4]"
          >
            Pricing
          </button>

          {/* Usage Badge */}
          <div
            id="nav-usage-badge"
            className="text-xs font-medium text-[#50443D] bg-[#F3EDE4] border border-[#E5DDD2] px-3 py-1.5 rounded-full hidden md:flex items-center gap-1.5"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isPro ? 'bg-emerald-600' : isBeta && betaGenerationsRemaining > 0 ? 'bg-amber-600' : 'bg-[#7A5338]'}`} />
            <span>
              {isPro
                ? 'Pro: Unlimited'
                : isBeta && betaGenerationsRemaining > 0
                ? `Beta: ${betaGenerationsRemaining} left`
                : `Usage: ${usageCount}/${maxUsage}`}
            </span>
          </div>

          {/* Saved Projects Button */}
          {savedCount > 0 && (
            <button
              id="nav-saved-projects-btn"
              onClick={onOpenSaved}
              className="text-xs font-medium text-[#7A5338] bg-[#F0DCD0]/60 hover:bg-[#F0DCD0] border border-[#D5C3B9] px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved ({savedCount})</span>
            </button>
          )}

          {/* Primary CTA / Pro Badge */}
          {!isPro ? (
            <button
              id="nav-lifetime-access-btn"
              onClick={onOpenPricing}
              className="bg-[#7A5338] hover:bg-[#67432A] text-white text-sm font-medium px-3.5 py-2 rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.98] flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 opacity-90 hidden sm:inline" />
              <span>Get Lifetime Access</span>
            </button>
          ) : (
            <div
              id="nav-pro-badge"
              className="bg-emerald-800 text-emerald-100 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 border border-emerald-700"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PRO LIFETIME</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

