/**
 * Pedagogical Reasoning & Cognitive Profiling Engine for PLIA
 * Implements Bloom's Revised Taxonomy, 6 Cognitive Learning Stages,
 * Evidence-based inference, Metacognitive calibration, and Scaffolding logic.
 */

import {
  BloomLevel,
  BloomProfile,
  CognitiveStageInfo,
  CognitiveStageNumber,
  ConfidenceCalibration,
  DiagnosticAnswerEvaluation,
  DiagnosticQuestion,
  KnowledgeGap,
  LearnerProfile,
  LearningPathway,
  LearningPhase,
  MetacognitiveProfile,
  Misconception,
  SubjectMasteryDomain,
} from '../types';
import { getCurriculumForSubject } from './defaultCurricula';

export const COGNITIVE_STAGES: Record<CognitiveStageNumber, CognitiveStageInfo> = {
  1: {
    stage: 1,
    name: 'Foundational Learner',
    shortDescription: 'Builds core factual and conceptual foundations with step-by-step guidance.',
    characteristics: [
      'Relies on explicit, direct explanations and concrete examples',
      'Stronger at direct recall and recognition than autonomous transfer',
      'Benefits significantly from structured scaffolding and worked solutions',
    ],
    typicalBloomRange: 'Remember → Understand',
  },
  2: {
    stage: 2,
    name: 'Developing Learner',
    shortDescription: 'Grasps central concepts and performs guided applications on familiar tasks.',
    characteristics: [
      'Understands core principles and relational mechanisms',
      'Executes guided problem-solving accurately',
      'May encounter uncertainty when confronting novel or unprompted edge cases',
    ],
    typicalBloomRange: 'Understand → Apply',
  },
  3: {
    stage: 3,
    name: 'Competent Applicator',
    shortDescription: 'Independently applies domain principles and executes procedural workflows.',
    characteristics: [
      'Solves standard domain problems with independence and consistency',
      'Recognizes appropriate formulas, algorithms, or frameworks to deploy',
      'Beginning early analytical decomposition and error identification',
    ],
    typicalBloomRange: 'Apply → Analyze',
  },
  4: {
    stage: 4,
    name: 'Analytical Learner',
    shortDescription: 'Deconstructs complex systems, diagnoses root causes, and compares alternatives.',
    characteristics: [
      'Identifies non-obvious patterns, causal links, and underlying structures',
      'Deconstructs multi-variable scenarios and diagnoses systemic errors',
      'Distinguishes between correlation and causation in domain scenarios',
    ],
    typicalBloomRange: 'Analyze',
  },
  5: {
    stage: 5,
    name: 'Critical Thinker',
    shortDescription: 'Evaluates competing hypotheses, tests empirical validity, and justifies decisions.',
    characteristics: [
      'Critiques methodological assumptions and weighs architectural tradeoffs',
      'Evaluates empirical evidence against theoretical rubrics',
      'Calibrates certainty with intellectual humility and objective criteria',
    ],
    typicalBloomRange: 'Analyze → Evaluate',
  },
  6: {
    stage: 6,
    name: 'Advanced Creator',
    shortDescription: 'Synthesizes multi-disciplinary knowledge to design novel solutions and frameworks.',
    characteristics: [
      'Synthesizes disparate concepts into unified, original models',
      'Designs robust experiments, architectures, or conceptual frameworks',
      'Demonstrates high transfer capability across completely novel domains',
    ],
    typicalBloomRange: 'Evaluate → Create',
  },
};

export const BLOOM_LEVELS_ORDERED: BloomLevel[] = [
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
];

/**
 * Initialize a clean, zeroed Bloom Profile
 */
export function createInitialBloomProfile(): BloomProfile {
  return {
    remember: { score: 50, confidence: 'low', evidenceCount: 0 },
    understand: { score: 50, confidence: 'low', evidenceCount: 0 },
    apply: { score: 50, confidence: 'low', evidenceCount: 0 },
    analyze: { score: 50, confidence: 'low', evidenceCount: 0 },
    evaluate: { score: 50, confidence: 'low', evidenceCount: 0 },
    create: { score: 50, confidence: 'low', evidenceCount: 0 },
  };
}

/**
 * Evaluate a diagnostic answer deterministically using rubric matching and semantic heuristics
 */
export function evaluateDiagnosticAnswerLocally(
  question: DiagnosticQuestion,
  learnerAnswer: string,
  confidenceRating?: number
): DiagnosticAnswerEvaluation {
  const cleanAnswer = learnerAnswer.trim();
  const lowerAnswer = cleanAnswer.toLowerCase();
  const wordCount = cleanAnswer.split(/\s+/).filter(Boolean).length;

  let score = 50;
  let rubricTier: 'noUnderstanding' | 'partialUnderstanding' | 'thoroughUnderstanding' = 'partialUnderstanding';
  let isMisconception = false;
  let misconceptionDetails: DiagnosticAnswerEvaluation['misconceptionDetails'] = undefined;
  const gapsIdentified: KnowledgeGap[] = [];
  const strengthsIdentified: string[] = [];

  // Check for empty or minimal responses
  if (wordCount < 4 || lowerAnswer.includes("i don't know") || lowerAnswer.includes("not sure") || lowerAnswer.includes("no idea")) {
    score = 20;
    rubricTier = 'noUnderstanding';
    gapsIdentified.push({
      id: `gap-${Date.now()}-1`,
      domain: question.domain,
      concept: question.expectedEvidence.slice(0, 40),
      category: question.bloomLevel === 'remember' ? 'foundational' : 'conceptual',
      description: `Learner indicated missing knowledge on ${question.domain}: "${question.expectedEvidence.slice(0, 60)}..."`,
      priority: 'high',
    });
  } else {
    // Keyword and conceptual overlap analysis
    const expectedTokens = question.expectedEvidence.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    let matchedCount = 0;
    for (const token of expectedTokens) {
      if (lowerAnswer.includes(token)) matchedCount++;
    }
    const tokenMatchRatio = expectedTokens.length > 0 ? matchedCount / expectedTokens.length : 0.5;

    // Detect explicit known domain misconceptions
    if (
      question.domain.toLowerCase().includes('respiration') &&
      (lowerAnswer.includes('only when oxygen') || lowerAnswer.includes('just breathing'))
    ) {
      isMisconception = true;
      misconceptionDetails = {
        concept: 'Cellular Respiration vs Gas Exchange',
        learnerBelief: 'Believed respiration is merely breathing or impossible without oxygen.',
        expectedConcept: 'Anaerobic glycolysis operates independently of oxygen to produce ATP via fermentation.',
        severity: 'medium',
      };
    } else if (
      question.domain.toLowerCase().includes('genetics') &&
      (lowerAnswer.includes('dominant is always more common') || lowerAnswer.includes('dominant will eliminate recessive'))
    ) {
      isMisconception = true;
      misconceptionDetails = {
        concept: 'Allele Dominance vs Population Frequency',
        learnerBelief: 'Equated dominant alleles with higher evolutionary fitness and population frequency.',
        expectedConcept: 'Dominance describes phenotypic expression in heterozygotes; natural selection and drift govern allele frequency.',
        severity: 'high',
      };
    } else if (
      question.domain.toLowerCase().includes('mechanics') &&
      (lowerAnswer.includes('needs continuous force') || lowerAnswer.includes('force is required to keep moving'))
    ) {
      isMisconception = true;
      misconceptionDetails = {
        concept: 'Inertia vs Aristotelian Motion',
        learnerBelief: 'Believed a continuous net force is necessary to maintain constant velocity.',
        expectedConcept: 'Newton First Law states velocity is constant when net force is zero.',
        severity: 'high',
      };
    }

    // Score calculation
    if (isMisconception) {
      score = 35;
      rubricTier = 'partialUnderstanding';
      gapsIdentified.push({
        id: `gap-${Date.now()}-misc`,
        domain: question.domain,
        concept: misconceptionDetails?.concept || question.domain,
        category: 'conceptual',
        description: misconceptionDetails?.expectedConcept || 'Conceptual misconception identified.',
        priority: 'high',
      });
    } else if (tokenMatchRatio >= 0.4 || wordCount >= 30) {
      score = Math.min(100, Math.round(75 + tokenMatchRatio * 25));
      rubricTier = 'thoroughUnderstanding';
      strengthsIdentified.push(`Accurate articulation of ${question.domain} (${question.bloomLevel} level)`);
    } else if (tokenMatchRatio >= 0.15 || wordCount >= 12) {
      score = Math.min(74, Math.max(50, Math.round(50 + tokenMatchRatio * 30)));
      rubricTier = 'partialUnderstanding';
      strengthsIdentified.push(`Emerging intuition in ${question.domain}`);
      gapsIdentified.push({
        id: `gap-${Date.now()}-part`,
        domain: question.domain,
        concept: question.domain,
        category: question.bloomLevel === 'apply' ? 'application' : 'conceptual',
        description: `Deepen precision and analytical justification in ${question.domain}.`,
        priority: 'medium',
      });
    } else {
      score = 40;
      rubricTier = 'partialUnderstanding';
    }
  }

  // Calculate calibration delta if user submitted confidence rating
  let calibrationDelta: number | undefined = undefined;
  if (typeof confidenceRating === 'number') {
    calibrationDelta = confidenceRating - score;
  }

  // Construct calibrated educational feedback
  let whatWasCorrect = '';
  let whatNeedsImprovement = '';
  let why = '';
  let actionableImprovement = '';

  if (rubricTier === 'thoroughUnderstanding') {
    whatWasCorrect = `Your response demonstrated solid clarity regarding ${question.domain}. You addressed the core principles accurately.`;
    whatNeedsImprovement = `Continue refining concise transfer to unfamiliar edge cases.`;
    why = `Thorough evidence aligned with the expected rubric for ${question.bloomLevel} complexity.`;
    actionableImprovement = `Challenge yourself to synthesize this concept into cross-domain scenarios.`;
  } else if (rubricTier === 'partialUnderstanding') {
    whatWasCorrect = isMisconception
      ? `You engaged actively with the premise and shared your current working intuition.`
      : `You identified relevant elements of ${question.domain}.`;
    whatNeedsImprovement = isMisconception
      ? `There is a key conceptual distinction: ${misconceptionDetails?.expectedConcept}`
      : `Deepen your structural reasoning: ${question.expectedEvidence.slice(0, 100)}...`;
    why = isMisconception
      ? `Addressing this misconception early prevents cascading errors in higher-order application.`
      : `Key mechanisms or quantitative relationships need more explicit formulation.`;
    actionableImprovement = `Review the contrasting example and state the exact causal mechanism.`;
  } else {
    whatWasCorrect = `You identified the subject context.`;
    whatNeedsImprovement = `Building foundational recall and core definitions for ${question.domain}.`;
    why = `Direct recall is the prerequisite for higher-order application and analysis.`;
    actionableImprovement = `Review the core definition: ${question.expectedEvidence.slice(0, 120)}.`;
  }

  return {
    questionId: question.id,
    score,
    bloomDemonstrated: question.bloomLevel,
    rubricTier,
    isMisconception,
    misconceptionDetails,
    gapsIdentified,
    strengthsIdentified,
    metacognitiveObservation: {
      planning: score >= 70 ? 75 : 55,
      monitoring: confidenceRating !== undefined && Math.abs(confidenceRating - score) < 20 ? 80 : 50,
      reflection: wordCount > 20 ? 75 : 50,
      errorRecognition: isMisconception ? 45 : 70,
    },
    feedback: {
      whatWasCorrect,
      whatNeedsImprovement,
      why,
      actionableImprovement,
    },
    calibrationDelta,
  };
}

/**
 * Infer the Cognitive Learning Stage (1 to 6) from cumulative Bloom's evidence
 */
export function inferCognitiveLearningStage(bloom: BloomProfile): {
  stage: CognitiveStageNumber;
  confidence: 'low' | 'moderate' | 'high';
  stageName: string;
} {
  const r = bloom.remember.score;
  const u = bloom.understand.score;
  const a = bloom.apply.score;
  const an = bloom.analyze.score;
  const ev = bloom.evaluate.score;
  const cr = bloom.create.score;

  const totalEvidence =
    bloom.remember.evidenceCount +
    bloom.understand.evidenceCount +
    bloom.apply.evidenceCount +
    bloom.analyze.evidenceCount +
    bloom.evaluate.evidenceCount +
    bloom.create.evidenceCount;

  let confidence: 'low' | 'moderate' | 'high' = 'low';
  if (totalEvidence >= 8) confidence = 'high';
  else if (totalEvidence >= 4) confidence = 'moderate';

  let stage: CognitiveStageNumber = 1;

  if (cr >= 75 && ev >= 75 && an >= 75) {
    stage = 6; // Advanced Creator
  } else if (ev >= 70 && an >= 70 && a >= 70) {
    stage = 5; // Critical Thinker
  } else if (an >= 65 && a >= 70 && u >= 75) {
    stage = 4; // Analytical Learner
  } else if (a >= 65 && u >= 65) {
    stage = 3; // Competent Applicator
  } else if (u >= 60 || (r >= 70 && a >= 40)) {
    stage = 2; // Developing Learner
  } else {
    stage = 1; // Foundational Learner
  }

  return {
    stage,
    confidence,
    stageName: COGNITIVE_STAGES[stage].name,
  };
}

/**
 * Calculate overall Bloom profile and confidence calibration from diagnostic evaluations
 */
export function compileLearnerProfile(
  learnerId: string,
  name: string | undefined,
  subject: string,
  goal: string,
  experienceLevel: LearnerProfile['experienceLevel'],
  availableTime: string,
  questions: DiagnosticQuestion[],
  evaluations: DiagnosticAnswerEvaluation[]
): LearnerProfile {
  const bloom = createInitialBloomProfile();
  const strengths: string[] = [];
  const knowledgeGaps: KnowledgeGap[] = [];
  const misconceptions: Misconception[] = [];
  const domainScores: Record<string, { total: number; count: number; gaps: string[] }> = {};

  let totalCalibrationDiff = 0;
  let calibrationCount = 0;

  let planningSum = 0;
  let monitoringSum = 0;
  let reflectionSum = 0;
  let errorRecSum = 0;
  let metaCount = 0;

  for (let i = 0; i < evaluations.length; i++) {
    const ev = evaluations[i];
    const q = questions.find(item => item.id === ev.questionId) || questions[i];
    if (!q) continue;

    // Bloom update
    const bl = ev.bloomDemonstrated;
    const current = bloom[bl];
    const newCount = current.evidenceCount + 1;
    const newScore = Math.round((current.score * (newCount - 1) + ev.score) / newCount);
    const conf: 'low' | 'moderate' | 'high' = newCount >= 3 ? 'high' : newCount >= 2 ? 'moderate' : 'low';
    bloom[bl] = { score: newScore, confidence: conf, evidenceCount: newCount };

    // Domain tracking
    if (!domainScores[q.domain]) {
      domainScores[q.domain] = { total: 0, count: 0, gaps: [] };
    }
    domainScores[q.domain].total += ev.score;
    domainScores[q.domain].count += 1;

    // Gaps and Strengths
    for (const g of ev.gapsIdentified) {
      if (!knowledgeGaps.some(existing => existing.concept === g.concept)) {
        knowledgeGaps.push(g);
        domainScores[q.domain].gaps.push(g.concept);
      }
    }
    for (const s of ev.strengthsIdentified) {
      if (!strengths.includes(s)) strengths.push(s);
    }

    // Misconceptions
    if (ev.isMisconception && ev.misconceptionDetails) {
      misconceptions.push({
        id: `misc-${Date.now()}-${i}`,
        concept: ev.misconceptionDetails.concept,
        learnerBelief: ev.misconceptionDetails.learnerBelief,
        expectedConcept: ev.misconceptionDetails.expectedConcept,
        severity: ev.misconceptionDetails.severity,
        confidence: 'high',
      });
    }

    // Calibration
    if (typeof ev.calibrationDelta === 'number') {
      totalCalibrationDiff += ev.calibrationDelta;
      calibrationCount++;
    }

    // Metacognition
    if (ev.metacognitiveObservation) {
      planningSum += ev.metacognitiveObservation.planning || 60;
      monitoringSum += ev.metacognitiveObservation.monitoring || 60;
      reflectionSum += ev.metacognitiveObservation.reflection || 60;
      errorRecSum += ev.metacognitiveObservation.errorRecognition || 60;
      metaCount++;
    }
  }

  // Finalize subject domains
  const domains: Record<string, SubjectMasteryDomain> = {};
  let overallMasterySum = 0;
  let domainCount = 0;

  for (const [domName, data] of Object.entries(domainScores)) {
    const avg = Math.round(data.total / data.count);
    domains[domName] = {
      domain: domName,
      mastery: avg,
      confidence: data.count >= 2 ? 'moderate' : 'low',
      evidenceCount: data.count,
      gaps: data.gaps,
    };
    overallMasterySum += avg;
    domainCount++;
  }

  const overallMastery = domainCount > 0 ? Math.round(overallMasterySum / domainCount) : 50;

  // Infer stage
  const { stage, confidence: stageConf, stageName } = inferCognitiveLearningStage(bloom);

  // Calibration classification
  let confidenceCalibration: ConfidenceCalibration = 'unassessed';
  let avgCalDiff = 0;
  if (calibrationCount > 0) {
    avgCalDiff = Math.round(totalCalibrationDiff / calibrationCount);
    if (Math.abs(avgCalDiff) <= 15) {
      confidenceCalibration = 'well_calibrated';
    } else if (avgCalDiff > 15) {
      confidenceCalibration = 'overconfident';
    } else {
      confidenceCalibration = 'underconfident';
    }
  }

  // Metacognitive profile
  const metacognition: MetacognitiveProfile = {
    planning: metaCount > 0 ? Math.round(planningSum / metaCount) : 65,
    monitoring: metaCount > 0 ? Math.round(monitoringSum / metaCount) : 60,
    reflection: metaCount > 0 ? Math.round(reflectionSum / metaCount) : 70,
    errorRecognition: metaCount > 0 ? Math.round(errorRecSum / metaCount) : 55,
    strategySelection: Math.min(100, Math.round((overallMastery + (metaCount > 0 ? planningSum / metaCount : 60)) / 2)),
  };

  // Learning preferences & recommendations
  const learningPreferences = [
    'Worked Examples & Scaffolding',
    'Active Retrieval Practice',
    'Dual-Coding (Visual + Conceptual)',
    'Formative Feedback Loops',
  ];

  let recommendedStrategy = '';
  if (stage <= 2) {
    recommendedStrategy = 'Focus on foundational definitions, concrete worked examples, and step-by-step scaffolding before tackling unassisted transfer problems.';
  } else if (stage <= 4) {
    recommendedStrategy = 'Engage in deliberate analytical practice, comparative case studies, and error diagnosis to build strong multi-variable reasoning.';
  } else {
    recommendedStrategy = 'Focus on synthesis tasks, critique of empirical methods, open-ended creation projects, and transferring principles to novel scenarios.';
  }

  return {
    learnerId,
    name,
    subject,
    goal: goal || `Master core principles and applications in ${subject}`,
    experienceLevel: experienceLevel || 'intermediate',
    availableLearningTime: availableTime || '30 mins / day',
    learningStage: stage,
    stageName,
    stageConfidence: stageConf,
    bloom,
    subjectMastery: {
      overallMastery,
      domains,
    },
    strengths: strengths.length > 0 ? strengths : [`Basic engagement with ${subject} concepts`],
    knowledgeGaps,
    misconceptions,
    metacognition,
    confidenceCalibration,
    calibrationScore: avgCalDiff,
    learningPreferences,
    recommendedStrategy,
    profileVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Generate a personalized multi-phase learning pathway tailored to the diagnostic profile
 */
export function generatePersonalizedPathway(profile: LearnerProfile): LearningPathway {
  const subject = profile.subject;
  const curriculum = getCurriculumForSubject(subject);
  const domains = Object.keys(profile.subjectMastery.domains).length > 0
    ? Object.keys(profile.subjectMastery.domains)
    : curriculum.domains;

  const phases: LearningPhase[] = [];

  // Phase 1: Conceptual Foundation & Gap Remediation
  const initialConcept = domains[0] || `${subject} Core Principles`;
  phases.push({
    phaseId: `phase-1-${Date.now()}`,
    phaseNumber: 1,
    title: 'Foundational Knowledge & Gap Remediation',
    objective: `Establish unambiguous definitions, core principles, and resolve identified baseline gaps in ${subject}.`,
    prerequisites: ['Diagnostic Completion'],
    concepts: [initialConcept, 'Terminology & Invariants', 'Core Rules'],
    bloomTarget: 'understand',
    masteryThreshold: 80,
    estimatedTimeMinutes: 45,
    status: 'active',
    overallPhaseMastery: Math.min(75, profile.bloom.remember.score),
    activities: [
      {
        id: `act-1-1`,
        phaseId: `phase-1`,
        title: `Core Retrieval: Foundational Principles of ${initialConcept}`,
        concept: initialConcept,
        bloomTarget: 'remember',
        type: 'retrieval_practice',
        instruction: `Review the essential definitions and active recall prompt for ${initialConcept}.`,
        coreContent: `In ${subject}, mastering ${initialConcept} requires clarity on governing laws and boundary conditions. Key principles operate continuously: energy/information is conserved, states transform via precise mechanisms, and terms have exact technical definitions.`,
        interactiveTask: `Define the primary governing mechanism of ${initialConcept} in your own words without checking notes.`,
        hints: [
          { level: 1, title: 'Clarifying Question', content: 'What is the exact input and transformed output of this process?', revealed: false },
          { level: 2, title: 'Context Clue', content: 'Recall the specific terminology discussed in your diagnostic baseline.', revealed: false },
          { level: 3, title: 'Relevant Principle', content: 'The fundamental law states that changes occur in response to gradients or state transitions.', revealed: false },
          { level: 4, title: 'Partial Framework', content: 'Start your explanation with: "The core mechanism begins with [Input] and converts it into [Output] via [Process]..."', revealed: false },
          { level: 5, title: 'Full Worked Example', content: `Complete definition: "${initialConcept} operates by transforming initial states through systematic interactions into stable terminal states."`, revealed: false },
        ],
        formativeQuestion: {
          prompt: `Why is understanding ${initialConcept} necessary before progressing to advanced system modeling?`,
          expectedEvidence: `Explains dependency of higher-order mechanisms on foundational invariants.`,
          solutionExplanation: `Foundational concepts provide the axioms upon which complex multi-variable analysis is constructed.`,
        },
        status: 'in_progress',
      },
      {
        id: `act-1-2`,
        phaseId: `phase-1`,
        title: `Worked Example: Deconstructing ${initialConcept}`,
        concept: initialConcept,
        bloomTarget: 'understand',
        type: 'worked_example',
        instruction: `Walk through a step-by-step expert solution to understand how professionals reason about this domain.`,
        coreContent: `Expert Problem Solving Framework:\n1. State Given Variables\n2. Identify Governing Invariant\n3. Formulate the Transition Equation\n4. Verify Boundary Conditions & Units`,
        interactiveTask: `Identify the critical pivot step in the worked example and explain why alternative shortcuts fail.`,
        hints: [
          { level: 1, title: 'Hint', content: 'Look closely at Step 2 where the invariant is identified.', revealed: false },
          { level: 2, title: 'Principle', content: 'Without verifying invariants, subsequent calculations carry silent errors.', revealed: false },
          { level: 3, title: 'Worked Solution', content: 'The pivot step is verifying that boundary conditions hold prior to executing algebraic substitution.', revealed: false },
          { level: 4, title: 'Extended Guide', content: 'Notice how unit consistency is maintained throughout.', revealed: false },
          { level: 5, title: 'Final Summary', content: 'Invariant check guarantees mathematical and physical validity.', revealed: false },
        ],
        formativeQuestion: {
          prompt: `What common error happens if step 2 (identifying governing invariants) is skipped?`,
          expectedEvidence: `Explains silent failure or applying inappropriate formulas outside domain assumptions.`,
          solutionExplanation: `Skipping invariants leads to applying formulas outside their valid operational regime.`,
        },
        status: 'pending',
      },
    ],
  });

  // Phase 2: Guided & Independent Application
  const secondConcept = domains[1] || `${subject} Systems`;
  phases.push({
    phaseId: `phase-2-${Date.now()}`,
    phaseNumber: 2,
    title: 'Guided & Independent Application',
    objective: `Apply foundational principles to standard problems, scenarios, and quantitative cases.`,
    prerequisites: ['Foundational Knowledge & Gap Remediation'],
    concepts: [secondConcept, 'Problem Solving Frameworks', 'Scenario Execution'],
    bloomTarget: 'apply',
    masteryThreshold: 80,
    estimatedTimeMinutes: 60,
    status: 'locked',
    overallPhaseMastery: Math.min(65, profile.bloom.apply.score),
    activities: [
      {
        id: `act-2-1`,
        phaseId: `phase-2`,
        title: `Guided Practice: Applying Principles in ${secondConcept}`,
        concept: secondConcept,
        bloomTarget: 'apply',
        type: 'guided_practice',
        instruction: `Solve an applied scenario using the scaffolding hints whenever you feel uncertain.`,
        coreContent: `Application requires mapping abstract laws to concrete operational parameters. Identify what is known, what is sought, and select the appropriate operator.`,
        interactiveTask: `Execute the 3-step solution to solve the applied case study for ${secondConcept}.`,
        hints: [
          { level: 1, title: 'Clarifying Question', content: 'What specific parameters are explicitly given in the problem statement?', revealed: false },
          { level: 2, title: 'Operational Hint', content: 'Apply the standard transform rule derived in Phase 1.', revealed: false },
          { level: 3, title: 'Principle', content: 'Remember that external perturbations alter rate constants.', revealed: false },
          { level: 4, title: 'Partial Solution', content: 'Intermediate step: calculate the baseline flux before applying the external coefficient.', revealed: false },
          { level: 5, title: 'Full Solution', content: 'Final result combines baseline flux with coefficient to yield the net equilibrium state.', revealed: false },
        ],
        formativeQuestion: {
          prompt: `What criterion confirms your calculated result is physically or logically feasible?`,
          expectedEvidence: `Checks boundary values, positive quantities, and conservation constraints.`,
          solutionExplanation: `Feasibility is confirmed when results satisfy boundary constraints and conservation laws.`,
        },
        status: 'pending',
      },
    ],
  });

  // Phase 3: Analytical Decomposition & Error Diagnosis
  const thirdConcept = domains[2] || `${subject} Comparative Dynamics`;
  phases.push({
    phaseId: `phase-3-${Date.now()}`,
    phaseNumber: 3,
    title: 'Analytical Decomposition & Error Diagnosis',
    objective: `Deconstruct multi-variable systems, diagnose anomalies, and isolate causal relationships.`,
    prerequisites: ['Guided & Independent Application'],
    concepts: [thirdConcept, 'Root Cause Analysis', 'Multi-Variable Dynamics'],
    bloomTarget: 'analyze',
    masteryThreshold: 80,
    estimatedTimeMinutes: 75,
    status: 'locked',
    overallPhaseMastery: Math.min(55, profile.bloom.analyze.score),
    activities: [
      {
        id: `act-3-1`,
        phaseId: `phase-3`,
        title: `Error Diagnosis & Comparative Analysis in ${thirdConcept}`,
        concept: thirdConcept,
        bloomTarget: 'analyze',
        type: 'independent_problem',
        instruction: `Analyze an erroneous case study, locate the exact conceptual failure, and prove why it collapses.`,
        coreContent: `Analytical mastery is demonstrated by identifying where a model or implementation breaks. Distinguish between syntax/calculation slips and deeper structural misconceptions.`,
        interactiveTask: `Write an error diagnosis report identifying the root anomaly and proposing the corrected mathematical or logical structure.`,
        hints: [
          { level: 1, title: 'Focus Area', content: 'Check whether the author assumed independence where coupling exists.', revealed: false },
          { level: 2, title: 'Diagnostic Clue', content: 'Look at the interaction term between the two primary variables.', revealed: false },
          { level: 3, title: 'Theoretical Law', content: 'Coupled systems cannot be solved as separate isolated linear sums.', revealed: false },
          { level: 4, title: 'Partial Proof', content: 'The failure arises because variable A modulates the decay rate of variable B.', revealed: false },
          { level: 5, title: 'Full Correction', content: 'Incorporate the joint feedback term into the governing system equations.', revealed: false },
        ],
        formativeQuestion: {
          prompt: `Why does ignoring coupling between variables lead to catastrophic failure in analytical predictions?`,
          expectedEvidence: `Explains nonlinear amplification and feedback loops.`,
          solutionExplanation: `Coupled dynamics create feedback loops that invalidate simple linear superposition assumptions.`,
        },
        status: 'pending',
      },
    ],
  });

  // Phase 4: Synthesis, Creation & Transfer
  phases.push({
    phaseId: `phase-4-${Date.now()}`,
    phaseNumber: 4,
    title: 'Synthesis, Original Creation & Transfer',
    objective: `Synthesize comprehensive domain mastery to design original solutions and transfer knowledge to novel fields.`,
    prerequisites: ['Analytical Decomposition & Error Diagnosis'],
    concepts: ['Cross-Domain Transfer', 'Original Model Design', 'Empirical Evaluation'],
    bloomTarget: 'create',
    masteryThreshold: 85,
    estimatedTimeMinutes: 90,
    status: 'locked',
    overallPhaseMastery: Math.min(40, profile.bloom.create.score),
    activities: [
      {
        id: `act-4-1`,
        phaseId: `phase-4`,
        title: `Creation Capstone: Design an Original Architecture in ${subject}`,
        concept: 'Capstone Synthesis',
        bloomTarget: 'create',
        type: 'creation_project',
        instruction: `Synthesize your accumulated knowledge to engineer an original solution or experiment addressing an open challenge.`,
        coreContent: `True mastery culminates in creation: integrating constraints, choosing tradeoffs, establishing rigorous evaluation criteria, and demonstrating robust transfer.`,
        interactiveTask: `Draft an original system specification or experimental protocol for an unsolved or complex challenge in ${subject}.`,
        hints: [
          { level: 1, title: 'Guiding Question', content: 'What novel constraint or objective does your design optimize for?', revealed: false },
          { level: 2, title: 'Design Tip', content: 'Explicitly state your assumptions, components, and verification metric.', revealed: false },
          { level: 3, title: 'Tradeoff Matrix', content: 'Construct a criteria rubric comparing your design against standard conventions.', revealed: false },
          { level: 4, title: 'Scaffolding Outline', content: 'Structure your proposal into: 1. Objective, 2. Architecture, 3. Invariant Safety, 4. Verification.', revealed: false },
          { level: 5, title: 'Exemplar Model', content: 'Exemplar designs define clear interfaces, measurable tolerances, and fallback behaviors.', revealed: false },
        ],
        formativeQuestion: {
          prompt: `How does your original design handle unforeseen stress or boundary condition violations?`,
          expectedEvidence: `Specifies graceful degradation, automated failsafes, or boundary containment.`,
          solutionExplanation: `Robust systems incorporate defensive boundaries to maintain invariant integrity during extreme operating conditions.`,
        },
        status: 'pending',
      },
    ],
  });

  return {
    pathwayId: `pathway-${Date.now()}`,
    learnerId: profile.learnerId,
    subject: profile.subject,
    goal: profile.goal,
    phases,
    currentPhaseIndex: 0,
    currentActivityId: phases[0]?.activities[0]?.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
