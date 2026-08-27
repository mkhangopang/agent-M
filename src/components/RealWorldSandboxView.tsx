import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Zap,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  Terminal,
  Code2,
  Award,
  RefreshCw,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { BloomLevel, OllamaConfig, RealWorldSimulationCase } from '../types';
import { ollamaService } from '../lib/ollamaClient';

interface RealWorldSandboxViewProps {
  activeSubject?: string;
  ollamaConfig: OllamaConfig;
  onOpenAIChat?: (concept?: string) => void;
}

const PRESET_DOMAINS_BY_SUBJECT: Record<string, string[]> = {
  Biology: ['Cellular Respiration & Bioenergetics', 'CRISPR Gene Editing Kinetics', 'Population Ecology Cascades'],
  'Computer Science': ['Distributed Consensus & Raft Protocols', 'Memory Leak in High-Throughput Async Loop', 'Database Deadlocks & Isolation Levels'],
  Physics: ['Non-Linear Orbital Resonance & Perturbations', 'Thermodynamic Heat Engine Inefficiencies', 'Quantum Decoherence & Noise'],
  Mathematics: ['Stochastic Differential Modeling', 'Linear Matrix Eigenvalue Stability', 'Cryptographic Prime Lattice Vulnerability'],
  'AI & Data Science': ['Attention Mechanism Gradient Saturation', 'Covariate Shift in Real-Time Inference', 'Transformer KV-Cache Eviction Bottlenecks'],
  Chemistry: ['Le Chatelier Equilibrium Industrial Shift', 'Catalytic Reaction Rate Quenching', 'Electrochemical Battery Degradation'],
  Economics: ['Central Bank Liquidity Shock & Inflation', 'Automated Market Maker Slippage Cascade', 'Asymmetric Information Market Failure'],
  'English & Logic': ['Formal Fallacy in Epistemic Proofs', 'Rhetorical Deconstruction of Policy Discourse', 'Modal Logic Inconsistency'],
};

export const RealWorldSandboxView: React.FC<RealWorldSandboxViewProps> = ({
  activeSubject = 'Computer Science',
  ollamaConfig,
  onOpenAIChat,
}) => {
  const [selectedSubject, setSelectedSubject] = useState(activeSubject);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');
  const [isLoadingSimulation, setIsLoadingSimulation] = useState(false);
  const [activeSimulation, setActiveSimulation] = useState<RealWorldSimulationCase | null>(null);

  const [studentSolution, setStudentSolution] = useState('');
  const [isEvaluatingSolution, setIsEvaluatingSolution] = useState(false);
  const [solutionEvaluation, setSolutionEvaluation] = useState<{
    score: number;
    conceptualDepth: string;
    strengths: string[];
    missedEdgeCases: string[];
    remediationAdvice: string;
  } | null>(null);

  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});
  const [showExpertAnalysis, setShowExpertAnalysis] = useState(false);

  // Initialize domain list based on subject
  useEffect(() => {
    setSelectedSubject(activeSubject);
    const domains = PRESET_DOMAINS_BY_SUBJECT[activeSubject] || PRESET_DOMAINS_BY_SUBJECT['Computer Science'];
    setSelectedDomain(domains[0] || 'System Architecture');
  }, [activeSubject]);

  // Load initial simulation on mount
  useEffect(() => {
    handleGenerateNewCase();
  }, [selectedSubject]);

  const handleGenerateNewCase = async (overrideDomain?: string) => {
    setIsLoadingSimulation(true);
    setSolutionEvaluation(null);
    setStudentSolution('');
    setRevealedHints({});
    setShowExpertAnalysis(false);

    const domainToUse = overrideDomain || customDomainInput.trim() || selectedDomain || 'Core Domain Principles';

    try {
      const simCase = await ollamaService.generateDynamicSimulationCase(selectedSubject, domainToUse, difficulty);
      setActiveSimulation(simCase);
    } catch (e) {
      console.error('Failed to generate simulation case:', e);
    } finally {
      setIsLoadingSimulation(false);
    }
  };

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentSolution.trim() || !activeSimulation || isEvaluatingSolution) return;

    setIsEvaluatingSolution(true);

    try {
      const prompt = `Evaluate this student's solution to the real-world scenario:
Scenario Title: "${activeSimulation.title}"
Domain: "${activeSimulation.domain}"
Expected Criteria: ${JSON.stringify(activeSimulation.expectedCriteria)}
Student's Submitted Solution:
"${studentSolution}"

Evaluate thoroughly using engineering/scientific rigor. Return valid JSON only with keys:
{
  "score": (number 0-100),
  "conceptualDepth": "Thorough summary of the quality and depth of reasoning",
  "strengths": ["Strength 1", "Strength 2"],
  "missedEdgeCases": ["Overlooked nuance or edge-case 1", "Overlooked constraint 2"],
  "remediationAdvice": "Direct, actionable feedback to reach expert-level precision"
}`;

      const fallbackEvaluation = {
        score: studentSolution.length > 80 ? 82 : 65,
        conceptualDepth: `Your solution addressed the core mechanism in ${activeSimulation.domain} with structured logic.`,
        strengths: [
          'Correctly identified the primary operational invariant',
          'Proposed a viable mitigation path under standard conditions',
        ],
        missedEdgeCases: [
          'Ensure race conditions and high-concurrency boundaries are explicitly bounded',
          'Verify graceful degradation if dependent services/components fail',
        ],
        remediationAdvice: 'Incorporate idempotent execution semantics and defensive state validation.',
      };

      const result = await ollamaService.generateStructured<{
        score: number;
        conceptualDepth: string;
        strengths: string[];
        missedEdgeCases: string[];
        remediationAdvice: string;
      }>(
        'You are an expert industry technical auditor and pedagogical evaluator. Return valid JSON only.',
        prompt,
        {
          queryForVectorContext: `${activeSimulation.domain} solution`,
          subject: activeSimulation.subject,
          fallbackGenerator: () => fallbackEvaluation,
        }
      );

      setSolutionEvaluation(result.data);

      if (result.data.score >= 80) {
        try {
          confetti({
            particleCount: 40,
            spread: 50,
            origin: { y: 0.7 },
          });
        } catch {}
      }
    } catch (err) {
      console.error('Evaluation error:', err);
    } finally {
      setIsEvaluatingSolution(false);
    }
  };

  const currentPresetDomains = PRESET_DOMAINS_BY_SUBJECT[selectedSubject] || PRESET_DOMAINS_BY_SUBJECT['Computer Science'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800">
                Llama-Powered Real-World Arena
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-mono">
                {ollamaConfig.isReachable ? `Model: ${ollamaConfig.selectedModel}` : 'Offline Heuristic Engine'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Real-World Problem Solving Sandbox
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Tackle dynamic, production-grade incidents, architectural puzzles, and scientific case studies generated by local AI.
            </p>
          </div>

          {/* Subject & Difficulty Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Subject Selector */}
            <select
              value={selectedSubject}
              onChange={e => {
                setSelectedSubject(e.target.value);
                const domains = PRESET_DOMAINS_BY_SUBJECT[e.target.value] || [];
                setSelectedDomain(domains[0] || 'Core Principles');
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {Object.keys(PRESET_DOMAINS_BY_SUBJECT).map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Difficulty Selector */}
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value as any)}
              className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert / Staff</option>
            </select>

            {/* Generate Button */}
            <button
              id="generate-case-btn"
              onClick={() => handleGenerateNewCase()}
              disabled={isLoadingSimulation}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-950/50 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSimulation ? 'animate-spin' : ''}`} />
              <span>{isLoadingSimulation ? 'Synthesizing...' : 'New AI Case'}</span>
            </button>
          </div>
        </div>

        {/* Quick Domain Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Focus Domain:
          </span>
          {currentPresetDomains.map(d => (
            <button
              key={d}
              onClick={() => {
                setSelectedDomain(d);
                setCustomDomainInput('');
                handleGenerateNewCase(d);
              }}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap text-xs font-medium border transition-all cursor-pointer ${
                selectedDomain === d && !customDomainInput
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Main Simulation Case Card */}
      {isLoadingSimulation ? (
        <div className="p-16 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-950 text-indigo-400 border border-indigo-800 flex items-center justify-center mx-auto animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Synthesizing Real-World Incident Case...</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Llama is constructing realistic telemetry logs, domain invariants, architectural constraints, and scoring rubrics.
          </p>
        </div>
      ) : activeSimulation ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Scenario, Telemetry & Code */}
          <div className="lg:col-span-7 space-y-6">
            {/* Scenario Header */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-800">
                  {activeSimulation.difficulty} Simulation
                </span>
                <span className="text-xs text-indigo-400 font-semibold font-mono">
                  {activeSimulation.domain}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                {activeSimulation.title}
              </h2>

              {/* Industry Context */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                <strong className="text-indigo-300 block">Organization & System Context:</strong>
                <p>{activeSimulation.industryContext}</p>
              </div>

              {/* Problem Description */}
              <div className="space-y-2 text-xs sm:text-sm text-slate-200 leading-relaxed">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Incident / Anomaly Description</span>
                </h4>
                <p className="whitespace-pre-wrap text-slate-300">{activeSimulation.incidentOrProblem}</p>
              </div>

              {/* Telemetry / Starter Data or Code */}
              {activeSimulation.starterDataOrCode && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold uppercase tracking-wider flex items-center space-x-1.5 text-slate-300">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <span>Telemetry / Source Code Snippet</span>
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto">
                    <pre className="whitespace-pre">{activeSimulation.starterDataOrCode}</pre>
                  </div>
                </div>
              )}

              {/* System Constraints */}
              {activeSimulation.constraints?.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <span className="font-bold text-amber-400 uppercase tracking-wider block">
                    Operational Constraints & Boundaries:
                  </span>
                  <ul className="space-y-1 text-slate-300 list-disc list-inside">
                    {activeSimulation.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Scaffolding Hints */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4 text-indigo-400" />
                  <span>Progressive Scaffolding Hints</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {Object.values(revealedHints).filter(Boolean).length} / {activeSimulation.hints?.length || 0} Revealed
                </span>
              </div>

              <div className="space-y-2.5">
                {activeSimulation.hints?.map((hint, idx) => {
                  const isRevealed = revealedHints[idx];
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-300">
                          Hint {idx + 1}: {idx === 0 ? 'First Principles' : idx === 1 ? 'Edge-Case Check' : 'Architectural Plan'}
                        </span>
                        {!isRevealed && (
                          <button
                            onClick={() => setRevealedHints(prev => ({ ...prev, [idx]: true }))}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-medium transition-all cursor-pointer"
                          >
                            Reveal Hint
                          </button>
                        )}
                      </div>
                      {isRevealed && <p className="text-slate-300 leading-relaxed">{hint}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Student Solution Editor & Evaluation */}
          <div className="lg:col-span-5 space-y-6">
            {/* Solution Form Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4 sticky top-20">
              <div className="border-b border-slate-800 pb-3 space-y-1">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  <span>Your Analysis & Solution</span>
                </h3>
                <p className="text-xs text-slate-400">{activeSimulation.actionPrompt}</p>
              </div>

              <form onSubmit={handleSubmitSolution} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="solution-input" className="text-xs font-bold uppercase text-slate-300 block">
                    Diagnostic Analysis / Proposed Architecture
                  </label>
                  <textarea
                    id="solution-input"
                    rows={8}
                    value={studentSolution}
                    onChange={e => setStudentSolution(e.target.value)}
                    placeholder="Write your root-cause diagnosis, mathematical derivation, or refactored code solution here..."
                    required
                    className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenAIChat?.(activeSimulation.domain)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Discuss with Llama Copilot</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    id="submit-solution-btn"
                    type="submit"
                    disabled={!studentSolution.trim() || isEvaluatingSolution}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-md shadow-indigo-950/50 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isEvaluatingSolution ? 'Auditing Solution...' : 'Submit for AI Audit'}</span>
                  </button>
                </div>
              </form>

              {/* Evaluation Results Box */}
              {solutionEvaluation && (
                <div className="pt-4 border-t border-slate-800 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-400">AI Evaluation Report</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                        solutionEvaluation.score >= 80
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {solutionEvaluation.score} / 100 Score
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                    {solutionEvaluation.conceptualDepth}
                  </p>

                  {/* Strengths */}
                  {solutionEvaluation.strengths?.length > 0 && (
                    <div className="space-y-1 text-xs">
                      <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Key Strengths:</span>
                      </span>
                      <ul className="list-disc list-inside text-slate-300 pl-2 space-y-0.5">
                        {solutionEvaluation.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Missed Nuances / Edge Cases */}
                  {solutionEvaluation.missedEdgeCases?.length > 0 && (
                    <div className="space-y-1 text-xs">
                      <span className="text-amber-400 font-semibold flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Missed Nuances / Edge Cases:</span>
                      </span>
                      <ul className="list-disc list-inside text-slate-300 pl-2 space-y-0.5">
                        {solutionEvaluation.missedEdgeCases.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actionable Advice */}
                  <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-800/80 text-xs text-indigo-200">
                    <strong>Remediation:</strong> {solutionEvaluation.remediationAdvice}
                  </div>

                  {/* Reveal Expert Reference Model */}
                  {activeSimulation.expertAnalysis && (
                    <div className="pt-2">
                      <button
                        onClick={() => setShowExpertAnalysis(!showExpertAnalysis)}
                        className="w-full py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                      >
                        {showExpertAnalysis ? 'Hide Expert Solution Breakdown' : 'View Expert Solution Breakdown'}
                      </button>

                      {showExpertAnalysis && (
                        <div className="mt-3 p-4 rounded-2xl bg-slate-950 border border-indigo-900 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                          <strong className="text-emerald-400 block mb-1">Staff Expert Reference Model:</strong>
                          {activeSimulation.expertAnalysis}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
