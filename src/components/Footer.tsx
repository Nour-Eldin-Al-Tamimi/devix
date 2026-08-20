import React from 'react';

interface FooterProps {
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  onOpenSupport?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPrivacy,
  onOpenTerms,
  onOpenSupport,
}) => {
  return (
    <footer className="w-full border-t border-[#E5DDD2] bg-[#FFF8F5] py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#75675C]">
        <div className="font-medium text-[#1F1B18]/90">
          © 2024 DEVIX. Built for the modern creator.
        </div>

        <div className="flex items-center gap-6 font-normal">
          <button
            onClick={onOpenPrivacy}
            className="hover:text-[#1F1B18] transition-colors focus:outline-none"
          >
            Privacy
          </button>
          <button
            onClick={onOpenTerms}
            className="hover:text-[#1F1B18] transition-colors focus:outline-none"
          >
            Terms
          </button>
          <button
            onClick={onOpenSupport}
            className="hover:text-[#1F1B18] transition-colors focus:outline-none"
          >
            Support
          </button>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#1F1B18] transition-colors"
          >
            Twitter
          </a>
        </div>
      </div>
    </footer>
  );
};
