import React, { useState } from 'react';
import { X, Plus, Search, ChevronDown, ArrowRight, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { DeveloperLevel, GoalType, ProjectGeneratorInput } from '../types';
import { PROJECT_TYPES, TIME_OPTIONS } from '../data/mockSkills';

interface HeroGeneratorProps {
  onGenerate: (input: ProjectGeneratorInput) => Promise<void>;
  isLoading: boolean;
  loadingStep: string;
  usageRemaining: number;
  onOpenSkillModal: () => void;
  skills: string[];
  onRemoveSkill: (skill: string) => void;
  onAddSkill: (skill: string) => void;
}

export const HeroGenerator: React.FC<HeroGeneratorProps> = ({
  onGenerate,
  isLoading,
  loadingStep,
  usageRemaining,
  onOpenSkillModal,
  skills,
  onRemoveSkill,
  onAddSkill,
}) => {
  const [level, setLevel] = useState<DeveloperLevel>('Beginner');
  const [goal, setGoal] = useState<GoalType>('Strengthen my CV');
  const [projectType, setProjectType] = useState<string>('Web App');
  const [availableTime, setAvailableTime] = useState<string>('1 Day');

  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [typeSearchTerm, setTypeSearchTerm] = useState('');
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);

  const levels: DeveloperLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
  const goals: GoalType[] = [
    'Strengthen my CV',
    'Build my portfolio',
    'Practice my skills',
    'Prepare for jobs',
  ];

  const filteredProjectTypes = PROJECT_TYPES.filter((t) =>
    t.toLowerCase().includes(typeSearchTerm.toLowerCase())
  );

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    onGenerate({
      level,
      skills,
      goal,
      projectType,
      availableTime,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-20">
      {/* Top Tagline Pill */}
      <div className="flex justify-center mb-6">
        <div
          id="hero-badge"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EAE1DC] border border-[#D5C3B9]/70 text-[#50443D] text-xs font-semibold tracking-wider uppercase"
        >
          <span>For developers who want to stand out</span>
        </div>
      </div>

      {/* Hero Display Heading */}
      <div className="text-center space-y-4 mb-12">
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#1F1B18] leading-[1.15]">
          Build projects that{' '}
          <span className="italic font-normal text-[#9A6F52]">prove</span> your
          skills.
        </h1>
        <p className="text-[#50443D] text-base sm:text-lg max-w-xl mx-auto font-normal leading-relaxed">
          Stop searching for random project ideas. Get a project tailored to your
          skills, goals, and experience level.
        </p>
      </div>

      {/* Main Generator Card */}
      <div
        id="generator-card"
        className="bg-[#FCF9F4] border border-[#E5DDD2] rounded-3xl p-6 sm:p-10 shadow-[0px_10px_40px_rgba(51,40,32,0.03)] relative"
      >
        <form onSubmit={handleFormSubmit} className="space-y-8">
          {/* 1. YOUR LEVEL */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1B18]">
              Your Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {levels.map((lvl) => {
                const isSelected = level === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    id={`level-btn-${lvl.toLowerCase()}`}
                    onClick={() => setLevel(lvl)}
                    className={`py-3.5 px-4 rounded-xl text-sm font-medium transition-all text-center border ${
                      isSelected
                        ? 'bg-[#F6ECE8] border-[#9A6F52] text-[#1F1B18] shadow-xs ring-1 ring-[#9A6F52]'
                        : 'bg-[#FCF9F4] hover:bg-[#F6ECE8]/60 border-[#E5DDD2] text-[#50443D]'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. YOUR SKILLS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1B18]">
                Your Skills
              </label>
              <button
                type="button"
                onClick={onOpenSkillModal}
                className="text-xs text-[#9A6F52] hover:text-[#7A5338] font-medium transition-colors"
              >
                Browse all skills
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 bg-[#EAE1DC] text-[#1F1B18] text-xs font-medium px-3.5 py-1.5 rounded-full border border-[#D5C3B9] transition-all hover:bg-[#DFD5CF]"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveSkill(skill)}
                    className="text-[#75675C] hover:text-[#1F1B18] p-0.5 rounded-full"
                    title={`Remove ${skill}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {/* + Add skill button */}
              <button
                type="button"
                id="add-skill-button"
                onClick={onOpenSkillModal}
                className="inline-flex items-center gap-1 bg-[#FCF9F4] hover:bg-[#F6ECE8] text-[#50443D] text-xs font-medium px-3.5 py-1.5 rounded-full border border-dashed border-[#83746C] hover:border-[#1F1B18] transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add skill</span>
              </button>
            </div>
          </div>

          {/* 3. YOUR GOAL */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1B18]">
              Your Goal
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {goals.map((g) => {
                const isSelected = goal === g;
                return (
                  <button
                    key={g}
                    type="button"
                    id={`goal-btn-${g.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => setGoal(g)}
                    className={`py-3.5 px-5 rounded-xl text-sm font-medium text-left transition-all border ${
                      isSelected
                        ? 'bg-[#F6ECE8] border-[#9A6F52] text-[#1F1B18] shadow-xs ring-1 ring-[#9A6F52]'
                        : 'bg-[#FCF9F4] hover:bg-[#F6ECE8]/60 border-[#E5DDD2] text-[#50443D]'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#E5DDD2] pt-2" />

          {/* 4. Bottom Row: Project Type & Available Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Project Type */}
            <div className="space-y-2 relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1B18]">
                Project Type
              </label>
              <div
                className="w-full bg-[#FCF9F4] border border-[#E5DDD2] rounded-xl p-2 flex items-center gap-2 cursor-pointer focus-within:border-[#9A6F52] focus-within:ring-1 focus-within:ring-[#9A6F52] transition-all"
                onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
              >
                {projectType ? (
                  <span className="inline-flex items-center gap-1 bg-[#EAE1DC] text-[#1F1B18] text-xs font-medium px-2.5 py-1 rounded-md shrink-0">
                    <span>{projectType}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectType('');
                      }}
                      className="hover:text-[#9A6F52]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : null}
                <input
                  id="project-type-input"
                  type="text"
                  value={typeSearchTerm}
                  onChange={(e) => {
                    setTypeSearchTerm(e.target.value);
                    if (!typeDropdownOpen) setTypeDropdownOpen(true);
                  }}
                  onFocus={() => setTypeDropdownOpen(true)}
                  placeholder={projectType ? '' : 'Search types...'}
                  className="bg-transparent text-sm text-[#1F1B18] placeholder-[#75675C]/70 outline-none flex-1 min-w-[60px]"
                />
                <Search className="w-4 h-4 text-[#75675C] shrink-0 mr-1" />
              </div>

              {/* Type Dropdown Popover */}
              {typeDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setTypeDropdownOpen(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#FCF9F4] border border-[#E5DDD2] rounded-xl shadow-lg z-20 py-1 max-h-56 overflow-y-auto">
                    {filteredProjectTypes.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setProjectType(t);
                          setTypeSearchTerm('');
                          setTypeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors flex items-center justify-between ${
                          projectType === t
                            ? 'bg-[#F6ECE8] text-[#9A6F52]'
                            : 'text-[#1F1B18] hover:bg-[#F6ECE8]/70'
                        }`}
                      >
                        <span>{t}</span>
                        {projectType === t && (
                          <span className="text-[10px] uppercase font-bold text-[#9A6F52]">
                            Selected
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Available Time */}
            <div className="space-y-2 relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1B18]">
                Available Time
              </label>
              <div
                id="available-time-selector"
                onClick={() => setTimeDropdownOpen(!timeDropdownOpen)}
                className="w-full bg-[#FCF9F4] border border-[#E5DDD2] rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-[#9A6F52]/60 transition-all text-sm text-[#1F1B18]"
              >
                <span className="font-medium">{availableTime}</span>
                <ChevronDown className="w-4 h-4 text-[#75675C]" />
              </div>

              {/* Time Dropdown Popover */}
              {timeDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setTimeDropdownOpen(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#FCF9F4] border border-[#E5DDD2] rounded-xl shadow-lg z-20 py-1">
                    {TIME_OPTIONS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setAvailableTime(t);
                          setTimeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${
                          availableTime === t
                            ? 'bg-[#F6ECE8] text-[#9A6F52]'
                            : 'text-[#1F1B18] hover:bg-[#F6ECE8]/70'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Submit CTA Button & Usage Indicator */}
          <div className="pt-4 flex flex-col items-center space-y-3">
            <button
              type="submit"
              id="generate-project-btn"
              disabled={isLoading}
              className="bg-[#9A6F52] hover:bg-[#865E43] disabled:opacity-75 text-white font-medium text-sm sm:text-base px-8 py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.99] flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{loadingStep || 'Crafting Custom Blueprint...'}</span>
                </>
              ) : (
                <>
                  <span>Generate My Project</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-xs text-[#75675C] font-normal">
              {usageRemaining} free project generation{usageRemaining === 1 ? '' : 's'} remaining.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
