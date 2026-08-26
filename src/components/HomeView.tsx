import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Database,
  CheckCircle2,
  Clock,
  BookOpen,
  Target,
  BarChart3,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { LearnerProfile } from '../types';

interface HomeViewProps {
  onStartDiagnostic: (intake: {
    name?: string;
    subject: string;
    goal: string;
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    availableLearningTime: string;
  }) => void;
  activeProfile: LearnerProfile | null;
  hasActiveDiagnostic: boolean;
  onResumeDiagnostic: () => void;
  onGoToDashboard: () => void;
  onGoToReport: () => void;
}

const PRESET_SUBJECTS = [
  { name: 'Biology', icon: '🧬', desc: 'Cellular respiration, genetics, ecology, physiology' },
  { name: 'Computer Science', icon: '💻', desc: 'Algorithms, data structures, async systems, design' },
  { name: 'Physics', icon: '⚡', desc: 'Mechanics, thermodynamics, electromagnetism, optics' },
  { name: 'Mathematics', icon: '📐', desc: 'Calculus, linear algebra, probability, mathematical proof' },
  { name: 'AI & Data Science', icon: '🤖', desc: 'Machine learning, neural nets, transformers, statistics' },
  { name: 'Chemistry', icon: '🧪', desc: 'Equilibrium, kinetics, organic mechanisms, bonding' },
  { name: 'Economics', icon: '📈', desc: 'Microeconomics, macro models, elasticity, game theory' },
  { name: 'English & Logic', icon: '✍️', desc: 'Critical analysis, argumentation, rhetorical strategies' },
];

export const HomeView: React.FC<HomeViewProps> = ({
  onStartDiagnostic,
  activeProfile,
  hasActiveDiagnostic,
  onResumeDiagnostic,
  onGoToDashboard,
  onGoToReport,
}) => {
  const [name, setName] = useState(activeProfile?.name || '');
  const [selectedSubject, setSelectedSubject] = useState(activeProfile?.subject || 'Biology');
  const [customSubject, setCustomSubject] = useState('');
  const [goal, setGoal] = useState(activeProfile?.goal || '');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(
    activeProfile?.experienceLevel === 'unspecified' ? 'intermediate' : activeProfile?.experienceLevel || 'intermediate'
  );
  const [availableTime, setAvailableTime] = useState(activeProfile?.availableLearningTime || '30 mins / day');
  const [isCustom, setIsCustom] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = isCustom && customSubject.trim() ? customSubject.trim() : selectedSubject;
    const finalGoal = goal.trim() || `Master core principles and applications in ${finalSubject}`;

    onStartDiagnostic({
      name: name.trim() || undefined,
      subject: finalSubject,
      goal: finalGoal,
      experienceLevel,
      availableLearningTime: availableTime,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Offline-First Adaptive Learning & Diagnostic Agent</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-100 tracking-tight">
          Personalized Learning <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-emerald-400 to-teal-300">Intelligence Agent</span>
        </h1>

        <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
          An adaptive AI learning coach powered by your local Ollama LLM and embedded vector database.
          Diagnoses your cognitive learning stage across Bloom&apos;s Taxonomy, pinpoints misconceptions, and builds an evolving mastery pathway.
        </p>

        {/* Quick Resume Card if user has existing progress */}
        {(hasActiveDiagnostic || activeProfile) && (
          <div className="bg-gradient-to-r from-indigo-950/80 to-slate-900 border border-indigo-800/60 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left shadow-lg">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {hasActiveDiagnostic ? 'Active Diagnostic in Progress' : `Existing Profile: ${activeProfile?.subject}`}
                </h4>
                <p className="text-xs text-slate-400">
                  {hasActiveDiagnostic
                    ? 'Resume your adaptive diagnostic where you left off.'
                    : `Current Stage: ${activeProfile?.stageName} (Mastery: ${activeProfile?.subjectMastery.overallMastery}%)`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              {hasActiveDiagnostic ? (
                <button
                  onClick={onResumeDiagnostic}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Resume Diagnostic</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={onGoToReport}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
                  >
                    View Report
                  </button>
                  <button
                    onClick={onGoToDashboard}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
                  >
                    <span>Learning Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Intake Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Setup Form */}
        <div className="lg:col-span-7 bg-[#0F172A] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Target className="w-5 h-5 text-indigo-400" />
              <span>Learner Intake & Subject Setup</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Provide your learning focus. PLIA will calibrate 10–15 diagnostic questions to map your cognitive stage.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Learner Name (Optional) */}
            <div className="space-y-2">
              <label htmlFor="learner-name-input" className="block text-xs font-medium text-slate-300">
                Learner Name <span className="text-slate-500">(Optional)</span>
              </label>
              <input
                id="learner-name-input"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Alex, Maya, or leave blank"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-colors"
              />
            </div>

            {/* Subject Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-300 flex items-center justify-between">
                <span>Select Target Subject</span>
                <button
                  type="button"
                  onClick={() => setIsCustom(!isCustom)}
                  className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold"
                >
                  {isCustom ? '← Choose from Preset List' : '+ Enter Custom Subject'}
                </button>
              </label>

              {isCustom ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customSubject}
                    onChange={e => setCustomSubject(e.target.value)}
                    placeholder="Enter any academic or professional subject (e.g. Neuroscience, Organic Chemistry, Macroeconomics)"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-colors"
                    required
                  />
                  <p className="text-[11px] text-slate-400">
                    PLIA dynamically generates questions, vector embeddings, and rubric criteria for any legitimate subject.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {PRESET_SUBJECTS.map(subj => {
                    const isSelected = selectedSubject === subj.name;
                    return (
                      <div
                        key={subj.name}
                        onClick={() => setSelectedSubject(subj.name)}
                        className={`cursor-pointer p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-950/60 border-indigo-500/80 shadow-sm'
                            : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{subj.icon}</span>
                          <span className={`text-sm font-semibold ${isSelected ? 'text-indigo-300' : 'text-slate-200'}`}>
                            {subj.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{subj.desc}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Learning Goal */}
            <div className="space-y-2">
              <label htmlFor="learning-goal-input" className="block text-xs font-medium text-slate-300">
                Primary Learning Goal
              </label>
              <input
                id="learning-goal-input"
                type="text"
                value={goal}
                onChange={e => setGoal(e.target.value)}
                placeholder={`e.g. Master core principles and applications in ${selectedSubject}`}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-colors"
              />
            </div>

            {/* Experience Level & Available Study Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Experience Level */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">Self-Assessed Baseline</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['beginner', 'intermediate', 'advanced'] as const).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setExperienceLevel(lvl)}
                      className={`py-2 px-2 rounded-xl text-xs font-medium capitalize border transition-all ${
                        experienceLevel === lvl
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Available Time */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">Available Time</label>
                <select
                  value={availableTime}
                  onChange={e => setAvailableTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-colors"
                >
                  <option value="15 mins / day">15 mins / day (Bite-sized)</option>
                  <option value="30 mins / day">30 mins / day (Standard)</option>
                  <option value="45 mins / day">45 mins / day (Intensive)</option>
                  <option value="60+ mins / day">60+ mins / day (Deep Focus)</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="start-diagnostic-submit-btn"
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm sm:text-base flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.01]"
            >
              <span>Start Personalized Diagnostic</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Column: Architectural Principles & Evidence Framework */}
        <div className="lg:col-span-5 space-y-5">
          {/* Key Principles Card */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
              <Brain className="w-4 h-4 text-emerald-400" />
              <span>Pedagogical Architecture</span>
            </h3>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-white">10–15 Adaptive Questions:</span>
                  <p className="text-slate-400 mt-0.5">
                    Questions scale in cognitive complexity (Remember → Understand → Apply → Analyze → Evaluate → Create). Stops adaptively when evidence converges.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-950/60 border border-indigo-800/80 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                  <Database className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-white">Embedded Vector Database:</span>
                  <p className="text-slate-400 mt-0.5">
                    Fast local dense vector indexing (<span className="text-indigo-300 font-mono">128-dim cosine</span>) retrieves domain standards, misconceptions, and custom notes in &lt;2ms.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-lg bg-amber-950/60 border border-amber-800/80 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-white">Cognitive Learning Stages (1–6):</span>
                  <p className="text-slate-400 mt-0.5">
                    From Foundational Learner to Advanced Creator. Inferred from demonstrated evidence; subject mastery is separated from general cognitive capability.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-lg bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-white">100% Offline & Private:</span>
                  <p className="text-slate-400 mt-0.5">
                    Runs on your laptop with Ollama. Zero external API calls, zero telemetry, and all learner data remains strictly local in SQLite / IndexedDB.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Educational Disclaimer Pill */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Educational Notice:</span>
            <p>
              PLIA measures <em>Cognitive Learning Stages</em> based on current task performance. It does not measure IQ, neurological age, or clinical psychological traits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
