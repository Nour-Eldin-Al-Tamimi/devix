import React from 'react';
import { X, Sparkles, CheckCircle, ShieldCheck, Target, ArrowRight } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGenerating: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
  onStartGenerating,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1B18]/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="how-it-works-modal"
        className="bg-[#FCF9F4] border border-[#E5DDD2] rounded-3xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-6 sm:px-8 py-6 border-b border-[#E5DDD2] flex items-center justify-between bg-[#F8F2EA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F0DCD0] flex items-center justify-center text-[#7A5338]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#1F1B18]">
                How DEVIX Works
              </h3>
              <p className="text-xs text-[#75675C]">
                Why tailored blueprints beat generic tutorials every time.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#75675C] hover:text-[#1F1B18] hover:bg-[#EAE1DC] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-[#FCF9F4]">
          {/* Step 1 */}
          <div className="flex gap-4 items-start bg-[#FFF8F5] border border-[#E5DDD2] p-5 rounded-2xl">
            <div className="w-8 h-8 rounded-full bg-[#F0DCD0] text-[#7A5338] font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div className="space-y-1.5">
              <h4 className="font-serif text-lg font-bold text-[#1F1B18]">
                Input Your Real Experience & Goals
              </h4>
              <p className="text-xs sm:text-sm text-[#50443D] leading-relaxed">
                Choose your exact skills (e.g. Python, React, SQL), target level, and primary goal (CV boost, portfolio showpiece, or interview prep). DEVIX avoids one-size-fits-all prompts.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 items-start bg-[#FFF8F5] border border-[#E5DDD2] p-5 rounded-2xl">
            <div className="w-8 h-8 rounded-full bg-[#F0DCD0] text-[#7A5338] font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div className="space-y-1.5">
              <h4 className="font-serif text-lg font-bold text-[#1F1B18]">
                Architectural Synthesis, Not Just Ideas
              </h4>
              <p className="text-xs sm:text-sm text-[#50443D] leading-relaxed">
                DEVIX drafts a full enterprise blueprint: multi-tier architecture, normalized SQL schemas with composite indexes, realistic API routes, and phased milestones.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 items-start bg-[#FFF8F5] border border-[#E5DDD2] p-5 rounded-2xl">
            <div className="w-8 h-8 rounded-full bg-[#F0DCD0] text-[#7A5338] font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div className="space-y-1.5">
              <h4 className="font-serif text-lg font-bold text-[#1F1B18]">
                Recruiter-Ready CV Bullets & Interview Defense
              </h4>
              <p className="text-xs sm:text-sm text-[#50443D] leading-relaxed">
                Get pre-crafted Google XYZ-format resume bullets and prepare for senior interview questions on database concurrency, caching trade-offs, and failure recovery.
              </p>
            </div>
          </div>

          {/* Comparison */}
          <div className="bg-[#FAF6F0] border border-[#E5DDD2] p-5 rounded-2xl space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7A5338]">
              The DEVIX Difference
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1 text-rose-900 bg-white/70 p-3 rounded-xl border border-rose-100">
                <span className="font-bold text-rose-700 block">❌ Generic Tutorials</span>
                <p>Simple todo lists and calculators that recruiters immediately discard as copy-paste clones.</p>
              </div>
              <div className="space-y-1 text-emerald-950 bg-white/70 p-3 rounded-xl border border-emerald-100">
                <span className="font-bold text-emerald-700 block">✨ Tailored DEVIX Blueprints</span>
                <p>Production concepts with distributed streams, indexing, edge-case tests, and interview defense.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-[#E5DDD2] bg-[#F8F2EA] flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-medium text-[#75675C] hover:text-[#1F1B18]"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onStartGenerating();
            }}
            className="bg-[#7A5338] hover:bg-[#67432A] text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <span>Create My First Project</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
