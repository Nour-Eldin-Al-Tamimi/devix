import React, { useState } from 'react';
import { X, Search, Plus, Check } from 'lucide-react';
import { SKILL_CATEGORIES, POPULAR_SKILLS } from '../data/mockSkills';

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSkills: string[];
  onAddSkill: (skill: string) => void;
  onRemoveSkill: (skill: string) => void;
}

export const AddSkillModal: React.FC<AddSkillModalProps> = ({
  isOpen,
  onClose,
  currentSkills,
  onAddSkill,
  onRemoveSkill,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  if (!isOpen) return null;

  const handleToggle = (skill: string) => {
    if (currentSkills.includes(skill)) {
      onRemoveSkill(skill);
    } else {
      onAddSkill(skill);
    }
  };

  const handleCustomAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchTerm.trim();
    if (clean && !currentSkills.includes(clean)) {
      onAddSkill(clean);
      setSearchTerm('');
    }
  };

  // Filter skills based on search term and category
  const filteredCategories = SKILL_CATEGORIES.map(cat => {
    const matching = cat.skills.filter(s =>
      s.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return {
      category: cat.category,
      skills: matching
    };
  }).filter(cat => cat.skills.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1B18]/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="add-skill-modal"
        className="bg-[#FCF9F4] border border-[#E5DDD2] rounded-2xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E5DDD2] flex items-center justify-between bg-[#F8F2EA]">
          <div>
            <h3 className="font-serif text-xl font-semibold text-[#1F1B18]">
              Add Skills & Technologies
            </h3>
            <p className="text-xs text-[#75675C] mt-0.5">
              Select languages, frameworks, and tools to tailor your project.
            </p>
          </div>
          <button
            id="close-skill-modal-btn"
            onClick={onClose}
            className="p-1.5 text-[#75675C] hover:text-[#1F1B18] hover:bg-[#EAE1DC] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Custom Input */}
        <div className="p-6 border-b border-[#E5DDD2] space-y-4">
          <form onSubmit={handleCustomAdd} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#75675C]" />
              <input
                id="skill-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search or type custom skill (e.g. Next.js, Redis, PyTorch)..."
                className="w-full bg-white border border-[#E5DDD2] focus:border-[#7A5338] focus:ring-1 focus:ring-[#7A5338] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#1F1B18] placeholder-[#75675C]/60 outline-none transition-all"
                autoFocus
              />
            </div>
            {searchTerm.trim() && !currentSkills.includes(searchTerm.trim()) && (
              <button
                type="submit"
                id="add-custom-skill-btn"
                className="bg-[#7A5338] hover:bg-[#67432A] text-white text-xs font-medium px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add "{searchTerm.trim()}"</span>
              </button>
            )}
          </form>

          {/* Currently Selected Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#75675C]">
              Selected ({currentSkills.length})
            </span>
            <div className="flex flex-wrap gap-1.5 min-h-[32px]">
              {currentSkills.length === 0 ? (
                <span className="text-xs text-[#75675C] italic">No skills selected yet.</span>
              ) : (
                currentSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 bg-[#EAE1DC] border border-[#D5C3B9] text-[#1F1B18] text-xs font-medium px-2.5 py-1 rounded-full animate-in zoom-in-95 duration-150"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveSkill(skill)}
                      className="text-[#75675C] hover:text-[#1F1B18] hover:bg-[#D5C3B9] rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Categorized Skills Browser */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#FCF9F4]">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#75675C]">No matching preset skills found.</p>
              <button
                type="button"
                onClick={handleCustomAdd}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#7A5338] font-medium bg-[#F0DCD0] px-3 py-1.5 rounded-lg hover:bg-[#E8CEBF] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add "{searchTerm.trim()}" as custom skill</span>
              </button>
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <div key={cat.category} className="space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#75675C]">
                  {cat.category}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {cat.skills.map((skill) => {
                    const isSelected = currentSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleToggle(skill)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#7A5338] text-white border-[#7A5338] shadow-xs'
                            : 'bg-white text-[#50443D] border-[#E5DDD2] hover:border-[#7A5338]/60 hover:bg-[#F8F2EA]'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                        <span>{skill}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E5DDD2] bg-[#F8F2EA] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              // Reset to standard defaults
              ['Python', 'React', 'SQL'].forEach(s => {
                if (!currentSkills.includes(s)) onAddSkill(s);
              });
            }}
            className="text-xs text-[#75675C] hover:text-[#1F1B18] underline underline-offset-2"
          >
            Reset to Recommended Defaults
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-[#7A5338] hover:bg-[#67432A] text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
