import React, { useState, useEffect } from 'react';
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
  const [currentTab, setCurrentTab] = useState<AppTab>('home');

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

  // AI Copilot Drawer State
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [chatConceptContext, setChatConceptContext] = useState<string | undefined>(undefined);

  // Background health check for Ollama at startup
  useEffect(() => {
    ollamaService.checkHealth().then(res => {
      if (res.reachable) {
        setOllamaConfig(ollamaService.getConfig());
      }
    });
  }, []);

  const handleOpenAIChatWithContext = (concept?: string) => {
    setChatConceptContext(concept);
    setIsAIChatOpen(true);
  };

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
    LocalStorageManager.saveActiveDiagnostic(updatedState);
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
      LocalStorageManager.saveActiveDiagnostic(updatedState);
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

    if (nextIndex >= 10) nextPhase = 'PHASE_D_METACOGNITIVE';
    else if (nextIndex >= 6) nextPhase = 'PHASE_C_COGNITIVE_PROBE';
    else if (nextIndex >= 3) nextPhase = 'PHASE_B_BASELINE_MASTERY';

    const updatedState: DiagnosticState = {
      ...activeDiagnostic,
      currentQuestionIndex: nextIndex,
      currentPhase: nextPhase,
      updatedAt: new Date().toISOString(),
    };

    setActiveDiagnostic(updatedState);
    LocalStorageManager.saveActiveDiagnostic(updatedState);
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
    LocalStorageManager.saveActiveDiagnostic(completedState);

    const profile = compileLearnerProfile(
      activeDiagnostic.learnerId,
      currentLearner?.name,
      activeDiagnostic.subject,
      currentLearner?.goal || '',
      currentLearner?.experienceLevel || 'intermediate',
      currentLearner?.availableLearningTime || '30 mins / day',
      activeDiagnostic.questionsAsked,
      activeDiagnostic.evaluations
    );

    const pathway = generatePersonalizedPathway(profile);

    setCurrentLearner(profile);
    setCurrentPathway(pathway);

    LocalStorageManager.saveLearner(profile);
    LocalStorageManager.savePathway(pathway);
    LocalStorageManager.setCurrentLearnerId(profile.learnerId);

    setCurrentTab('report');
  };

  // Export profile & pathway as JSON
  const handleExportFullJson = () => {
    if (!currentLearner) return;
    const bundle = {
      exportTimestamp: new Date().toISOString(),
      learnerProfile: currentLearner,
      learningPathway: currentPathway,
      diagnosticSession: activeDiagnostic,
      vectorDatabaseSample: vectorDb.getAll().slice(0, 10),
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PLIA_profile_${currentLearner.subject.toLowerCase()}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        ollamaConfig={ollamaConfig}
        activeSubject={currentLearner?.subject || activeDiagnostic?.subject}
        learnerName={currentLearner?.name}
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
