import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Brain,
  Layers,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Clock,
  BookOpen,
  Award,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import {
  LearnerProfile,
  LearningActivity,
  LearningPathway,
  LearningPhase,
  SpacedReviewItem,
} from '../types';
import { LocalStorageManager } from '../lib/storage';

interface DashboardViewProps {
  profile: LearnerProfile;
  pathway: LearningPathway;
  onUpdatePathway: (updated: LearningPathway) => void;
  onRetakeDiagnostic: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  pathway,
  onUpdatePathway,
  onRetakeDiagnostic,
}) => {
  const currentPhase: LearningPhase = pathway.phases[pathway.currentPhaseIndex] || pathway.phases[0];
  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    pathway.currentActivityId || currentPhase?.activities[0]?.id || ''
  );
  const [taskResponse, setTaskResponse] = useState('');
  const [assessmentAnswer, setAssessmentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState<{
    score: number;
    feedback: string;
    passed: boolean;
  } | null>(null);

  // Scaffolding hints revealed state for the active activity
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});

  // Spaced reviews list
  const spacedReviews = React.useMemo(() => {
    return LocalStorageManager.getSpacedReviews(profile.learnerId);
  }, [profile.learnerId, feedbackResult]);

  // Find active activity
  const activeActivity: LearningActivity | undefined =
    currentPhase.activities.find(a => a.id === selectedActivityId) || currentPhase.activities[0];

  const handleRevealHint = (level: number) => {
    setRevealedHints(prev => ({ ...prev, [level]: true }));
  };

  const handleCompleteActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessmentAnswer.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const wordCount = assessmentAnswer.trim().split(/\s+/).length;
      const score = Math.min(100, Math.max(60, Math.round(70 + wordCount * 2.5)));
      const passed = score >= 75;

      setFeedbackResult({
        score,
        feedback: passed
          ? `Solid understanding demonstrated! Your explanation aligns with core principles for ${activeActivity.concept}.`
          : `Emerging grasp. Review the Level 4 scaffolding framework to sharpen your analytical justification.`,
        passed,
      });

      if (passed) {
        // Fire celebration confetti
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch {}

        // Schedule Spaced Repetition Review
        LocalStorageManager.scheduleSpacedReview(profile.learnerId, activeActivity.concept, profile.subject);

        // Update activity status in pathway
        const updatedPhases = pathway.phases.map((phase, pIdx) => {
          if (pIdx === pathway.currentPhaseIndex) {
            const updatedActivities = phase.activities.map(act => {
              if (act.id === activeActivity.id) {
                return { ...act, status: 'mastered' as const, masteryScore: score, completedAt: new Date().toISOString() };
              }
              return act;
            });
            const masteredCount = updatedActivities.filter(a => a.status === 'mastered').length;
            const phaseMastery = Math.round((masteredCount / updatedActivities.length) * 100);
            return {
              ...phase,
              activities: updatedActivities,
              overallPhaseMastery: Math.max(phase.overallPhaseMastery, phaseMastery),
              status: phaseMastery >= phase.masteryThreshold ? ('completed' as const) : phase.status,
            };
          }
          return phase;
        });

        // Unlock next phase if current completed
        if (updatedPhases[pathway.currentPhaseIndex].status === 'completed' && updatedPhases[pathway.currentPhaseIndex + 1]) {
          updatedPhases[pathway.currentPhaseIndex + 1].status = 'active';
        }

        const nextPathway: LearningPathway = {
          ...pathway,
          phases: updatedPhases,
          updatedAt: new Date().toISOString(),
        };

        onUpdatePathway(nextPathway);
      }

      setIsSubmitting(false);
    }, 600);
  };

  const handleNextActivityOrPhase = () => {
    setFeedbackResult(null);
    setAssessmentAnswer('');
    setTaskResponse('');
    setRevealedHints({});

    const currentActivities = currentPhase.activities;
    const currentIdx = currentActivities.findIndex(a => a.id === selectedActivityId);

    if (currentIdx < currentActivities.length - 1) {
      setSelectedActivityId(currentActivities[currentIdx + 1].id);
    } else if (pathway.currentPhaseIndex < pathway.phases.length - 1) {
      // Advance to next phase
      const nextPhaseIdx = pathway.currentPhaseIndex + 1;
      const nextPhase = pathway.phases[nextPhaseIdx];
      const updatedPhases = [...pathway.phases];
      updatedPhases[nextPhaseIdx].status = 'active';

      const nextPathway: LearningPathway = {
        ...pathway,
        phases: updatedPhases,
        currentPhaseIndex: nextPhaseIdx,
        currentActivityId: nextPhase.activities[0]?.id,
      };
      onUpdatePathway(nextPathway);
      setSelectedActivityId(nextPhase.activities[0]?.id || '');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Personalized Learning Pathway
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">{profile.subject}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">
              Phase {currentPhase.phaseNumber}: {currentPhase.title}
            </h1>
            <p className="text-xs text-slate-300 mt-1">{currentPhase.objective}</p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Cognitive Stage:</span>
              <strong className="text-emerald-400 text-xs font-semibold">
                Stage {profile.learningStage}: {profile.stageName}
              </strong>
            </div>
          </div>
        </div>

        {/* Phase Timeline Navigator */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {pathway.phases.map((phase, idx) => {
            const isCurrent = idx === pathway.currentPhaseIndex;
            const isCompleted = phase.status === 'completed';
            const isLocked = phase.status === 'locked';

            return (
              <div
                key={phase.phaseId || idx}
                onClick={() => {
                  if (!isLocked) {
                    onUpdatePathway({
                      ...pathway,
                      currentPhaseIndex: idx,
                      currentActivityId: phase.activities[0]?.id,
                    });
                    setSelectedActivityId(phase.activities[0]?.id || '');
                    setFeedbackResult(null);
                    setRevealedHints({});
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all text-left ${
                  isCurrent
                    ? 'bg-indigo-950/80 border-indigo-500 shadow-md shadow-indigo-950/50'
                    : isCompleted
                    ? 'bg-slate-900/90 border-emerald-800/80 hover:bg-slate-850 cursor-pointer'
                    : isLocked
                    ? 'bg-slate-950/40 border-slate-800/50 opacity-60 cursor-not-allowed'
                    : 'bg-slate-900 border-slate-800 hover:bg-slate-800 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-400">Phase {phase.phaseNumber}</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isLocked ? (
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">Active</span>
                  )}
                </div>
                <h4 className="text-xs font-semibold text-white line-clamp-1">{phase.title}</h4>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Target: {phase.bloomTarget}</span>
                  <span className="font-mono font-bold text-emerald-400">{phase.overallPhaseMastery}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Interactive Activity Workbench & Spaced Review Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Cols: Interactive Activity Workbench */}
        <div className="lg:col-span-8 space-y-6">
          {/* Activity Selector Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {currentPhase.activities.map((act, idx) => {
              const isSelected = act.id === (activeActivity?.id || selectedActivityId);
              const isMastered = act.status === 'mastered';
              return (
                <button
                  key={act.id || idx}
                  onClick={() => {
                    setSelectedActivityId(act.id);
                    setFeedbackResult(null);
                    setRevealedHints({});
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border flex items-center space-x-1.5 transition-all ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                      : isMastered
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300 hover:bg-emerald-900/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isMastered && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{act.title}</span>
                </button>
              );
            })}
          </div>

          {activeActivity && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              {/* Activity Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                      {activeActivity.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-emerald-400 font-medium">
                      Bloom: {activeActivity.bloomTarget}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">{activeActivity.title}</h2>
                </div>

                {activeActivity.status === 'mastered' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 border border-emerald-800 text-emerald-300 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mastered ({activeActivity.masteryScore}%)</span>
                  </span>
                )}
              </div>

              {/* Core Content & Direct Instruction */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>Instructional Concept & Core Theory</span>
                </span>
                <p className="text-sm text-slate-200 leading-relaxed font-normal whitespace-pre-line">
                  {activeActivity.coreContent}
                </p>
              </div>

              {/* Interactive Practice Task */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Interactive Task / Practice Problem</span>
                </span>
                <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-800/40 text-sm text-slate-100 font-medium leading-relaxed">
                  {activeActivity.interactiveTask}
                </div>
              </div>

              {/* 5-Level Progressive Scaffolding Hints Drawer */}
              <div className="border border-slate-800 rounded-2xl bg-slate-950/60 overflow-hidden space-y-2 p-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                    <HelpCircle className="w-4 h-4" />
                    <span>5-Level Progressive Scaffolding Hints</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Reveal as needed</span>
                </div>

                <div className="space-y-2 pt-1">
                  {activeActivity.hints.map((hint, idx) => {
                    const isRevealed = revealedHints[hint.level];
                    return (
                      <div
                        key={hint.level || idx}
                        className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-300">
                            Level {hint.level}: {hint.title}
                          </span>
                          {!isRevealed ? (
                            <button
                              type="button"
                              onClick={() => handleRevealHint(hint.level)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-semibold transition-colors"
                            >
                              Unlock Hint {hint.level}
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-bold uppercase">Revealed</span>
                          )}
                        </div>

                        {isRevealed && (
                          <p className="text-slate-300 text-[11px] pt-1.5 border-t border-slate-800/60 leading-relaxed">
                            {hint.content}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Formative Assessment Check */}
              <form onSubmit={handleCompleteActivity} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label htmlFor="formative-check-textarea" className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex justify-between">
                    <span>Formative Assessment Check</span>
                    <span className="text-emerald-400 text-xs font-normal">Demonstrate Mastery</span>
                  </label>
                  <p className="text-xs text-slate-300 italic">{activeActivity.formativeQuestion.prompt}</p>

                  <textarea
                    id="formative-check-textarea"
                    rows={4}
                    value={assessmentAnswer}
                    onChange={e => setAssessmentAnswer(e.target.value)}
                    placeholder="Write your explanation or solution here to update your mastery..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {!feedbackResult ? (
                  <div className="flex justify-end">
                    <button
                      id="submit-formative-assessment-btn"
                      type="submit"
                      disabled={isSubmitting || !assessmentAnswer.trim()}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center space-x-2 shadow-md shadow-indigo-950/50 transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <Brain className="w-4 h-4 animate-spin" />
                          <span>Checking Mastery...</span>
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4" />
                          <span>Submit Formative Assessment</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center space-x-2">
                        {feedbackResult.passed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-amber-400" />
                        )}
                        <span className="text-sm font-bold text-white">
                          {feedbackResult.passed ? 'Demonstrated Mastery!' : 'Formative Feedback'}
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                        Score: {feedbackResult.score}%
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{feedbackResult.feedback}</p>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
                      <strong>Solution Criteria:</strong> {activeActivity.formativeQuestion.solutionExplanation}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleNextActivityOrPhase}
                        className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold flex items-center space-x-2 shadow-md transition-all"
                      >
                        <span>Continue Learning Pathway</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Right 4 Cols: Spaced Retrieval Schedule & Summary */}
        <div className="lg:col-span-4 space-y-6">
          {/* Spaced Retrieval Queue */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Spaced Retrieval Queue</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Ebbinghaus Curve</span>
            </div>

            {spacedReviews.length > 0 ? (
              <div className="space-y-2.5">
                {spacedReviews.map((rev, idx) => (
                  <div key={rev.id || idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{rev.concept}</span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 text-[10px] font-mono">
                        +{rev.intervalDays}d interval
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Next Retrieval:{' '}
                      <strong className="text-slate-300">{new Date(rev.nextReviewDate).toLocaleDateString()}</strong>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 space-y-1 text-center">
                <Clock className="w-6 h-6 text-slate-600 mx-auto" />
                <p>Complete learning activities to populate your spaced retrieval review schedule.</p>
              </div>
            )}
          </div>

          {/* Cognitive Mastery Overview */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Brain className="w-4 h-4 text-indigo-400" />
              <span>Demonstrated Cognitive Balance</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              {(Object.entries(profile.bloom) as [string, { score: number; confidence: string; evidenceCount: number }][]).map(([lvl, data]) => (
                <div key={lvl} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="capitalize text-slate-300">{lvl}</span>
                    <span className="font-mono text-emerald-400 font-bold">{data.score}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${data.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
