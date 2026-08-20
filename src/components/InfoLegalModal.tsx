import React from 'react';
import { X, Shield, FileText, LifeBuoy } from 'lucide-react';

interface InfoLegalModalProps {
  type: 'privacy' | 'terms' | 'support' | null;
  onClose: () => void;
}

export const InfoLegalModal: React.FC<InfoLegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  const contentMap = {
    privacy: {
      title: 'Privacy Policy',
      icon: Shield,
      subtitle: 'How we handle your project generations and preferences.',
      body: `At DEVIX, we believe your developer portfolio and career aspirations are personal.
      
1. Data Storage: All your generated blueprints and progress checklists are saved locally in your browser's persistent storage by default.
2. AI Queries: When generating customized project plans, your selected skills and constraints are processed strictly to craft your blueprint.
3. No Code Scraping: DEVIX does not claim any ownership over the code you write based on our blueprints. All projects you build remain 100% your intellectual property.`,
    },
    terms: {
      title: 'Terms of Service',
      icon: FileText,
      subtitle: 'Guidelines for using the DEVIX Project Idea Generator.',
      body: `Welcome to DEVIX. By using this service, you agree to the following terms:

1. Permitted Use: You are free to build, open-source, monetize, and showcase any project created from DEVIX blueprints on your resume, GitHub, and portfolio.
2. Generation Quotas: Free tier accounts receive 5 generations per month. Lifetime Pro users enjoy unrestricted blueprint creation.
3. Fair Usage: Automated scraping or reverse-engineering of DEVIX algorithms is prohibited.`,
    },
    support: {
      title: 'DEVIX Support & Career Help',
      icon: LifeBuoy,
      subtitle: 'Need assistance or have feedback on a blueprint?',
      body: `We are here to help you turn project ideas into job offers!

• Technical Inquiries: support@devix.dev
• Feature Suggestions: Submit your favorite language or framework requests anytime.
• Community Feedback: Join thousands of creators building standout portfolios that get noticed by top engineering teams.`,
    },
  };

  const active = contentMap[type];
  const Icon = active.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1B18]/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FCF9F4] border border-[#E5DDD2] rounded-3xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-[#E5DDD2] bg-[#F8F2EA] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F0DCD0] flex items-center justify-center text-[#7A5338]">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#1F1B18]">{active.title}</h3>
              <p className="text-xs text-[#75675C]">{active.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#75675C] hover:text-[#1F1B18] hover:bg-[#EAE1DC] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs sm:text-sm text-[#50443D] leading-relaxed whitespace-pre-line">
          {active.body}
        </div>

        <div className="p-4 border-t border-[#E5DDD2] bg-[#F8F2EA] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#7A5338] hover:bg-[#67432A] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
