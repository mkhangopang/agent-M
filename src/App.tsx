import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, AppTab } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { DiagnosticView } from './components/DiagnosticView';
import { DiagnosticReportView } from './components/DiagnosticReportView';
import { DashboardView } from './components/DashboardView';
import { RealWorldSandboxView } from './components/RealWorldSandboxView';
import { AIFlashcardArena } from './components/AIFlashcardArena';
import { AIChatDrawer } from './components/AIChatDrawer';
import { VectorDbExplorer } from './components/VectorDbExplorer';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { PythonBundleView } from './components/PythonBundleView';
import { OnboardingModal } from './components/OnboardingModal';

import {
  BackendConfig,
  DiagnosticAnswerEvaluation,
  DiagnosticQuestion,
  DiagnosticState,
  LearnerProfile,
  LearningPathway,
  OllamaConfig,
} from './types';
import { storageManager, LearnerRegistryItem } from './lib/storage';
import { vectorDb } from './lib/vectorDb';
import { ollamaService } from './lib/ollamaClient';
import { localBackendService } from './lib/backendClient';
import { getCurriculumForSubject } from './lib/defaultCurricula';
import {
  compileLearnerProfile,
  evaluateDiagnosticAnswerLocally,
  generatePersonalizedPathway,
} from './lib/pedagogyEngine';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('home');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Multi-Learner State
  const [learners, setLearners] = useState<LearnerRegistryItem[]>(() => storageManager.getLearners());
  const [activeLearnerId, setActiveLearnerId] = useState<string>(() => storageManager.getActiveLearnerId());

  const [currentLearner, setCurrentLearner] = useState<LearnerProfile | null>(() => {
    return storageManager.getLearnerProfile(storageManager.getActiveLearnerId());
  });

  const [activeDiagnostic, setActiveDiagnostic] = useState<DiagnosticState | null>(() => {
    return storageManager.getDiagnosticState(storageManager.getActiveLearnerId());
  });

  const [currentPathway, setCurrentPathway] = useState<LearningPathway | null>(() => {
    return storageManager.getLearningPathway(storageManager.getActiveLearnerId());
  });

  // Services Config & Health State
  const [ollamaConfig, setOllamaConfig] = useState<OllamaConfig>(() => ollamaService.getConfig());
  const [backendConfig, setBackendConfig] = useState<BackendConfig>(() => localBackendService.getConfig());
  const [vectorCount, setVectorCount] = useState<number>(() => vectorDb.getAll().length);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [lastEvaluation, setLastEvaluation] = useState<DiagnosticAnswerEvaluation | null>(null);

  // AI Copilot Drawer State
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [chatConceptContext, setChatConceptContext] = useState<string | undefined>(undefined);

  const refreshOllama = useCallback(async () => {
    const res = await ollamaService.checkHealth();
    setOllamaConfig(ollamaService.getConfig());
    if (res.reachable && res.hasEmbeddingModel) {
      // Upgrade any un-embedded vectors in background
      vectorDb.upgradeEmbeddingsWithOllama(txt => ollamaService.embed(txt));
    }
  }, []);

  const refreshBackend = useCallback(async () => {
    await localBackendService.checkHealth();
    setBackendConfig(localBackendService.getConfig());
  }, []);

  // Background health checks at startup
  useEffect(() => {
    refreshOllama();
    refreshBackend();
  }, [refreshOllama, refreshBackend]);

  // Handle Switching Learner
  const handleSwitchLearner = (newLearnerId: string) => {
    storageManager.setActiveLearnerId(newLearnerId);
    setActiveLearnerId(newLearnerId);
    setLearners(storageManager.getLearners());

    const prof = storageManager.getLearnerProfile(newLearnerId);
    const path = storageManager.getLearningPathway(newLearnerId);
    const diag = storageManager.getDiagnosticState(newLearnerId);

    setCurrentLearner(prof);
    setCurrentPathway(path);
    setActiveDiagnostic(diag);
  };

  const handleOpenAIChatWithContext = (concept?: string) => {
    setChatConceptContext(concept);
    setIsAIChatOpen(true);
  };

  // Update learner profile
  const handleSelectProfile = (profile: LearnerProfile) => {
    setCurrentLearner(profile);
    storageManager.saveLearnerProfile(profile);
    const path = storageManager.getLearningPathway(profile.learnerId);
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

    const learnerId = activeLearnerId || `learner-${Date.now()}`;
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
    storageManager.saveDiagnosticState(newState);
    setLastEvaluation(null);
    setCurrentTab('diagnostic');
  };

  // Mutate current question with dynamic AI scenario
  const handleMutateCurrentQuestion = (newQuestion: DiagnosticQuestion) => {
    if (!activeDiagnostic) return;
    const questions = [...activeDiagnostic.questionsAsked];
    questions[activeDiagnostic.currentQuestionIndex] = newQuestion;
    const updatedState: DiagnosticState = {
      ...activeDiagnostic,
      questionsAsked: questions,
      updatedAt: new Date().toISOString(),
    };
    setActiveDiagnostic(updatedState);
    storageManager.saveDiagnosticState(updatedState);
    setLastEvaluation(null);
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
      storageManager.saveDiagnosticState(updatedState);
      setLastEvaluation(evaluation);

      return evaluation;
    } finally {
      setIsEvaluating(false);
    }
  };

  // Move to next question
  const handleProceedToNext = () => {
    if (!activeDiagnostic) return;

    const nextIndex = activeDiagnostic.currentQuestionIndex + 1;
    let nextPhase = activeDiagnostic.currentPhase;

    if (nextIndex >= 10) nextPhase = 'PHASE_D_METACOGNITION';
    else if (nextIndex >= 6) nextPhase = 'PHASE_C_COGNITIVE';
    else if (nextIndex >= 3) nextPhase = 'PHASE_B_BASELINE';

    const updatedState: DiagnosticState = {
      ...activeDiagnostic,
      currentQuestionIndex: nextIndex,
      currentPhase: nextPhase,
      updatedAt: new Date().toISOString(),
    };

    setActiveDiagnostic(updatedState);
    storageManager.saveDiagnosticState(updatedState);
    setLastEvaluation(null);
  };

  // Complete diagnostic and generate profile & pathway
  const handleCompleteDiagnostic = () => {
    if (!activeDiagnostic) return;

    const completedState: DiagnosticState = {
      ...activeDiagnostic,
      isCompleted: true,
      updatedAt: new Date().toISOString(),
    };
    setActiveDiagnostic(completedState);
    storageManager.saveDiagnosticState(completedState);

    const activeRegistryLearner = learners.find(l => l.learnerId === activeDiagnostic.learnerId);

    const profile = compileLearnerProfile(
      activeDiagnostic.learnerId,
      currentLearner?.name || activeRegistryLearner?.name || 'Learner',
      activeDiagnostic.subject,
      currentLearner?.goal || activeRegistryLearner?.goal || '',
      currentLearner?.experienceLevel || activeRegistryLearner?.experienceLevel || 'intermediate',
      currentLearner?.availableLearningTime || activeRegistryLearner?.availableLearningTime || '30 mins / day',
      activeDiagnostic.questionsAsked,
      activeDiagnostic.evaluations
    );

    const pathway = generatePersonalizedPathway(profile);

    setCurrentLearner(profile);
    setCurrentPathway(pathway);

    storageManager.saveLearnerProfile(profile);
    storageManager.saveLearningPathway(pathway);

    setCurrentTab('report');
  };

  // Export full JSON bundle
  const handleExportFullJson = () => {
    const rawJson = storageManager.exportData();
    const blob = new Blob([rawJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PLIA_database_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeLearnerObj = learners.find(l => l.learnerId === activeLearnerId) || learners[0];

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        ollamaConfig={ollamaConfig}
        backendConfig={backendConfig}
        activeSubject={currentLearner?.subject || activeDiagnostic?.subject || activeLearnerObj?.subject}
        activeLearner={activeLearnerObj}
        learners={learners}
        onSwitchLearner={handleSwitchLearner}
        onOpenNewLearner={() => setIsOnboardingOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        hasActiveDiagnostic={!!activeDiagnostic && !activeDiagnostic.isCompleted}
        vectorCount={vectorCount}
        onToggleAIChat={() => setIsAIChatOpen(prev => !prev)}
        isAIChatOpen={isAIChatOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        <div className="animate-in fade-in duration-300">
          {currentTab === 'home' && (
            <HomeView
              onStartDiagnostic={handleStartDiagnostic}
              activeProfile={currentLearner}
              hasActiveDiagnostic={!!activeDiagnostic && !activeDiagnostic.isCompleted}
              onResumeDiagnostic={() => setCurrentTab('diagnostic')}
              onGoToDashboard={() => setCurrentTab('dashboard')}
              onGoToReport={() => setCurrentTab('report')}
            />
          )}

          {currentTab === 'diagnostic' && activeDiagnostic && (
            <DiagnosticView
              diagnosticState={activeDiagnostic}
              currentQuestion={
                activeDiagnostic.questionsAsked[activeDiagnostic.currentQuestionIndex] ||
                activeDiagnostic.questionsAsked[0]
              }
              onSubmitAnswer={handleSubmitAnswer}
              onProceedToNext={handleProceedToNext}
              onCompleteDiagnostic={handleCompleteDiagnostic}
              isEvaluating={isEvaluating}
              lastEvaluation={lastEvaluation}
              onMutateQuestion={handleMutateCurrentQuestion}
              onOpenAIChat={handleOpenAIChatWithContext}
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
                  experienceLevel:
                    currentLearner.experienceLevel === 'unspecified' ? 'intermediate' : currentLearner.experienceLevel,
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
                storageManager.saveLearningPathway(updatedPath);
              }}
              onUpdateProfile={updatedProfile => {
                setCurrentLearner(updatedProfile);
                storageManager.saveLearnerProfile(updatedProfile);
              }}
              onRetakeDiagnostic={() => {
                handleStartDiagnostic({
                  name: currentLearner.name,
                  subject: currentLearner.subject,
                  goal: currentLearner.goal,
                  experienceLevel:
                    currentLearner.experienceLevel === 'unspecified' ? 'intermediate' : currentLearner.experienceLevel,
                  availableLearningTime: currentLearner.availableLearningTime,
                });
              }}
            />
          )}

          {/* Real-World Incident & Problem Solver Sandbox */}
          {currentTab === 'sandbox' && (
            <RealWorldSandboxView
              activeSubject={currentLearner?.subject || activeDiagnostic?.subject || 'Computer Science'}
              ollamaConfig={ollamaConfig}
              onOpenAIChat={handleOpenAIChatWithContext}
            />
          )}

          {/* AI Flashcard Arena */}
          {currentTab === 'flashcards' && (
            <AIFlashcardArena
              activeSubject={currentLearner?.subject || activeDiagnostic?.subject || 'Computer Science'}
              ollamaConfig={ollamaConfig}
            />
          )}

          {currentTab === 'vectorDb' && (
            <VectorDbExplorer onVectorCountChange={count => setVectorCount(count)} />
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
                    experienceLevel:
                      currentLearner.experienceLevel === 'unspecified' ? 'intermediate' : currentLearner.experienceLevel,
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

      {/* Persistent AI Socratic Copilot Drawer */}
      <AIChatDrawer
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        ollamaConfig={ollamaConfig}
        currentSubject={currentLearner?.subject || activeDiagnostic?.subject || 'General Problem Solving'}
        activeConcept={chatConceptContext}
      />

      {/* Guided Onboarding & Model Pull Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        ollamaConfig={ollamaConfig}
        onRefreshOllama={refreshOllama}
        onCompleteOnboarding={(name, sub, gl) => {
          setLearners(storageManager.getLearners());
          handleStartDiagnostic({
            name,
            subject: sub,
            goal: gl,
            experienceLevel: 'intermediate',
            availableLearningTime: '30 mins / day',
          });
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#0F172A] py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="font-semibold text-slate-400">PLIA • Personalized Learning Intelligence Agent</span>
          </div>
          <span className="text-[11px] text-slate-400">
            100% Offline • Local Vector DB & Ollama LLM • Zero Cloud Telemetry
          </span>
        </div>
      </footer>
    </div>
  );
}
