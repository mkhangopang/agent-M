import React from 'react';
import {
  Brain,
  Award,
  BarChart3,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Target,
  Sliders,
  Download,
  RotateCcw,
} from 'lucide-react';
import { BloomLevel, LearnerProfile } from '../types';
import { COGNITIVE_STAGES } from '../lib/pedagogyEngine';

interface DiagnosticReportViewProps {
  profile: LearnerProfile;
  onStartLearningPath: () => void;
  onRetakeDiagnostic: () => void;
  onExportJson: () => void;
}

const BLOOM_LABELS: { key: BloomLevel; label: string; desc: string }[] = [
  { key: 'remember', label: '1. Remember', desc: 'Retrieve factual definitions and formulas' },
  { key: 'understand', label: '2. Understand', desc: 'Explain concepts, mechanisms, and relationships' },
  { key: 'apply', label: '3. Apply', desc: 'Execute solutions in concrete, familiar scenarios' },
  { key: 'analyze', label: '4. Analyze', desc: 'Deconstruct systems, detect patterns, diagnose errors' },
  { key: 'evaluate', label: '5. Evaluate', desc: 'Judge tradeoffs, critique evidence, test validity' },
  { key: 'create', label: '6. Create', desc: 'Synthesize original models, architectures, or frameworks' },
];

export const DiagnosticReportView: React.FC<DiagnosticReportViewProps> = ({
  profile,
  onStartLearningPath,
  onRetakeDiagnostic,
  onExportJson,
}) => {
  const stageInfo = COGNITIVE_STAGES[profile.learningStage] || COGNITIVE_STAGES[1];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner & Title */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Diagnostic Complete • Version {profile.profileVersion}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">{profile.subject}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Your Personalized Learning Profile
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Learner: <strong className="text-slate-200">{profile.name || 'Anonymous Learner'}</strong> | Goal: {profile.goal}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onExportJson}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center space-x-1.5 transition-all"
              title="Export profile JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={onRetakeDiagnostic}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center space-x-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Re-diagnose</span>
            </button>
          </div>
        </div>

        {/* Cognitive Stage Highlight Box */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-emerald-950/60 border border-indigo-700/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                Demonstrated Cognitive Learning Stage
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                Stage {profile.learningStage}: {stageInfo.name}
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-900/80 text-indigo-200 border border-indigo-600/60">
                Confidence: {profile.stageConfidence.toUpperCase()}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                {stageInfo.typicalBloomRange}
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            {stageInfo.shortDescription}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-indigo-800/40">
            {stageInfo.characteristics.map((char, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                <span className="text-emerald-400 font-bold">•</span>
                <span>{char}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer Note */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p>
            <strong>Important Educational Distinction:</strong> This Cognitive Learning Stage is an instructional estimate based on observed task performance in this session. It does NOT represent IQ, neurological age, or clinical psychological traits.
          </p>
        </div>
      </div>

      {/* Main Grid: Bloom Taxonomy vs Subject Mastery & Metacognition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Bloom's Revised Taxonomy Profile */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>Bloom&apos;s Revised Taxonomy Profile</span>
            </h3>
            <span className="text-xs text-slate-400">0–100 Demonstrated Scale</span>
          </div>

          <div className="space-y-4">
            {BLOOM_LABELS.map(item => {
              const scoreObj = profile.bloom[item.key];
              const score = scoreObj?.score || 50;
              const evidence = scoreObj?.evidenceCount || 0;
              const confidence = scoreObj?.confidence || 'low';

              return (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-200">{item.label}</span>
                      <span className="text-slate-500 text-[11px] ml-2 hidden sm:inline">({item.desc})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-slate-400">
                        {evidence} obs ({confidence} conf)
                      </span>
                      <span className="font-mono font-bold text-slate-200">{score}%</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        score >= 80
                          ? 'bg-emerald-500'
                          : score >= 65
                          ? 'bg-indigo-500'
                          : score >= 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subject Mastery Breakdown */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>Subject Mastery Domains (Separate from Cognitive Stage)</span>
              </h4>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                Overall: {profile.subjectMastery.overallMastery}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.values(profile.subjectMastery.domains) as import('../types').SubjectMasteryDomain[]).map(dom => (
                <div key={dom.domain} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-200">{dom.domain}</span>
                    <span className="font-mono text-emerald-400 font-bold">{dom.mastery}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${dom.mastery}%` }} />
                  </div>
                  {dom.gaps && dom.gaps.length > 0 && (
                    <p className="text-[10px] text-amber-400/90 truncate">Gaps: {dom.gaps.join(', ')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Metacognition, Misconceptions, & Knowledge Gaps */}
        <div className="lg:col-span-5 space-y-6">
          {/* Metacognitive Profile & Confidence Calibration */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Metacognition & Calibration</span>
            </h3>

            {/* Calibration Status Badge */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Confidence Calibration:</span>
                <strong className="text-white capitalize text-sm">
                  {profile.confidenceCalibration.replace(/_/g, ' ')}
                </strong>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                  profile.confidenceCalibration === 'well_calibrated'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : profile.confidenceCalibration === 'overconfident'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                {profile.calibrationScore > 0 ? `+${profile.calibrationScore}` : profile.calibrationScore} pts delta
              </span>
            </div>

            {/* Metacognitive Scores */}
            <div className="space-y-2.5 text-xs">
              {[
                { label: 'Planning & Goal Decomposition', val: profile.metacognition.planning },
                { label: 'Real-time Self-Monitoring', val: profile.metacognition.monitoring },
                { label: 'Formative Reflection', val: profile.metacognition.reflection },
                { label: 'Error Recognition', val: profile.metacognition.errorRecognition },
                { label: 'Strategy Selection', val: profile.metacognition.strategySelection },
              ].map(m => (
                <div key={m.label} className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-300">{m.label}</span>
                  <span className="font-mono font-bold text-emerald-400">{m.val}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Misconceptions & Gaps */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Diagnosed Gaps & Misconceptions</span>
            </h3>

            {profile.misconceptions.length > 0 ? (
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase text-rose-400">Misconceptions Identified:</span>
                {profile.misconceptions.map((misc, idx) => (
                  <div key={misc.id || idx} className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/60 text-xs space-y-1">
                    <span className="font-bold text-rose-300">{misc.concept}</span>
                    <p className="text-slate-300 text-[11px]">
                      <strong>Observed:</strong> {misc.learnerBelief}
                    </p>
                    <p className="text-emerald-300 text-[11px]">
                      <strong>Target Model:</strong> {misc.expectedConcept}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-xs text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>No severe conceptual misconceptions detected in current baseline.</span>
              </div>
            )}

            {/* Knowledge Gaps */}
            {profile.knowledgeGaps.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold uppercase text-amber-400">Prerequisite Gaps:</span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-xs">
                  {profile.knowledgeGaps.map((gap, idx) => (
                    <div key={gap.id || idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                      <div className="flex items-center justify-between font-semibold text-amber-300 text-[11px]">
                        <span>{gap.domain} • {gap.category}</span>
                        <span className="text-[10px] uppercase font-bold text-rose-400">{gap.priority}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{gap.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Strategy & CTA */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-emerald-950 border border-indigo-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-300">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Recommended Instructional Strategy</span>
          </div>
          <h3 className="text-lg font-bold text-white">
            Personalized Mastery Learning Pathway Ready
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {profile.recommendedStrategy}
          </p>
        </div>

        <button
          id="start-learning-path-btn"
          onClick={onStartLearningPath}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-sm sm:text-base flex items-center justify-center space-x-2 shadow-xl shadow-indigo-950/60 transition-all hover:scale-105"
        >
          <span>Launch Learning Pathway</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
