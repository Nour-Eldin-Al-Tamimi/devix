import React, { useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Check,
  Copy,
  Download,
  Share2,
  Sparkles,
  Layers,
  Database,
  Terminal,
  FileCode,
  CheckCircle2,
  Circle,
  HelpCircle,
  Award,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ProjectBlueprint } from '../types';

interface ProjectBlueprintViewProps {
  blueprint: ProjectBlueprint;
  onBack: () => void;
  onSave: (blueprint: ProjectBlueprint) => void;
  isSaved: boolean;
  onRegenerate: () => void;
}

export const ProjectBlueprintView: React.FC<ProjectBlueprintViewProps> = ({
  blueprint,
  onBack,
  onSave,
  isSaved,
  onRegenerate,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'architecture' | 'database_api' | 'roadmap' | 'resume_interview' | 'starter_code'
  >('overview');

  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      const allTaskIds = blueprint.milestones.flatMap((m) => m.tasks.map((t) => t.id));
      const totalCompleted = allTaskIds.filter((id) => next[id]).length;
      if (totalCompleted === allTaskIds.length && totalCompleted > 0) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#9A6F52', '#7A5338', '#EAE1DC', '#F0DCD0'],
        });
      }
      return next;
    });
  };

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleDownloadReadme = () => {
    const element = document.createElement('a');
    const file = new Blob([blueprint.readmeMarkdown], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${blueprint.title.toLowerCase().replace(/\s+/g, '-')}-README.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const allTaskIds = blueprint.milestones.flatMap((m) => m.tasks.map((t) => t.id));
  const totalTasks = allTaskIds.length;
  const completedCount = allTaskIds.filter((id) => completedTasks[id]).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-24 animate-in fade-in duration-300">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5DDD2] mb-8">
        <button
          id="back-to-generator-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#50443D] hover:text-[#1F1B18] transition-colors py-1.5 px-3 rounded-lg hover:bg-[#F3EDE4] self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Refine Criteria & Generate Another</span>
        </button>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            id="save-blueprint-btn"
            onClick={() => onSave(blueprint)}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl border transition-all ${
              isSaved
                ? 'bg-[#7A5338] text-white border-[#7A5338]'
                : 'bg-[#FCF9F4] text-[#50443D] border-[#E5DDD2] hover:bg-[#F3EDE4] hover:text-[#1F1B18]'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            <span>{isSaved ? 'Saved in Library' : 'Save Project'}</span>
          </button>

          <button
            id="download-readme-btn"
            onClick={handleDownloadReadme}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl bg-[#FCF9F4] border border-[#E5DDD2] text-[#50443D] hover:text-[#1F1B18] hover:bg-[#F3EDE4] transition-all"
            title="Download README.md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>README.md</span>
          </button>

          <button
            id="copy-full-plan-btn"
            onClick={() => copyToClipboard(blueprint.readmeMarkdown, 'full_plan')}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl bg-[#FCF9F4] border border-[#E5DDD2] text-[#50443D] hover:text-[#1F1B18] hover:bg-[#F3EDE4] transition-all"
          >
            {copiedSection === 'full_plan' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Markdown</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Project Header Card */}
      <div
        id="blueprint-hero-card"
        className="bg-[#FCF9F4] border border-[#E5DDD2] rounded-3xl p-6 sm:p-10 shadow-[0px_10px_40px_rgba(51,40,32,0.03)] mb-8"
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1 bg-[#F0DCD0] text-[#7A5338] text-xs font-semibold px-3 py-1 rounded-full border border-[#D5C3B9]">
            <Sparkles className="w-3 h-3" />
            <span>{blueprint.matchScore}% Match Score</span>
          </span>
          <span className="bg-[#EAE1DC] text-[#50443D] text-xs font-medium px-3 py-1 rounded-full border border-[#D5C3B9]">
            {blueprint.level} Level
          </span>
          <span className="bg-[#EAE1DC] text-[#50443D] text-xs font-medium px-3 py-1 rounded-full border border-[#D5C3B9]">
            {blueprint.projectType}
          </span>
          <span className="bg-[#EAE1DC] text-[#50443D] text-xs font-medium px-3 py-1 rounded-full border border-[#D5C3B9]">
            Est. {blueprint.availableTime}
          </span>
          <span className="bg-[#EAE1DC] text-[#50443D] text-xs font-medium px-3 py-1 rounded-full border border-[#D5C3B9]">
            Goal: {blueprint.goal}
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1F1B18] leading-[1.2] mb-4">
          {blueprint.title}
        </h1>

        <p className="text-[#50443D] text-lg font-normal leading-relaxed mb-6 max-w-3xl">
          {blueprint.tagline}
        </p>

        {/* Tech Stack Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E5DDD2]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#75675C] mr-1">
            Stack:
          </span>
          {blueprint.skills.map((skill) => (
            <span
              key={skill}
              className="bg-white border border-[#E5DDD2] text-[#1F1B18] text-xs font-medium px-3 py-1 rounded-lg"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar border-b border-[#E5DDD2]">
        {[
          { id: 'overview', label: '1. Executive Signal', icon: Award },
          { id: 'architecture', label: '2. System Design', icon: Layers },
          { id: 'database_api', label: '3. DB & API Specs', icon: Database },
          { id: 'roadmap', label: `4. Roadmap (${progressPercent}%)`, icon: CheckCircle2 },
          { id: 'resume_interview', label: '5. CV & Interview Prep', icon: HelpCircle },
          { id: 'starter_code', label: '6. Starter Code & README', icon: FileCode },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap border ${
                isActive
                  ? 'bg-[#7A5338] text-white border-[#7A5338] shadow-xs'
                  : 'bg-[#FCF9F4] text-[#50443D] border-[#E5DDD2] hover:bg-[#F3EDE4] hover:text-[#1F1B18]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: OVERVIEW & RECRUITER SIGNALS */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Deep Overview */}
          <div className="bg-[#FCF9F4] border border-[#E5DDD2] rounded-3xl p-6 sm:p-8 space-y-4">
            <h3 className="font-serif text-2xl font-bold text-[#1F1B18]">
              Project Overview & Mission
            </h3>
            <p className="text-sm sm:text-base text-[#50443D] leading-relaxed whitespace-pre-line">
              {blueprint.overview}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#E5DDD2]">
              <div className="bg-[#FFF8F5] border border-[#E5DDD2] rounded-2xl p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7A5338] mb-1.5">
                  The Real-World Problem
                </h4>
                <p className="text-xs sm:text-sm text-[#50443D] leading-relaxed">
                  {blueprint.problemStatement || 'Addressing high-latency processing bottlenecks and lack of actionable telemetry visibility.'}
                </p>
              </div>

              <div className="bg-[#FFF8F5] border border-[#E5DDD2] rounded-2xl p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7A5338] mb-1.5">
                  Target User / Stakeholder
                </h4>
                <p className="text-xs sm:text-sm text-[#50443D] leading-relaxed">
                  {blueprint.targetAudience || 'Engineering leads, technical recruiters, and system architects reviewing technical depth.'}
                </p>
              </div>
            </div>
          </div>

          {/* Why this proves skills */}
          <div className="bg-[#FCF9F4] border border-[#E5DDD2] rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#7A5338]" />
              <h3 className="font-serif text-2xl font-bold text-[#1F1B18]">
                Why This Project Proves Real Competence
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[#75675C]">
              Recruiters see hundreds of identical generic apps every week. Here is why this blueprint immediately signals senior capability:
            </p>

            <div className="grid grid-cols-1 gap-3 pt-2">
              {blueprint.whyItProvesSkills.map((reason, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 bg-[#FFF8F5] border border-[#E5DDD2] p-4 rounded-2xl"
                >
                  <div className="w-6 h-6 rounded-full bg-[#F0DCD0] text-[#7A5338] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-xs sm:text-sm text-[#1F1B18] font-medium leading-relaxed">
                    {reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: SYSTEM ARCHITECTURE */}
      {activeTab === 'architecture' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="bg-[#FCF9F4] border border-[#E5DDD2] rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#1F1B18] mb-2">
                System Design & Architecture Plan
              </h3>
              <p className="text-xs sm:text-sm text-[#50443D]">
                {blueprint.architecture.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#FFF8F5] border border-[#E5DDD2] p-5 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-[#7A5338] font-semibold text-xs uppercase tracking-wider">
                  <Terminal className="w-4 h-4" />
                  <span>Frontend Tier</span>
                </div>
                <p className="text-xs sm:text-sm text-[#50443D] leading-relaxed">
                  {blueprint.architecture.frontend}
                </p>
              </div>

              <div className="bg-[#FFF8F5] border border-[#E5DDD2] p-5 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-[#7A5338] font-semibold text-xs uppercase tracking-wider">
                  <Cpu className="w-4 h-4" />
                  <span>Backend & Logic</span>
                </div>
                <p className="text-xs sm:text-sm text-[#50443D] leading-relaxed">
                  {blueprint.architecture.backend}
                </p>
              </div>

              <div className="bg-[#FFF8F5] border border-[#E5DDD2] p-5 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-[#7A5338] font-semibold text-xs uppercase tracking-wider">
                  <Database className="w-4 h-4" />
                  <span>Data Layer & Cache</span>
                </div>
                <p className="text-xs sm:text-sm text-[#50443D] leading-relaxed">
                  {blueprint.architecture.database}
                </p>
              </div>

              <div className="bg-[#FFF8F5] border border-[#E5DDD2] p-5 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-[#7A5338] font-semibold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Auth & Security</span>
                </div>
                <p className="text-xs sm:text-sm text-[#50443D] leading-relaxed">
                  {blueprint.architecture.authAndSecurity}
                </p>
              </div>
            </div>

            <div className="bg-[#F8F2EA] border border-[#E5DDD2] p-5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-[#7A5338] font-semibold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Deployment & Continuous Integration</span>
              </div>
              <p className="text-xs sm:text-sm text-[#50443D] leading-relaxed">
                {blueprint.architecture.deployment}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: DATABASE SCHEMA & API SPECIFICATIONS */}
      {activeTab === 'database_api' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Database Tables */}
          <div className="bg-[#FCF9F4] border border-[#E5DDD2] rounded-3xl p-6 sm:p-8 space-y-6">
            <h3 className="font-serif text-2xl font-bold text-[#1F1B18]">
              Recommended Relational / Document Schema
            </h3>

            <div className="space-y-6">
              {blueprint.databaseSchema.map((table) => (
                <div
                  key={table.table}
                  className="bg-[#FFF8F5] border border-[#E5DDD2] rounded-2xl p-5 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-[#7A5338]" />
                      <span className="font-mono text-sm font-bold text-[#1F1B18]">
                        {table.table}
                      </span>
                    </div>
                    <span className="text-xs text-[#75675C]">{table.description}</span>
                  </div>

                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E5DDD2] text-[#75675C] uppercase tracking-wider">
                          <th className="py-2 px-3 font-semibold">Column / Field</th>
                          <th className="py-2 px-3 font-semibold">Type & Constraints</th>
                          <th className="py-2 px-3 font-semibold">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5DDD2]">
                        {table.columns.map((col) => (
                          <tr key={col.name} className="hover:bg-[#F6ECE8]/40 font-mono text-[11px]">
                            <td className="py-2 px-3 font-bold text-[#1F1B18]">{col.name}</td>
                            <td className="py-2 px-3 text-[#7A5338]">{col.type}</td>
                            <td className="py-2 px-3 font-sans text-xs text-[#50443D]">{col.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API Endpoints */}
          <div className="bg-[#FCF9F4] border border-[#E5DDD2] rounded-3xl p-6 sm:p-8 space-y-6">
            <h3 className="font-serif text-2xl font-bold text-[#1F1B18]">
              Key API Routes & Contracts
            </h3>

            <div className="space-y-4">
              {blueprint.apiEndpoints.map((ep, idx) => (
                <div
                  key={idx}
                  className="bg-[#FFF8F5] border border-[#E5DDD2] rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-md font-mono ${
                        ep.method === 'GET'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ep.method === 'POST'
                          ? 'bg-amber-100 text-amber-900'
                          : ep.method === 'DELETE'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-900'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-semibold text-[#1F1B18]">
                      {ep.path}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#50443D]">{ep.description}</p>

                  {(ep.samplePayload || ep.responsePreview) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {ep.samplePayload && (
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#75675C] block mb-1">
                            Request Body
                          </span>
                          <pre className="bg-[#1F1B18] text-[#EAE1DC] p-3 rounded-xl text-[11px] font-mono overflow-x-auto">
                            {ep.samplePayload}
                          </pre>
                        </div>
                      )}
                      {ep.responsePreview && (
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#75675C] block mb-1">
                            Response Preview
                          </span>
                          <pre className="bg-[#1F1B18] text-[#EAE1DC] p-3 rounded-xl text-[11px] font-mono overflow-x-auto">
                            {ep.responsePreview}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: EXECUTION ROADMAP & CHECKLIST */}
      {activeTab === 'roadmap' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="bg-[#FCF9F4] border border-[#E5DDD2] rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#1F1B18]">
                  Interactive Milestone Roadmap
                </h3>
                <p className="text-xs sm:text-sm text-[#75675C]">
                  Check off tasks as you build to track your progress and stay focused.
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-[#7A5338] mb-1">
                  Progress: {completedCount} / {totalTasks} Tasks ({progressPercent}%)
                </div>
                <div className="w-48 h-2 bg-[#EAE1DC] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#7A5338] transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {blueprint.milestones.map((phase) => (
                <div
                  key={phase.phaseNumber}
                  className="bg-[#FFF8F5] border border-[#E5DDD2] rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-[#E5DDD2] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#7A5338] bg-[#F0DCD0] px-2.5 py-0.5 rounded-full">
                        {phase.phase}
                      </span>
                      <h4 className="font-serif text-lg font-bold text-[#1F1B18]">
                        {phase.title}
                      </h4>
                    </div>
                    <span className="text-xs text-[#75675C]">{phase.duration}</span>
                  </div>

                  <div className="space-y-2.5">
                    {phase.tasks.map((t) => {
                      const done = !!completedTasks[t.id];
                      return (
                        <div
                          key={t.id}
                          onClick={() => toggleTask(t.id)}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                            done
                              ? 'bg-[#EAE1DC]/50 border-[#D5C3B9] opacity-75'
                              : 'bg-white border-[#E5DDD2] hover:border-[#7A5338]/60 hover:bg-[#FAF6F0]'
                          }`}
                        >
                          <button
                            type="button"
                            className="mt-0.5 text-[#7A5338] shrink-0"
                          >
                            {done ? (
                              <CheckCircle2 className="w-4 h-4 fill-[#7A5338] text-white" />
                            ) : (
                              <Circle className="w-4 h-4 text-[#83746C]" />
                            )}
                          </button>
                          <div className="space-y-0.5">
                            <p
                              className={`text-xs sm:text-sm font-medium ${
                                done ? 'line-through text-[#75675C]' : 'text-[#1F1B18]'
                              }`}
                            >
                              {t.task}
                            </p>
                            {t.details && (
                              <p className="text-[11px] sm:text-xs text-[#75675C]">
                                {t.details}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: RESUME BULLETS & INTERVIEW PREP */}
      {activeTab === 'resume_interview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* CV Goldmine */}
          <div className="bg-[#FCF9F4] border border-[#E5DDD2] rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#1F1B18]">
                  Resume & CV Goldmine (Google XYZ Format)
                </h3>
                <p className="text-xs sm:text-sm text-[#75675C]">
                  Directly paste these impact-driven bullets onto your LinkedIn & resume.
                </p>
              </div>
              <button
                id="copy-all-bullets-btn"
                onClick={() =>
                  copyToClipboard(blueprint.cvBulletPoints.map((b) => `• ${b}`).join('\n'), 'all_bullets')
                }
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#F0DCD0] text-[#7A5338] hover:bg-[#E8CEBF] transition-colors flex items-center gap-1.5 shrink-0"
              >
                {copiedSection === 'all_bullets' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied All!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy All Bullets</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3">
              {blueprint.cvBulletPoints.map((bullet, idx) => (
                <div
                  key={idx}
                  className="group flex items-start justify-between gap-4 bg-[#FFF8F5] border border-[#E5DDD2] p-4 rounded-2xl hover:border-[#7A5338]/50 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7A5338] mt-2 shrink-0" />
                    <p className="text-xs sm:text-sm text-[#1F1B18] font-medium leading-relaxed">
                      {bullet}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`• ${bullet}`, `bullet_${idx}`)}
                    className="text-[#75675C] hover:text-[#7A5338] p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    title="Copy bullet"
                  >
                    {copiedSection === `bullet_${idx}` ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Interview Questions */}
          <div className="bg-[#FCF9F4] border border-[#E5DDD2] rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#1F1B18]">
                Technical Interview Defense Cheat Sheet
              </h3>
              <p className="text-xs sm:text-sm text-[#75675C]">
                Senior interviewers test your trade-off reasoning. Here is how to nail the toughest questions:
              </p>
            </div>

            <div className="space-y-6">
              {blueprint.interviewQuestions.map((iq, idx) => (
                <div
                  key={idx}
                  className="bg-[#FFF8F5] border border-[#E5DDD2] rounded-2xl p-6 space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-bold bg-[#7A5338] text-white px-2.5 py-1 rounded-lg shrink-0">
                      Q{idx + 1}
                    </span>
                    <h4 className="font-serif text-base sm:text-lg font-bold text-[#1F1B18]">
                      "{iq.question}"
                    </h4>
                  </div>

                  <div className="space-y-3 pl-2 sm:pl-9">
                    <div className="bg-white border border-[#E5DDD2] p-4 rounded-xl space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                        Recommended Technical Answer
                      </span>
                      <p className="text-xs sm:text-sm text-[#1F1B18] leading-relaxed">
                        {iq.idealAnswer}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-[#FAF6F0] p-3 rounded-xl border border-[#E5DDD2]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5338] block mb-1">
                          Key Concept to Emphasize
                        </span>
                        <p className="text-xs text-[#50443D]">{iq.talkingPoint}</p>
                      </div>

                      <div className="bg-[#FFF1F0] p-3 rounded-xl border border-[#FFDAD6]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block mb-1">
                          Pitfall to Steer Clear Of
                        </span>
                        <p className="text-xs text-rose-900">{iq.pitfallsToAvoid}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: STARTER CODE & README */}
      {activeTab === 'starter_code' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Starter Files */}
          <div className="bg-[#FCF9F4] border border-[#E5DDD2] rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#1F1B18]">
                  Production Starter Code Snippets
                </h3>
                <p className="text-xs sm:text-sm text-[#75675C]">
                  Jumpstart your repository with fully drafted foundational files.
                </p>
              </div>
            </div>

            {blueprint.starterFiles.length > 0 && (
              <div className="space-y-3">
                {/* File selector tabs */}
                <div className="flex items-center gap-2 border-b border-[#E5DDD2] pb-2 overflow-x-auto">
                  {blueprint.starterFiles.map((file, idx) => (
                    <button
                      key={file.filename}
                      onClick={() => setActiveFileIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-1.5 ${
                        activeFileIndex === idx
                          ? 'bg-[#1F1B18] text-white shadow-xs'
                          : 'bg-[#FFF8F5] border border-[#E5DDD2] text-[#50443D] hover:bg-[#F3EDE4]'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>{file.filename}</span>
                    </button>
                  ))}
                </div>

                {/* Active file preview */}
                {blueprint.starterFiles[activeFileIndex] && (
                  <div className="bg-[#1F1B18] text-[#EAE1DC] rounded-2xl overflow-hidden shadow-md">
                    <div className="px-4 py-2.5 bg-[#2B2522] flex items-center justify-between border-b border-[#3A322E]">
                      <span className="text-xs font-mono text-[#D5C3B9]">
                        {blueprint.starterFiles[activeFileIndex].description}
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            blueprint.starterFiles[activeFileIndex].code,
                            `code_${activeFileIndex}`
                          )
                        }
                        className="text-xs text-[#D5C3B9] hover:text-white flex items-center gap-1 bg-[#3A322E] px-2.5 py-1 rounded-md transition-colors"
                      >
                        {copiedSection === `code_${activeFileIndex}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-4 text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
                      <code>{blueprint.starterFiles[activeFileIndex].code}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* GitHub Ready README Preview */}
          <div className="bg-[#FCF9F4] border border-[#E5DDD2] rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-2xl font-bold text-[#1F1B18]">
                GitHub-Ready README.md
              </h3>
              <button
                onClick={handleDownloadReadme}
                className="bg-[#7A5338] hover:bg-[#67432A] text-white text-xs font-medium px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .md File</span>
              </button>
            </div>

            <div className="bg-[#FFF8F5] border border-[#E5DDD2] rounded-2xl p-6">
              <pre className="text-xs sm:text-sm font-mono text-[#1F1B18] whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                {blueprint.readmeMarkdown}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
