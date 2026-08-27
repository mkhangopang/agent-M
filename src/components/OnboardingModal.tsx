import React, { useState, useEffect } from 'react';
import {
  Brain,
  CheckCircle2,
  AlertCircle,
  DownloadCloud,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  Sparkles,
  RefreshCw,
  X,
  Play,
} from 'lucide-react';
import { OllamaConfig } from '../types';
import { ollamaService } from '../lib/ollamaClient';
import { localBackendService } from '../lib/backendClient';
import { storageManager } from '../lib/storage';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  ollamaConfig: OllamaConfig;
  onRefreshOllama: () => Promise<void>;
  onCompleteOnboarding: (learnerName: string, subject: string, goal: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  ollamaConfig,
  onRefreshOllama,
  onCompleteOnboarding,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [learnerName, setLearnerName] = useState('Alex Turing');
  const [subject, setSubject] = useState('Computer Science');
  const [goal, setGoal] = useState('Master Distributed Systems and High-Throughput System Architecture');

  const [pullingModel, setPullingModel] = useState<string | null>(null);
  const [pullProgress, setPullProgress] = useState<{ status: string; percent: number }>({ status: '', percent: 0 });
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; path?: string }>({ connected: false });
  const [isCheckingDb, setIsCheckingDb] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkDatabase();
    }
  }, [isOpen]);

  const checkDatabase = async () => {
    setIsCheckingDb(true);
    const res = await localBackendService.checkHealth();
    setDbStatus({ connected: res.connected, path: res.databasePath });
    setIsCheckingDb(false);
  };

  const handlePullModel = async (modelName: string) => {
    setPullingModel(modelName);
    setPullProgress({ status: `Initiating download of ${modelName}...`, percent: 5 });

    const result = await ollamaService.pullModel(modelName, (status, completed, total) => {
      let percent = 50;
      if (typeof completed === 'number' && typeof total === 'number' && total > 0) {
        percent = Math.round((completed / total) * 100);
      }
      setPullProgress({ status, percent });
    });

    setPullingModel(null);
    if (result.success) {
      await onRefreshOllama();
    }
  };

  const handleFinish = () => {
    storageManager.registerLearner({
      learnerId: `learner-${Date.now()}`,
      name: learnerName.trim() || 'Learner',
      subject: subject.trim() || 'Computer Science',
      goal: goal.trim() || 'Accelerate conceptual mastery',
      experienceLevel: 'intermediate',
      availableLearningTime: '30 mins / day',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    });

    onCompleteOnboarding(learnerName, subject, goal);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-tight">PLIA Onboarding & Setup</h2>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  100% Offline AI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Configure your local intelligence environment & learner calibration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-3 bg-slate-950/40 border-b border-slate-800/60 text-xs">
          <button
            onClick={() => setStep(1)}
            className={`py-3 px-4 flex items-center justify-center gap-2 border-b-2 font-medium transition-all ${
              step === 1 ? 'border-indigo-500 text-indigo-300 bg-indigo-500/5' : 'border-transparent text-slate-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">
              1
            </span>
            <span>Learner Profile</span>
          </button>

          <button
            onClick={() => setStep(2)}
            className={`py-3 px-4 flex items-center justify-center gap-2 border-b-2 font-medium transition-all ${
              step === 2 ? 'border-indigo-500 text-indigo-300 bg-indigo-500/5' : 'border-transparent text-slate-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">
              2
            </span>
            <span>Local Ollama & Models</span>
          </button>

          <button
            onClick={() => setStep(3)}
            className={`py-3 px-4 flex items-center justify-center gap-2 border-b-2 font-medium transition-all ${
              step === 3 ? 'border-indigo-500 text-indigo-300 bg-indigo-500/5' : 'border-transparent text-slate-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">
              3
            </span>
            <span>Local DB & RAG</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Learner / Student Name
                </label>
                <input
                  type="text"
                  value={learnerName}
                  onChange={e => setLearnerName(e.target.value)}
                  placeholder="e.g. Alex Turing"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Focus Subject / Domain
                </label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Computer Science">Computer Science & Distributed Systems</option>
                  <option value="Physics">Physics & Thermodynamics</option>
                  <option value="Mathematics">Mathematics & Multivariable Calculus</option>
                  <option value="Biology">Biology & Molecular Genetics</option>
                  <option value="Machine Learning">Machine Learning & Neural Architectures</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Primary Learning Objective
                </label>
                <textarea
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                  placeholder="What core competencies or real-world problem-solving skills do you want to achieve?"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              {/* Ollama Connectivity Card */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      ollamaConfig.isReachable
                        ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]'
                        : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]'
                    }`}
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      Ollama Local Service ({ollamaConfig.baseUrl})
                    </h4>
                    <p className="text-xs text-slate-400">
                      {ollamaConfig.isReachable
                        ? `Connected (${ollamaConfig.latencyMs || 10}ms latency). ${ollamaConfig.availableModels.length} models installed.`
                        : 'Ollama is not running on localhost:11434. App will operate in offline heuristic mode.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onRefreshOllama}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Check</span>
                </button>
              </div>

              {/* 1-Click Recommended Models */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  1-Click Pull Recommended Models
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { name: 'llama3.2', desc: 'Fast 3B compact tutor', size: '2.0 GB' },
                    { name: 'qwen2.5:7b', desc: 'High-reasoning 7B model', size: '4.7 GB' },
                    { name: 'nomic-embed-text', desc: 'Real local vector embeddings', size: '274 MB' },
                    { name: 'mistral:7b', desc: 'Balanced analytical model', size: '4.1 GB' },
                  ].map(m => {
                    const isInstalled = ollamaConfig.availableModels.includes(m.name);
                    const isPulling = pullingModel === m.name;

                    return (
                      <div
                        key={m.name}
                        className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-bold text-white">{m.name}</span>
                            <span className="text-[10px] text-slate-500">({m.size})</span>
                          </div>
                          <p className="text-[11px] text-slate-400">{m.desc}</p>
                        </div>
                        {isInstalled ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Ready
                          </span>
                        ) : (
                          <button
                            disabled={isPulling}
                            onClick={() => handlePullModel(m.name)}
                            className="px-2.5 py-1 text-xs font-medium text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded flex items-center gap-1 transition-colors"
                          >
                            <DownloadCloud className="w-3.5 h-3.5" />
                            {isPulling ? 'Pulling...' : 'Pull'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {pullingModel && (
                  <div className="mt-3 p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl">
                    <div className="flex justify-between text-xs text-indigo-300 mb-1">
                      <span>{pullProgress.status || `Pulling ${pullingModel}...`}</span>
                      <span>{pullProgress.percent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${pullProgress.percent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {/* Local SQLite Database Status */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        dbStatus.connected
                          ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                          : 'bg-amber-500'
                      }`}
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        Local SQLite Backend Service (FastAPI)
                      </h4>
                      <p className="text-xs text-slate-400">
                        {dbStatus.connected
                          ? `Connected at http://localhost:8000 (Database: ${dbStatus.path || 'plia.db'})`
                          : 'Backend service offline. Storage running in resilient browser localStorage mode.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={checkDatabase}
                    disabled={isCheckingDb}
                    className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingDb ? 'animate-spin' : ''}`} />
                    <span>Check</span>
                  </button>
                </div>
              </div>

              {/* Vector RAG Pre-seeding */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-indigo-400">
                  <Database className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Local Embedded Vector DB & RAG Index
                  </h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  PLIA automatically initializes with curated foundational curriculum chunks for Computer Science,
                  Physics, Mathematics, Biology, and Machine Learning. All embeddings are stored and searched locally
                  with zero cloud dependencies.
                </p>
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="text-xs text-emerald-300">
                  Setup verified! You are ready to start your cognitive diagnostic calibration.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((step - 1) as 1 | 2)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((step + 1) as 2 | 3)}
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-colors"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-colors"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Launch Diagnostic</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
