import React, { useState } from 'react';
import { X, Bookmark, Trash2, ArrowRight, Calendar, Sparkles, Search } from 'lucide-react';
import { ProjectBlueprint } from '../types';

interface SavedProjectsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedProjects: ProjectBlueprint[];
  onSelectProject: (project: ProjectBlueprint) => void;
  onDeleteProject: (projectId: string) => void;
}

export const SavedProjectsDrawer: React.FC<SavedProjectsDrawerProps> = ({
  isOpen,
  onClose,
  savedProjects,
  onSelectProject,
  onDeleteProject,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = savedProjects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.goal.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1F1B18]/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          id="saved-projects-drawer"
          className="w-screen max-w-md bg-[#FCF9F4] border-l border-[#E5DDD2] shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#E5DDD2] bg-[#F8F2EA] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#7A5338]" />
              <h3 className="font-serif text-xl font-bold text-[#1F1B18]">
                Saved Projects ({savedProjects.length})
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#75675C] hover:text-[#1F1B18] hover:bg-[#EAE1DC] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar */}
          {savedProjects.length > 0 && (
            <div className="p-4 border-b border-[#E5DDD2]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#75675C]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search saved blueprints..."
                  className="w-full bg-white border border-[#E5DDD2] rounded-xl pl-8 pr-3 py-2 text-xs text-[#1F1B18] placeholder-[#75675C]/60 outline-none focus:border-[#7A5338]"
                />
              </div>
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {savedProjects.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#EAE1DC] text-[#75675C] flex items-center justify-center mx-auto">
                  <Bookmark className="w-5 h-5" />
                </div>
                <h4 className="font-serif text-base font-bold text-[#1F1B18]">
                  No Saved Projects Yet
                </h4>
                <p className="text-xs text-[#75675C] max-w-xs mx-auto">
                  Generate a project blueprint and click "Save Project" to store it in your offline library.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#75675C]">
                No projects match your search query.
              </div>
            ) : (
              filtered.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-[#FFF8F5] border border-[#E5DDD2] rounded-2xl p-4 space-y-2.5 hover:border-[#7A5338]/60 transition-all group relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5338] bg-[#F0DCD0] px-2 py-0.5 rounded-md">
                      {proj.level}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-[#75675C]">
                        {new Date(proj.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => onDeleteProject(proj.id)}
                        className="text-[#75675C] hover:text-rose-600 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-serif text-sm font-bold text-[#1F1B18] line-clamp-2">
                    {proj.title}
                  </h4>

                  <p className="text-xs text-[#50443D] line-clamp-2">
                    {proj.tagline}
                  </p>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {proj.skills.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="bg-white border border-[#E5DDD2] text-[#50443D] text-[10px] px-2 py-0.5 rounded-md"
                      >
                        {s}
                      </span>
                    ))}
                    {proj.skills.length > 3 && (
                      <span className="text-[10px] text-[#75675C] self-center">
                        +{proj.skills.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#E5DDD2] flex justify-end">
                    <button
                      onClick={() => {
                        onSelectProject(proj);
                        onClose();
                      }}
                      className="text-xs font-semibold text-[#7A5338] hover:text-[#1F1B18] flex items-center gap-1"
                    >
                      <span>Open Blueprint</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
