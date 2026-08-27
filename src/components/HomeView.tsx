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
  RotateCw,
  MessageSquare,
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
  { name: 'Computer Science', icon: '💻', desc: 'Distributed systems, memory management, algorithms & async concurrency' },
  { name: 'AI & Data Science', icon: '🤖', desc: 'Transformer KV-cache, gradient dynamics, statistical inference' },
  { name: 'Biology', icon: '🧬', desc: 'Cellular respiration, CRISPR genetics, ecology & bioenergetics' },
  { name: 'Physics', icon: '⚡', desc: 'Orbital resonance, thermodynamic cycles, quantum decoherence' },
  { name: 'Mathematics', icon: '📐', desc: 'Differential stability, matrix eigenvalues, cryptographic lattices' },
  { name: 'Chemistry', icon: '🧪', desc: 'Reaction kinetics, chemical equilibria, electrochemical degradation' },
  { name: 'Economics', icon: '📈', desc: 'Macro liquidity shocks, market maker slippage, game theory' },
  { name: 'English & Logic', icon: '✍️', desc: 'Epistemic logic, fallacy identification, rhetorical deconstruction' },
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
  const [selectedSubject, setSelectedSubject] = useState(activeProfile?.subject || 'Computer Science');
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
          <span>Local Llama AI Real-World Problem Solving Engine</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-100 tracking-tight">
          Personalized Learning <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-emerald-400 to-teal-300">Intelligence Agent</span>
        </h1>

        <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
          Solve authentic production incidents, test edge-case hypotheses, and diagnose cognitive stages with your offline Llama model and local vector database.
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
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Resume Diagnostic</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={onGoToReport}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all cursor-pointer"
                  >
                    View Report
                  </button>
                  <button
                    onClick={onGoToDashboard}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
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
        <div className="lg:col-span-7 bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Target className="w-5 h-5 text-indigo-400" />
              <span>Learner Intake & Subject Calibration</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select or type any subject. PLIA uses real-time local Llama models to dynamically generate novel real-world diagnostic problems.
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
                  className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold cursor-pointer"
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
                    placeholder="Enter any subject (e.g. Kubernetes Site Reliability, Quantitative Finance, Cellular Immunology)"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-colors"
                    required
                  />
                  <p className="text-[11px] text-slate-400">
                    PLIA dynamically synthesizes real-world incident cases, vector embeddings, and rubric criteria for any subject.
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
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {subj.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Specific Goal */}
            <div className="space-y-2">
              <label htmlFor="learning-goal-input" className="block text-xs font-medium text-slate-300">
                Primary Goal or Capstone Focus
              </label>
              <input
                id="learning-goal-input"
                type="text"
                value={goal}
                onChange={e => setGoal(e.target.value)}
                placeholder={`e.g. Master real-world debugging, design scalable architectures, pass technical exams`}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-colors"
              />
            </div>

            {/* Experience Level & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">Prior Experience</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['beginner', 'intermediate', 'advanced'] as const).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setExperienceLevel(lvl)}
                      className={`py-2 text-xs font-semibold rounded-xl capitalize transition-all cursor-pointer ${
                        experienceLevel === lvl
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="available-time-select" className="block text-xs font-medium text-slate-300">
                  Daily Commitment
                </label>
                <select
                  id="available-time-select"
                  value={availableTime}
                  onChange={e => setAvailableTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="15 mins / day">15 mins / day (Quick Drill)</option>
                  <option value="30 mins / day">30 mins / day (Standard Practice)</option>
                  <option value="60 mins / day">60 mins / day (Deep Immersion)</option>
                  <option value="Weekend Intensive">Weekend Intensive (Project-Based)</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                id="start-diagnostic-btn"
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-indigo-950/50 transition-all cursor-pointer"
              >
                <span>Launch Adaptive AI Diagnostic</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Key Modern Features & Architecture */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
              <Brain className="w-4 h-4 text-emerald-400" />
              <span>Real-Time AI & Pedagogical Engine</span>
            </h3>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white">Dynamic Real-World Incidents:</span>
                  <p className="text-slate-400 mt-0.5">
                    Generates novel production incidents, telemetry metrics, and architectural puzzles with Llama at runtime rather than repeating static questions.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-xl bg-indigo-950/80 border border-indigo-800/80 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white">Socratic Copilot with 4 AI Personas:</span>
                  <p className="text-slate-400 mt-0.5">
                    Switch between Socratic Mentor, Senior Tech Lead, Feynman Explainer, and Tough Examiner to debate, test edge cases, and clarify mental models.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-xl bg-purple-950/80 border border-purple-800/80 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                  <RotateCw className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white">Active-Recall Flashcards Arena:</span>
                  <p className="text-slate-400 mt-0.5">
                    Uses the SuperMemo SM-2 spaced repetition algorithm with AI-synthesized cards for high-yield active retrieval.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-xl bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white">100% Offline & Private:</span>
                  <p className="text-slate-400 mt-0.5">
                    Direct local execution on your machine with Ollama. Zero cloud subscriptions, zero telemetry, zero data egress.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
