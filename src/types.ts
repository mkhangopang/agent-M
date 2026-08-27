/**
 * Core type definitions for PLIA (Personalized Learning Intelligence Agent)
 * Follows Bloom's Revised Taxonomy, 6 Cognitive Learning Stages,
 * Evidence-based Diagnostic Profiling, and Local Vector Database retrieval.
 */

export type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

export type CognitiveStageNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface CognitiveStageInfo {
  stage: CognitiveStageNumber;
  name: string;
  shortDescription: string;
  characteristics: string[];
  typicalBloomRange: string;
}

export type KnowledgeGapCategory =
  | 'foundational'
  | 'conceptual'
  | 'procedural'
  | 'application'
  | 'analytical'
  | 'evaluation'
  | 'transfer'
  | 'metacognitive';

export interface KnowledgeGap {
  id: string;
  domain: string;
  concept: string;
  category: KnowledgeGapCategory;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Misconception {
  id: string;
  concept: string;
  learnerBelief: string;
  expectedConcept: string;
  severity: 'low' | 'medium' | 'high';
  confidence: 'low' | 'moderate' | 'high';
}

export interface BloomScore {
  score: number; // 0-100
  confidence: 'low' | 'moderate' | 'high';
  evidenceCount: number;
}

export type BloomProfile = Record<BloomLevel, BloomScore>;

export interface MetacognitiveProfile {
  planning: number; // 0-100
  monitoring: number;
  reflection: number;
  errorRecognition: number;
  strategySelection: number;
}

export type ConfidenceCalibration = 'well_calibrated' | 'overconfident' | 'underconfident' | 'unassessed';

export interface SubjectMasteryDomain {
  domain: string;
  mastery: number; // 0-100
  confidence: 'low' | 'moderate' | 'high';
  evidenceCount: number;
  gaps: string[];
}

export type QuestionType =
  | 'factual_recall'
  | 'explanation'
  | 'application'
  | 'scenario'
  | 'comparison'
  | 'prediction'
  | 'error_analysis'
  | 'reasoning'
  | 'evidence_evaluation'
  | 'problem_solving'
  | 'transfer'
  | 'creation';

export type DifficultyLevel = 'easy' | 'medium' | 'difficult';

export interface DiagnosticQuestion {
  id: string;
  questionNumber: number;
  question: string;
  subject: string;
  domain: string;
  bloomLevel: BloomLevel;
  difficulty: DifficultyLevel;
  questionType: QuestionType;
  expectedEvidence: string;
  rubric: {
    noUnderstanding: string;
    partialUnderstanding: string;
    thoroughUnderstanding: string;
  };
  contextScenario?: string;
  hintLevel1?: string;
  sourceDocId?: string;
}

export interface DiagnosticAnswerSubmission {
  questionId: string;
  learnerAnswer: string;
  confidenceRating?: number; // 0-100
  timestamp: string;
}

export interface DiagnosticAnswerEvaluation {
  questionId: string;
  score: number; // 0-100
  bloomDemonstrated: BloomLevel;
  rubricTier: 'noUnderstanding' | 'partialUnderstanding' | 'thoroughUnderstanding';
  isMisconception: boolean;
  misconceptionDetails?: {
    concept: string;
    learnerBelief: string;
    expectedConcept: string;
    severity: 'low' | 'medium' | 'high';
  };
  gapsIdentified: KnowledgeGap[];
  strengthsIdentified: string[];
  metacognitiveObservation?: {
    planning?: number;
    monitoring?: number;
    reflection?: number;
    errorRecognition?: number;
  };
  feedback: {
    whatWasCorrect: string;
    whatNeedsImprovement: string;
    why: string;
    actionableImprovement: string;
  };
  calibrationDelta?: number; // difference between confidence and score
}

export interface DiagnosticState {
  sessionId: string;
  learnerId: string;
  subject: string;
  currentQuestionIndex: number;
  totalEstimatedQuestions: number;
  currentPhase: 'PHASE_A_INTAKE' | 'PHASE_B_BASELINE' | 'PHASE_C_COGNITIVE' | 'PHASE_D_METACOGNITION' | 'COMPLETED';
  questionsAsked: DiagnosticQuestion[];
  submissions: DiagnosticAnswerSubmission[];
  evaluations: DiagnosticAnswerEvaluation[];
  isCompleted: boolean;
  startedAt: string;
  updatedAt: string;
}

export interface LearnerProfile {
  learnerId: string;
  name?: string;
  subject: string;
  goal: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'unspecified';
  availableLearningTime: string; // e.g. "30 mins/day"
  learningStage: CognitiveStageNumber;
  stageName: string;
  stageConfidence: 'low' | 'moderate' | 'high';
  bloom: BloomProfile;
  subjectMastery: {
    overallMastery: number; // 0-100
    domains: Record<string, SubjectMasteryDomain>;
  };
  strengths: string[];
  knowledgeGaps: KnowledgeGap[];
  misconceptions: Misconception[];
  metacognition: MetacognitiveProfile;
  confidenceCalibration: ConfidenceCalibration;
  calibrationScore: number; // -100 (underconfident) to +100 (overconfident)
  learningPreferences: string[];
  recommendedStrategy: string;
  profileVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScaffoldingHint {
  level: 1 | 2 | 3 | 4 | 5;
  title: string;
  content: string;
  revealed: boolean;
}

export interface LearningActivity {
  id: string;
  phaseId: string;
  title: string;
  concept: string;
  bloomTarget: BloomLevel;
  type: 'retrieval_practice' | 'worked_example' | 'guided_practice' | 'independent_problem' | 'transfer_task' | 'creation_project';
  instruction: string;
  coreContent: string;
  interactiveTask: string;
  hints: ScaffoldingHint[];
  formativeQuestion: {
    prompt: string;
    expectedEvidence: string;
    solutionExplanation: string;
  };
  status: 'pending' | 'in_progress' | 'mastered' | 'needs_review';
  masteryScore?: number;
  completedAt?: string;
}

export interface LearningPhase {
  phaseId: string;
  phaseNumber: number;
  title: string;
  objective: string;
  prerequisites: string[];
  concepts: string[];
  bloomTarget: BloomLevel;
  activities: LearningActivity[];
  masteryThreshold: number; // usually 80
  estimatedTimeMinutes: number;
  status: 'locked' | 'active' | 'completed';
  overallPhaseMastery: number;
}

export interface LearningPathway {
  pathwayId: string;
  learnerId: string;
  subject: string;
  goal: string;
  phases: LearningPhase[];
  currentPhaseIndex: number;
  currentActivityId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpacedReviewItem {
  id: string;
  concept: string;
  domain: string;
  lastMasteredDate: string;
  intervalDays: number; // 1, 3, 7, 14, 30
  nextReviewDate: string;
  repetitionCount: number;
  status: 'due' | 'upcoming' | 'completed';
}

export interface PathwaySnapshot {
  id: string;
  learnerId: string;
  subject: string;
  name: string;
  note?: string;
  timestamp: string;
  pathway: LearningPathway;
  bloomProfile: BloomProfile;
  subjectMastery: {
    overallMastery: number;
    domains: Record<string, SubjectMasteryDomain>;
  };
  learningStage: CognitiveStageNumber;
  stageName: string;
  currentPhaseIndex: number;
  overallMastery: number;
}

export interface VectorDocument {
  id: string;
  subject: string;
  domain: string;
  topic: string;
  content: string;
  bloomLevel?: BloomLevel;
  category: 'curriculum' | 'misconception' | 'worked_example' | 'assessment_item' | 'user_note';
  embedding?: number[];
  metadata?: Record<string, string | number>;
  createdAt: string;
}

export interface VectorSearchResult {
  document: VectorDocument;
  similarityScore: number; // 0 to 1
  matchedTokens: string[];
}

export interface OllamaConfig {
  baseUrl: string;
  selectedModel: string;
  availableModels: string[];
  isReachable: boolean;
  lastChecked: string;
  mockMode: boolean;
  latencyMs?: number;
}

export type AICoachPersona = 'socratic' | 'senior_lead' | 'feynman' | 'examiner';

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  modelUsed?: string;
  latencyMs?: number;
  tokensPerSec?: number;
  persona?: AICoachPersona;
  vectorGrounding?: string[];
  suggestedFollowups?: string[];
  isStreaming?: boolean;
}

export interface RealWorldSimulationCase {
  id: string;
  title: string;
  subject: string;
  domain: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  bloomLevel: BloomLevel;
  industryContext: string;
  incidentOrProblem: string;
  starterDataOrCode?: string;
  constraints: string[];
  actionPrompt: string;
  expectedCriteria: string[];
  hints: string[];
  expertAnalysis?: string;
}

export interface AIGeneratedFlashcard {
  id: string;
  subject: string;
  domain: string;
  concept: string;
  frontPrompt: string;
  backExplanation: string;
  bloomLevel: BloomLevel;
  difficulty: 'easy' | 'medium' | 'hard';
  repetitions: number;
  intervalDays: number;
  easeFactor: number; // SM-2 default 2.5
  nextReviewDate: string;
  lastMasteryGrade?: number; // 0-5
}

