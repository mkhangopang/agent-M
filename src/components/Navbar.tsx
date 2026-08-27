import React, { useState } from 'react';
import {
  Brain,
  Database,
  Settings,
  BookOpen,
  User,
  Users,
  Plus,
  Activity,
  Layers,
  Zap,
  RotateCw,
  MessageSquare,
  Sparkles,
  Server,
  ChevronDown,
} from 'lucide-react';
import { BackendConfig, OllamaConfig } from '../types';
import { LearnerRegistryItem } from '../lib/storage';

export type AppTab =
  | 'home'
  | 'diagnostic'
  | 'report'
  | 'dashboard'
  | 'sandbox'
  | 'flashcards'
  | 'vectorDb'
  | 'profile'
  | 'settings'
  | 'pythonBundle';

interface NavbarProps {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  ollamaConfig: OllamaConfig;
  backendConfig: BackendConfig;
  activeSubject?: string;
  activeLearner?: LearnerRegistryItem;
  learners: LearnerRegistryItem[];
  onSwitchLearner: (learnerId: string) => void;
  onOpenNewLearner: () => void;
  onOpenOnboarding: () => void;
  hasActiveDiagnostic: boolean;
  vectorCount: number;
  onToggleAIChat: () => void;
  isAIChatOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  ollamaConfig,
  backendConfig,
  activeSubject,
  activeLearner,
  learners,
  onSwitchLearner,
  onOpenNewLearner,
  onOpenOnboarding,
  hasActiveDiagnostic,
  vectorCount,
  onToggleAIChat,
  isAIChatOpen,
}) => {
  const [isLearnerMenuOpen, setIsLearnerMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div
            id="nav-brand-logo"
            onClick={() => setCurrentTab('home')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-lg text-white tracking-tight">PLIA</span>
                <span className="text-[10px] font-bold text-indigo-400 px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded">
                  OFFLINE AGENT
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Personalized Learning Intelligence Agent
              </p>
            </div>
          </div>

          {/* Active Status Badges */}
          <div className="hidden xl:flex items-center space-x-2.5">
            {/* Ollama Status Pill */}
            <div
              onClick={() => setCurrentTab('settings')}
              className="cursor-pointer flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-full border border-slate-800 hover:border-slate-700 transition-all text-xs font-medium"
              title="Click to configure Ollama endpoint and model"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  ollamaConfig.mockMode
                    ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                    : ollamaConfig.isReachable
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-slate-300">
                {ollamaConfig.mockMode
                  ? 'Mock Engine'
                  : ollamaConfig.isReachable
                  ? `Ollama: ${ollamaConfig.selectedModel}`
                  : 'Ollama: Offline'}
              </span>
            </div>

            {/* Local DB Status Pill */}
            <div
              onClick={() => setCurrentTab('pythonBundle')}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-full border border-slate-800 hover:border-slate-700 transition-all text-xs font-medium text-slate-300"
              title="Local SQLite & FastAPI status"
            >
              <Server className={`w-3 h-3 ${backendConfig.isConnected ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{backendConfig.isConnected ? 'Local DB: Connected' : 'Local DB: Offline'}</span>
            </div>

            {/* Vector Database Pill */}
            <div
              onClick={() => setCurrentTab('vectorDb')}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-full border border-slate-800 hover:border-slate-700 transition-all text-xs font-medium text-slate-300"
              title="Local Vector Database & RAG index"
            >
              <Database className="w-3 h-3 text-indigo-400" />
              <span>Vectors: {vectorCount}</span>
            </div>

            {/* Quick Setup Modal Button */}
            <button
              onClick={onOpenOnboarding}
              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-full text-xs font-medium text-indigo-300 transition-colors"
              title="Open Guided Setup Wizard"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Setup</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5">
            <button
              id="nav-btn-home"
              onClick={() => setCurrentTab('home')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'home'
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              Intake
            </button>

            <button
              id="nav-btn-diagnostic"
              onClick={() => setCurrentTab('diagnostic')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                currentTab === 'diagnostic'
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <span className="flex items-center space-x-1">
                <Activity className="w-3.5 h-3.5 inline sm:mr-0.5" />
                <span>Diagnostic</span>
              </span>
              {hasActiveDiagnostic && currentTab !== 'diagnostic' && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
              )}
            </button>

            <button
              id="nav-btn-dashboard"
              onClick={() => setCurrentTab('dashboard')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <span className="flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 inline sm:mr-0.5" />
                <span>Pathway</span>
              </span>
            </button>

            {/* Real-World Sandbox Navigation Tab */}
            <button
              id="nav-btn-sandbox"
              onClick={() => setCurrentTab('sandbox')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 ${
                currentTab === 'sandbox'
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 font-semibold'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-800/40'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real-World Solver</span>
            </button>

            {/* Flashcards Navigation Tab */}
            <button
              id="nav-btn-flashcards"
              onClick={() => setCurrentTab('flashcards')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hidden md:flex items-center space-x-1 ${
                currentTab === 'flashcards'
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Flashcards</span>
            </button>

            {/* AI Copilot Toggle Button */}
            <button
              id="nav-btn-ai-copilot"
              onClick={onToggleAIChat}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md cursor-pointer ${
                isAIChatOpen
                  ? 'bg-indigo-500 text-white ring-2 ring-indigo-400'
                  : 'bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/80 text-indigo-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden md:inline">AI Copilot</span>
            </button>

            <button
              id="nav-btn-profile"
              onClick={() => setCurrentTab('profile')}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all hidden sm:flex items-center space-x-1 ${
                currentTab === 'profile' || currentTab === 'report'
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <User className="w-3.5 h-3.5" />
            </button>

            <button
              id="nav-btn-settings"
              onClick={() => setCurrentTab('settings')}
              className={`p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all ${
                currentTab === 'settings' ? 'bg-slate-800 text-white border border-slate-700' : ''
              }`}
              title="Settings & Diagnostics"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Multi-Learner Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLearnerMenuOpen(!isLearnerMenuOpen)}
                className="flex items-center space-x-1.5 pl-2 pr-2.5 py-1 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-full text-xs font-medium text-slate-200 transition-colors"
                title="Switch Active Learner"
              >
                <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                  {(activeLearner?.name || 'L').slice(0, 1).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[90px] truncate">{activeLearner?.name || 'Learner'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isLearnerMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 text-xs">
                  <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1 flex items-center justify-between">
                    <span>Learners</span>
                    <span className="text-[10px] text-indigo-400">{learners.length} active</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {learners.map(l => (
                      <button
                        key={l.learnerId}
                        onClick={() => {
                          onSwitchLearner(l.learnerId);
                          setIsLearnerMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                          l.learnerId === activeLearner?.learnerId
                            ? 'bg-indigo-600 text-white font-medium'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="truncate">
                          <p className="truncate font-medium">{l.name}</p>
                          <p className={`text-[10px] ${l.learnerId === activeLearner?.learnerId ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {l.subject}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-800 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setIsLearnerMenuOpen(false);
                        onOpenNewLearner();
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left text-indigo-300 hover:bg-indigo-500/10 flex items-center gap-1.5 font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Learner</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};
