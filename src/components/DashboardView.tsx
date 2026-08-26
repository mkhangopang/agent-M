import React, { useState, useMemo } from 'react';
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
  Calendar,
  AlertCircle,
  Camera,
  History,
  RotateCcw,
  Trash2,
  X,
  Bookmark,
  Plus,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  LearnerProfile,
  LearningActivity,
  LearningPathway,
  LearningPhase,
  PathwaySnapshot,
  SpacedReviewItem,
} from '../types';
import { LocalStorageManager } from '../lib/storage';

interface DashboardViewProps {
  profile: LearnerProfile;
  pathway: LearningPathway;
  onUpdatePathway: (updated: LearningPathway) => void;
  onUpdateProfile?: (updated: LearnerProfile) => void;
  onRetakeDiagnostic: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  pathway,
  onUpdatePathway,
  onUpdateProfile,
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

  // Snapshot states
  const [snapshots, setSnapshots] = useState<PathwaySnapshot[]>(() =>
    LocalStorageManager.getAllSnapshots(profile.learnerId)
  );
  const [showSaveSnapshotModal, setShowSaveSnapshotModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [snapshotNameInput, setSnapshotNameInput] = useState('');
  const [snapshotNoteInput, setSnapshotNoteInput] = useState('');
  const [snapshotToRestore, setSnapshotToRestore] = useState<PathwaySnapshot | null>(null);
  const [toastNotification, setToastNotification] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastNotification({ message, type });
    setTimeout(() => {
      setToastNotification(prev => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const refreshSnapshots = () => {
    setSnapshots(LocalStorageManager.getAllSnapshots(profile.learnerId));
  };

  // Calculate overall pathway mastery
  const overallPathwayMastery = useMemo(() => {
    if (!pathway.phases || pathway.phases.length === 0) return 0;
    const total = pathway.phases.reduce((acc, p) => acc + (p.overallPhaseMastery || 0), 0);
    return Math.round(total / pathway.phases.length);
  }, [pathway]);

  // Spaced reviews list
  const spacedReviews = useMemo(() => {
    return LocalStorageManager.getSpacedReviews(profile.learnerId);
  }, [profile.learnerId, feedbackResult]);

  // Find active activity
  const activeActivity: LearningActivity | undefined =
    currentPhase?.activities?.find(a => a.id === selectedActivityId) || currentPhase?.activities?.[0];

  const handleRevealHint = (level: number) => {
    setRevealedHints(prev => ({ ...prev, [level]: true }));
  };

  const handleCompleteActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessmentAnswer.trim() || isSubmitting || !activeActivity) return;

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

  // Open Save Snapshot Modal with suggested name
  const handleOpenSaveModal = () => {
    const formattedDate = new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    setSnapshotNameInput(`Phase ${currentPhase.phaseNumber}: ${currentPhase.title} (${currentPhase.overallPhaseMastery}% Mastery) - ${formattedDate}`);
    setSnapshotNoteInput('');
    setShowSaveSnapshotModal(true);
  };

  // Save new point-in-time snapshot
  const handleConfirmSaveSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = snapshotNameInput.trim() || `Snapshot Phase ${currentPhase.phaseNumber} (${currentPhase.overallPhaseMastery}%)`;

    const newSnapshot: PathwaySnapshot = {
      id: `snapshot-${Date.now()}`,
      learnerId: profile.learnerId,
      subject: profile.subject,
      name: finalName,
      note: snapshotNoteInput.trim() || undefined,
      timestamp: new Date().toISOString(),
      pathway: JSON.parse(JSON.stringify(pathway)),
      bloomProfile: JSON.parse(JSON.stringify(profile.bloom)),
      subjectMastery: JSON.parse(JSON.stringify(profile.subjectMastery)),
      learningStage: profile.learningStage,
      stageName: profile.stageName,
      currentPhaseIndex: pathway.currentPhaseIndex,
      overallMastery: overallPathwayMastery,
    };

    LocalStorageManager.saveSnapshot(newSnapshot);
    refreshSnapshots();
    setShowSaveSnapshotModal(false);
    showToast(`Snapshot "${finalName}" saved successfully!`);

    try {
      confetti({
        particleCount: 30,
        spread: 45,
        origin: { y: 0.8 },
      });
    } catch {}
  };

  // Execute snapshot restoration
  const handleExecuteRestore = (snapshot: PathwaySnapshot) => {
    // 1. Restore pathway state
    const restoredPathway: LearningPathway = {
      ...JSON.parse(JSON.stringify(snapshot.pathway)),
      updatedAt: new Date().toISOString(),
    };
    onUpdatePathway(restoredPathway);
    LocalStorageManager.savePathway(restoredPathway);

    // 2. Restore profile mastery state if handler is available
    if (onUpdateProfile) {
      const restoredProfile: LearnerProfile = {
        ...profile,
        bloom: JSON.parse(JSON.stringify(snapshot.bloomProfile)),
        subjectMastery: JSON.parse(JSON.stringify(snapshot.subjectMastery)),
        learningStage: snapshot.learningStage,
        stageName: snapshot.stageName,
        updatedAt: new Date().toISOString(),
      };
      onUpdateProfile(restoredProfile);
      LocalStorageManager.saveLearner(restoredProfile);
    }

    // 3. Reset active activity selector & feedback
    const restoredCurrentPhase = restoredPathway.phases[restoredPathway.currentPhaseIndex] || restoredPathway.phases[0];
    setSelectedActivityId(restoredPathway.currentActivityId || restoredCurrentPhase?.activities?.[0]?.id || '');
    setFeedbackResult(null);
    setAssessmentAnswer('');
    setTaskResponse('');
    setRevealedHints({});
    setSnapshotToRestore(null);
    setShowHistoryModal(false);

    showToast(`Restored state to "${snapshot.name}" (${snapshot.overallMastery}% Mastery).`, 'success');
  };

  // Delete snapshot
  const handleDeleteSnapshot = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this saved snapshot?')) {
      LocalStorageManager.deleteSnapshot(id);
      refreshSnapshots();
      showToast('Snapshot deleted', 'info');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 relative">
      {/* Floating Toast Notification */}
      {toastNotification && (
        <div
          id="snapshot-toast-banner"
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl border shadow-2xl flex items-center space-x-3 transition-all animate-in fade-in slide-in-from-bottom-4 ${
            toastNotification.type === 'success'
              ? 'bg-slate-900 border-emerald-500/80 text-emerald-300 shadow-emerald-950/50'
              : toastNotification.type === 'error'
              ? 'bg-slate-900 border-rose-500/80 text-rose-300 shadow-rose-950/50'
              : 'bg-slate-900 border-indigo-500/80 text-indigo-300 shadow-indigo-950/50'
          }`}
        >
          {toastNotification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toastNotification.message}</span>
          <button
            onClick={() => setToastNotification(null)}
            className="text-slate-400 hover:text-white p-1 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right mr-1">
              <span className="text-[11px] text-slate-400 block">Cognitive Stage:</span>
              <strong className="text-emerald-400 text-xs font-semibold">
                Stage {profile.learningStage}: {profile.stageName}
              </strong>
            </div>

            {/* Save Snapshot Button */}
            <button
              id="save-snapshot-btn"
              onClick={handleOpenSaveModal}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-950/40 transition-all cursor-pointer"
              title="Save current point-in-time snapshot of pathway & mastery"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Save Snapshot</span>
            </button>

            {/* View Snapshots & History Drawer Button */}
            <button
              id="view-snapshots-btn"
              onClick={() => setShowHistoryModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer"
              title="View and restore saved snapshots"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>Snapshots</span>
              {snapshots.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {snapshots.length}
                </span>
              )}
            </button>
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

        {/* Right 4 Cols: Spaced Retrieval Schedule, Snapshots Widget & Summary */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Snapshot Action Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Bookmark className="w-4 h-4 text-indigo-400" />
                <span>Pathway Snapshots</span>
              </h3>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                {overallPathwayMastery}% Overall
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Capture a point-in-time restore point of your progress, unlocked phases, and mastery scores.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                id="quick-save-snapshot-btn"
                onClick={handleOpenSaveModal}
                className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-md transition-all cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Save Snapshot</span>
              </button>

              <button
                id="quick-view-history-btn"
                onClick={() => setShowHistoryModal(true)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center justify-center space-x-1 transition-all cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-indigo-400" />
                <span>History ({snapshots.length})</span>
              </button>
            </div>

            {snapshots.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Latest Saved Snapshot
                </span>
                <div
                  onClick={() => setShowHistoryModal(true)}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800/90 hover:border-slate-700 transition-all cursor-pointer space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 line-clamp-1">{snapshots[0].name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold">
                      {snapshots[0].overallMastery}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Phase {snapshots[0].currentPhaseIndex + 1}</span>
                    <span>{new Date(snapshots[0].timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

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

      {/* SAVE SNAPSHOT MODAL */}
      {showSaveSnapshotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/80">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Save Learning Snapshot</h3>
                  <p className="text-xs text-slate-400">Capture current pathway and mastery levels</p>
                </div>
              </div>
              <button
                onClick={() => setShowSaveSnapshotModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current State Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Subject / Stage:</span>
                <strong className="text-white">
                  {profile.subject} • Stage {profile.learningStage}
                </strong>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Active Phase:</span>
                <strong className="text-indigo-300">
                  Phase {currentPhase.phaseNumber}: {currentPhase.title}
                </strong>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Overall Pathway Mastery:</span>
                <span className="font-mono font-bold text-emerald-400">{overallPathwayMastery}%</span>
              </div>
            </div>

            <form onSubmit={handleConfirmSaveSnapshot} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="snapshot-name-input" className="block text-xs font-bold uppercase text-slate-300">
                  Snapshot Name / Label
                </label>
                <input
                  id="snapshot-name-input"
                  type="text"
                  value={snapshotNameInput}
                  onChange={e => setSnapshotNameInput(e.target.value)}
                  placeholder="e.g. Mid-term review, Before Phase 2 challenge..."
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="snapshot-note-input" className="block text-xs font-bold uppercase text-slate-300">
                  Optional Note / Context
                </label>
                <textarea
                  id="snapshot-note-input"
                  rows={3}
                  value={snapshotNoteInput}
                  onChange={e => setSnapshotNoteInput(e.target.value)}
                  placeholder="Add notes about why you saved this snapshot..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSaveSnapshotModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="confirm-save-snapshot-modal-btn"
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-md shadow-indigo-950/50 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Create Snapshot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SNAPSHOTS HISTORY & RESTORE MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/80">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Saved Pathway Snapshots</h3>
                  <p className="text-xs text-slate-400">
                    Restore previous pathway versions and mastery states for {profile.subject}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    handleOpenSaveModal();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center space-x-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    setSnapshotToRestore(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* List of Saved Snapshots */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {snapshots.length > 0 ? (
                snapshots.map(snapshot => (
                  <div
                    key={snapshot.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-white">{snapshot.name}</h4>
                        <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(snapshot.timestamp).toLocaleString()}</span>
                          <span>•</span>
                          <span className="text-indigo-300">Phase {snapshot.currentPhaseIndex + 1}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-mono font-semibold">
                            {snapshot.overallMastery}% Mastery
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSnapshotToRestore(snapshot)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>

                        <button
                          onClick={e => handleDeleteSnapshot(snapshot.id, e)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                          title="Delete snapshot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {snapshot.note && (
                      <p className="text-slate-300 text-xs bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                        {snapshot.note}
                      </p>
                    )}

                    {/* Bloom taxonomy summary bar */}
                    {snapshot.bloomProfile && (
                      <div className="grid grid-cols-6 gap-1 pt-1 border-t border-slate-800/60">
                        {(['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'] as const).map(lvl => {
                          const score = snapshot.bloomProfile[lvl]?.score ?? 0;
                          return (
                            <div key={lvl} className="text-center p-1 rounded-lg bg-slate-900 border border-slate-800/50">
                              <span className="text-[9px] uppercase tracking-tighter text-slate-400 block truncate">
                                {lvl.slice(0, 3)}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-slate-200">
                                {score}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
                  <Bookmark className="w-10 h-10 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white">No Snapshots Saved Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Save a snapshot anytime you want to safeguard your learning progress before attempting new activities or changing directions.
                  </p>
                  <button
                    onClick={() => {
                      setShowHistoryModal(false);
                      handleOpenSaveModal();
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center space-x-1.5 transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Save Current State</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RESTORE CONFIRMATION MODAL */}
      {snapshotToRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-indigo-500/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center space-x-3 text-amber-400 border-b border-slate-800 pb-4">
              <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-800/80">
                <RotateCcw className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Confirm Snapshot Restore</h3>
                <p className="text-xs text-slate-400">Revert pathway & mastery levels</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                Are you sure you want to restore your learning plan to:
              </p>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <strong className="text-white text-sm block">{snapshotToRestore.name}</strong>
                <p className="text-slate-400 text-[11px]">
                  Captured {new Date(snapshotToRestore.timestamp).toLocaleString()}
                </p>
                <div className="flex items-center space-x-3 text-[11px] pt-1 text-indigo-300">
                  <span>Phase {snapshotToRestore.currentPhaseIndex + 1}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">{snapshotToRestore.overallMastery}% Mastery</span>
                </div>
              </div>
              <p className="text-slate-400 text-[11px]">
                This will roll back your current pathway progression, activity completion marks, and demonstrated Bloom mastery scores to the exact state saved in this snapshot.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSnapshotToRestore(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-restore-action-btn"
                type="button"
                onClick={() => handleExecuteRestore(snapshotToRestore)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Restore</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

