import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { DiagnosticView } from './components/DiagnosticView';
import { DiagnosticReportView } from './components/DiagnosticReportView';
import { DashboardView } from './components/DashboardView';
import { VectorDbExplorer } from './components/VectorDbExplorer';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { PythonBundleView } from './components/PythonBundleView';

import {
  DiagnosticAnswerEvaluation,
  DiagnosticQuestion,
  DiagnosticState,
  LearnerProfile,
  LearningPathway,
  OllamaConfig,
} from './types';
import { LocalStorageManager } from './lib/storage';
import { vectorDb } from './lib/vectorDb';
import { ollamaService } from './lib/ollamaClient';
import { getCurriculumForSubject } from './lib/defaultCurricula';
import {
  compileLearnerProfile,
  evaluateDiagnosticAnswerLocally,
  generatePersonalizedPathway,
} from './lib/pedagogyEngine';

export default function App() {
  const [currentTab, setCurrentTab] = useState<
    'home' | 'diagnostic' | 'report' | 'dashboard' | 'vectorDb' | 'profile' | 'settings' | 'pythonBundle'
  >('home');

  const [currentLearner, setCurrentLearner] = useState<LearnerProfile | null>(() => {
    return LocalStorageManager.getCurrentLearner();
  });

  const [activeDiagnostic, setActiveDiagnostic] = useState<DiagnosticState | null>(() => {
    return LocalStorageManager.getActiveDiagnostic();
  });

  const [currentPathway, setCurrentPathway] = useState<LearningPathway | null>(() => {
    const learner = LocalStorageManager.getCurrentLearner();
    return learner ? LocalStorageManager.getPathwayForLearner(learner.learnerId) : null;
  });

  const [ollamaConfig, setOllamaConfig] = useState<OllamaConfig>(() => {
    return ollamaService.getConfig();
  });

  const [vectorCount, setVectorCount] = useState<number>(() => {
    return vectorDb.getAll().length;
  });

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [lastEvaluation, setLastEvaluation] = useState<DiagnosticAnswerEvaluation | null>(null);

  // Background health check for Ollama at startup
  useEffect(() => {
    ollamaService.checkHealth().then(res => {
      if (res.reachable) {
        setOllamaConfig(ollamaService.getConfig());
      }
    });
  }, []);

  // Update learner profile whenever current learner changes
  const handleSelectProfile = (profile: LearnerProfile) => {
    setCurrentLearner(profile);
    LocalStorageManager.setCurrentLearnerId(profile.learnerId);
    const path = LocalStorageManager.getPathwayForLearner(profile.learnerId);
    if (path) {
      setCurrentPathway(path);
    }
  };

  // Start Diagnostic Workflow
  const handleStartDiagnostic = (intake: {
    name?: string;
    subject: string;
    goal: string;
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    availableLearningTime: string;
  }) => {
    const curriculum = getCurriculumForSubject(intake.subject);

    // Combine intake, baseline, cognitive, and metacognitive questions
    const allQuestions: DiagnosticQuestion[] = [
      ...curriculum.intakeQuestions,
      ...curriculum.baselineQuestions,
      ...curriculum.cognitiveQuestions,
      ...curriculum.metacognitiveQuestions,
    ].map((q, idx) => ({ ...q, questionNumber: idx + 1 }));

    const learnerId = currentLearner?.learnerId || `learner-${Date.now()}`;
    const newState: DiagnosticState = {
      sessionId: `session-${Date.now()}`,
      learnerId,
      subject: intake.subject,
      currentQuestionIndex: 0,
      totalEstimatedQuestions: allQuestions.length,
      currentPhase: 'PHASE_A_INTAKE',
      questionsAsked: allQuestions,
      submissions: [],
      evaluations: [],
      isCompleted: false,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setActiveDiagnostic(newState);
    LocalStorageManager.saveActiveDiagnostic(newState);
    setLastEvaluation(null);
    setCurrentTab('diagnostic');
  };

  // Submit Answer to Current Question
  const handleSubmitAnswer = async (
    learnerAnswer: string,
    confidenceRating?: number
  ): Promise<DiagnosticAnswerEvaluation> => {
    if (!activeDiagnostic) throw new Error('No active diagnostic session');

    setIsEvaluating(true);
    const question = activeDiagnostic.questionsAsked[activeDiagnostic.currentQuestionIndex];

    try {
      // Evaluate response (grounded with local vector DB and Ollama or offline local pedagogical rules)
      const evaluationResult = await ollamaService.generateStructured<DiagnosticAnswerEvaluation>(
        `You are PLIA, an adaptive educational intelligence evaluator. Evaluate the student's answer using Bloom's Taxonomy and the provided scoring rubric. Return valid JSON only with keys: score (0-100), rubricTier ('noUnderstanding'|'partialUnderstanding'|'thoroughUnderstanding'), isMisconception (boolean), feedback ({ whatWasCorrect, whatNeedsImprovement, why, actionableImprovement }), gapsIdentified (array), strengthsIdentified (array).`,
        `Question: ${question.question}\nBloom Level: ${question.bloomLevel}\nDomain: ${question.domain}\nExpected Rubric Criteria: ${JSON.stringify(question.rubric)}\nStudent Answer: "${learnerAnswer}"\nStudent Confidence: ${confidenceRating ?? 'Unspecified'}%`,
        {
          queryForVectorContext: `${question.domain} ${question.question}`,
          subject: activeDiagnostic.subject,
          fallbackGenerator: () => evaluateDiagnosticAnswerLocally(question, learnerAnswer, confidenceRating),
        }
      );

      const evaluation = evaluationResult.data;

      // Update state
      const updatedSubmissions = [
        ...activeDiagnostic.submissions,
        {
          questionId: question.id,
          learnerAnswer,
          confidenceRating,
          timestamp: new Date().toISOString(),
        },
      ];

      const updatedEvaluations = [...activeDiagnostic.evaluations, evaluation];

      const updatedState: DiagnosticState = {
        ...activeDiagnostic,
        submissions: updatedSubmissions,
        evaluations: updatedEvaluations,
        updatedAt: new Date().toISOString(),
      };

      setActiveDiagnostic(updatedState);
      LocalStorageManager.saveActiveDiagnostic(updatedState);
      setLastEvaluation(evaluation);
      setIsEvaluating(false);
      return evaluation;
    } catch (e) {
      console.warn('Evaluation error, using local fallback:', e);
      const fallbackEval = evaluateDiagnosticAnswerLocally(question, learnerAnswer, confidenceRating);
      setLastEvaluation(fallbackEval);
      setIsEvaluating(false);
      return fallbackEval;
    }
  };

  // Proceed to Next Question in Adaptive Sequence
  const handleProceedToNext = () => {
    if (!activeDiagnostic) return;

    const nextIndex = activeDiagnostic.currentQuestionIndex + 1;
    let phase: DiagnosticState['currentPhase'] = 'PHASE_C_COGNITIVE';

    if (nextIndex < 1) phase = 'PHASE_A_INTAKE';
    else if (nextIndex < 3) phase = 'PHASE_B_BASELINE';
    else if (nextIndex >= activeDiagnostic.totalEstimatedQuestions - 1) phase = 'PHASE_D_METACOGNITION';

    const updatedState: DiagnosticState = {
      ...activeDiagnostic,
      currentQuestionIndex: nextIndex,
      currentPhase: phase,
      updatedAt: new Date().toISOString(),
    };

    setActiveDiagnostic(updatedState);
    LocalStorageManager.saveActiveDiagnostic(updatedState);
    setLastEvaluation(null);
  };

  // Complete Diagnostic and Generate Personalized Profile & Pathway
  const handleCompleteDiagnostic = () => {
    if (!activeDiagnostic) return;

    const questions = activeDiagnostic.questionsAsked;
    const evaluations = activeDiagnostic.evaluations;

    const profile = compileLearnerProfile(
      activeDiagnostic.learnerId,
      currentLearner?.name,
      activeDiagnostic.subject,
      currentLearner?.goal || `Mastery in ${activeDiagnostic.subject}`,
      currentLearner?.experienceLevel || 'intermediate',
      currentLearner?.availableLearningTime || '30 mins / day',
      questions,
      evaluations
    );

    const pathway = generatePersonalizedPathway(profile);

    // Save profile and pathway locally
    LocalStorageManager.saveLearner(profile);
    LocalStorageManager.savePathway(pathway);
    LocalStorageManager.clearActiveDiagnostic();

    setCurrentLearner(profile);
    setCurrentPathway(pathway);
    setActiveDiagnostic(null);
    setLastEvaluation(null);
    setCurrentTab('report');
  };

  // Export profile JSON download
  const handleExportFullJson = () => {
    const jsonString = LocalStorageManager.exportFullData();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plia_profile_${currentLearner?.subject || 'data'}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white font-sans">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        ollamaConfig={ollamaConfig}
        activeSubject={activeDiagnostic?.subject || currentLearner?.subject}
        learnerName={currentLearner?.name}
        hasActiveDiagnostic={!!activeDiagnostic}
        vectorCount={vectorCount}
      />

      {/* Main Content Area with subtle tech ambient grid */}
      <main className="flex-1 pb-16 relative">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-20" />
        <div className="relative z-10">
          {currentTab === 'home' && (
            <HomeView
              onStartDiagnostic={handleStartDiagnostic}
              activeProfile={currentLearner}
              hasActiveDiagnostic={!!activeDiagnostic}
              onResumeDiagnostic={() => setCurrentTab('diagnostic')}
              onGoToDashboard={() => setCurrentTab('dashboard')}
              onGoToReport={() => setCurrentTab('report')}
            />
          )}

          {currentTab === 'diagnostic' && activeDiagnostic && (
            <DiagnosticView
              diagnosticState={activeDiagnostic}
              currentQuestion={activeDiagnostic.questionsAsked[activeDiagnostic.currentQuestionIndex]}
              onSubmitAnswer={handleSubmitAnswer}
              onProceedToNext={handleProceedToNext}
              onCompleteDiagnostic={handleCompleteDiagnostic}
              isEvaluating={isEvaluating}
              lastEvaluation={lastEvaluation}
            />
          )}

          {currentTab === 'report' && currentLearner && (
            <DiagnosticReportView
              profile={currentLearner}
              onStartLearningPath={() => setCurrentTab('dashboard')}
              onRetakeDiagnostic={() => {
                handleStartDiagnostic({
                  name: currentLearner.name,
                  subject: currentLearner.subject,
                  goal: currentLearner.goal,
                  experienceLevel: currentLearner.experienceLevel === 'unspecified' ? 'intermediate' : currentLearner.experienceLevel,
                  availableLearningTime: currentLearner.availableLearningTime,
                });
              }}
              onExportJson={handleExportFullJson}
            />
          )}

          {currentTab === 'dashboard' && currentLearner && currentPathway && (
            <DashboardView
              profile={currentLearner}
              pathway={currentPathway}
              onUpdatePathway={updatedPath => {
                setCurrentPathway(updatedPath);
                LocalStorageManager.savePathway(updatedPath);
              }}
              onUpdateProfile={updatedProfile => {
                setCurrentLearner(updatedProfile);
                LocalStorageManager.saveLearner(updatedProfile);
              }}
              onRetakeDiagnostic={() => {
                handleStartDiagnostic({
                  name: currentLearner.name,
                  subject: currentLearner.subject,
                  goal: currentLearner.goal,
                  experienceLevel: currentLearner.experienceLevel === 'unspecified' ? 'intermediate' : currentLearner.experienceLevel,
                  availableLearningTime: currentLearner.availableLearningTime,
                });
              }}
            />
          )}

          {currentTab === 'vectorDb' && (
            <VectorDbExplorer
              onVectorCountChange={count => setVectorCount(count)}
            />
          )}

          {currentTab === 'profile' && (
            <ProfileView
              currentProfile={currentLearner}
              onSelectProfile={handleSelectProfile}
              onRetakeDiagnostic={() => {
                if (currentLearner) {
                  handleStartDiagnostic({
                    name: currentLearner.name,
                    subject: currentLearner.subject,
                    goal: currentLearner.goal,
                    experienceLevel: currentLearner.experienceLevel === 'unspecified' ? 'intermediate' : currentLearner.experienceLevel,
                    availableLearningTime: currentLearner.availableLearningTime,
                  });
                } else {
                  setCurrentTab('home');
                }
              }}
              onExportJson={handleExportFullJson}
              onViewReport={() => setCurrentTab('report')}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              ollamaConfig={ollamaConfig}
              onUpdateConfig={newCfg => {
                const updated = ollamaService.saveConfig(newCfg);
                setOllamaConfig(updated);
              }}
              onVectorCountChange={count => setVectorCount(count)}
            />
          )}

          {currentTab === 'pythonBundle' && <PythonBundleView />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#0F172A] py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="font-semibold text-slate-400">PLIA v1.0 • Personalized Learning Intelligence Agent</span>
          </div>
          <span className="text-[11px] text-slate-400">
            100% Offline • Local Vector DB & Ollama LLM • Zero Cloud Telemetry
          </span>
        </div>
      </footer>
    </div>
  );
}
