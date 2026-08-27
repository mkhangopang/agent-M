import React, { useState } from 'react';
import {
  Brain,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  HelpCircle,
  Sparkles,
  Sliders,
  Database,
  Layers,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  BloomLevel,
  DiagnosticAnswerEvaluation,
  DiagnosticQuestion,
  DiagnosticState,
} from '../types';
import { vectorDb } from '../lib/vectorDb';
import { ollamaService } from '../lib/ollamaClient';

interface DiagnosticViewProps {
  diagnosticState: DiagnosticState;
  currentQuestion: DiagnosticQuestion;
  onSubmitAnswer: (answer: string, confidenceRating?: number) => Promise<DiagnosticAnswerEvaluation>;
  onProceedToNext: () => void;
  onCompleteDiagnostic: () => void;
  isEvaluating: boolean;
  lastEvaluation: DiagnosticAnswerEvaluation | null;
  onMutateQuestion?: (newQuestion: DiagnosticQuestion) => void;
  onOpenAIChat?: (concept?: string) => void;
}

const BLOOM_COLORS: Record<BloomLevel, { bg: string; text: string; border: string }> = {
  remember: { bg: 'bg-blue-950/60', text: 'text-blue-300', border: 'border-blue-700/60' },
  understand: { bg: 'bg-emerald-950/60', text: 'text-emerald-300', border: 'border-emerald-700/60' },
  apply: { bg: 'bg-amber-950/60', text: 'text-amber-300', border: 'border-amber-700/60' },
  analyze: { bg: 'bg-purple-950/60', text: 'text-purple-300', border: 'border-purple-700/60' },
  evaluate: { bg: 'bg-rose-950/60', text: 'text-rose-300', border: 'border-rose-700/60' },
  create: { bg: 'bg-indigo-950/60', text: 'text-indigo-300', border: 'border-indigo-700/60' },
};

export const DiagnosticView: React.FC<DiagnosticViewProps> = ({
  diagnosticState,
  currentQuestion,
  onSubmitAnswer,
  onProceedToNext,
  onCompleteDiagnostic,
  isEvaluating,
  lastEvaluation,
  onMutateQuestion,
  onOpenAIChat,
}) => {
  const [answerText, setAnswerText] = useState('');
  const [confidence, setConfidence] = useState<number>(75);
  const [showConfidence, setShowConfidence] = useState(true);
  const [showVectorContext, setShowVectorContext] = useState(false);
  const [isMutatingQuestion, setIsMutatingQuestion] = useState(false);

  // Retrieve vector context for current question
  const vectorSources = React.useMemo(() => {
    return vectorDb.search(`${currentQuestion.domain} ${currentQuestion.question}`, {
      subject: currentQuestion.subject,
      topK: 2,
    });
  }, [currentQuestion]);

  const handleMutateQuestionWithAI = async () => {
    if (!onMutateQuestion || isMutatingQuestion) return;
    setIsMutatingQuestion(true);

    try {
      const prompt = `Generate a completely novel, realistic diagnostic problem for:
Subject: "${currentQuestion.subject}"
Domain: "${currentQuestion.domain}"
Bloom Level: "${currentQuestion.bloomLevel}"
Difficulty: "${currentQuestion.difficulty}"

Make it an authentic real-world scenario or applied problem.
Return valid JSON only matching:
{
  "id": "dyn-q-${Date.now()}",
  "questionNumber": ${currentQuestion.questionNumber},
  "subject": "${currentQuestion.subject}",
  "domain": "${currentQuestion.domain}",
  "bloomLevel": "${currentQuestion.bloomLevel}",
  "difficulty": "${currentQuestion.difficulty}",
  "questionType": "open_response",
  "question": "Clear, direct, challenging problem prompt",
  "contextScenario": "Realistic workplace, laboratory, or systems engineering scenario setting the stage",
  "rubric": {
    "noUnderstanding": "Fails to identify core mechanism",
    "partialUnderstanding": "Identifies some factors but misses boundary invariants",
    "thoroughUnderstanding": "Fully articulates governing principles and edge-cases"
  },
  "estimatedTimeSeconds": 90
}`;

      const fallback: DiagnosticQuestion = {
        id: `dyn-q-${Date.now()}`,
        questionNumber: currentQuestion.questionNumber,
        subject: currentQuestion.subject,
        domain: currentQuestion.domain,
        bloomLevel: currentQuestion.bloomLevel,
        difficulty: currentQuestion.difficulty,
        questionType: 'open_response',
        question: `In an active production system in ${currentQuestion.domain}, an unexpected anomaly causes state divergence under 2x load. How do you isolate the root cause and restore deterministic equilibrium?`,
        contextScenario: `You are acting as lead diagnostic auditor for a high-availability ${currentQuestion.subject} pipeline.`,
        rubric: {
          noUnderstanding: 'Fails to address state invariants',
          partialUnderstanding: 'Suggests ad-hoc restarts without isolating the root cause',
          thoroughUnderstanding: 'Applies rigorous first-principles analysis and proposes bounded, idempotent mitigation',
        },
        expectedEvidence: 'Identification of state invariant divergence, isolation strategy, and idempotent mitigation.',
      };

      const res = await ollamaService.generateStructured<DiagnosticQuestion>(
        'You are an expert diagnostic exam architect. Return valid JSON only.',
        prompt,
        {
          queryForVectorContext: `${currentQuestion.domain} assessment`,
          subject: currentQuestion.subject,
          fallbackGenerator: () => fallback,
        }
      );

      onMutateQuestion(res.data);
      setAnswerText('');
    } catch (e) {
      console.error('Failed to mutate question:', e);
    } finally {
      setIsMutatingQuestion(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim() || isEvaluating) return;
    await onSubmitAnswer(answerText, showConfidence ? confidence : undefined);
  };

  const handleNext = () => {
    setAnswerText('');
    setConfidence(75);
    if (diagnosticState.currentQuestionIndex >= diagnosticState.totalEstimatedQuestions - 1) {
      onCompleteDiagnostic();
    } else {
      onProceedToNext();
    }
  };

  const bloomStyle = BLOOM_COLORS[currentQuestion.bloomLevel] || BLOOM_COLORS.understand;
  const progressPercent = Math.min(
    100,
    Math.round(((diagnosticState.currentQuestionIndex + 1) / diagnosticState.totalEstimatedQuestions) * 100)
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header & Adaptive Progress */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                {diagnosticState.subject} Diagnostic
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-medium text-slate-400">
                Phase: {diagnosticState.currentPhase.replace(/_/g, ' ')}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
              Question {diagnosticState.currentQuestionIndex + 1} of ~{diagnosticState.totalEstimatedQuestions}
            </h2>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${bloomStyle.bg} ${bloomStyle.text} ${bloomStyle.border}`}
            >
              Bloom: {currentQuestion.bloomLevel}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-300">
              {currentQuestion.difficulty}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 border border-slate-700/80 text-emerald-400">
              {currentQuestion.domain}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Adaptive Evidence Accumulation</span>
            <span>{progressPercent}% Complete</span>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Question & Answer Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Question Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Diagnostic Prompt ({currentQuestion.questionType.replace(/_/g, ' ')})</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Llama Dynamic Question Mutator */}
            <button
              type="button"
              onClick={handleMutateQuestionWithAI}
              disabled={isMutatingQuestion || isEvaluating}
              className="px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/80 text-indigo-300 text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Generate a fresh, unique real-world scenario question with local Llama"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isMutatingQuestion ? 'animate-spin' : ''}`} />
              <span>{isMutatingQuestion ? 'Synthesizing...' : '✨ Generate Novel Scenario (Llama)'}</span>
            </button>

            {/* Socratic AI Mentor trigger */}
            {onOpenAIChat && (
              <button
                type="button"
                onClick={() => onOpenAIChat(`${currentQuestion.domain}: ${currentQuestion.question}`)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer"
                title="Open Socratic Copilot drawer for guidance"
              >
                <Brain className="w-3.5 h-3.5 text-indigo-400" />
                <span>🧠 Socratic Copilot</span>
              </button>
            )}
          </div>
        </div>

        {/* Question Text */}
        <div className="space-y-3">
          <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed">
            {currentQuestion.question}
          </p>

          {/* Context scenario if present */}
          {currentQuestion.contextScenario && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 italic">
              <strong>Scenario Context:</strong> {currentQuestion.contextScenario}
            </div>
          )}
        </div>

        {/* Injected Local Vector DB Grounding Context (Collapsible) */}
        {vectorSources.length > 0 && (
          <div className="border border-slate-800 rounded-2xl bg-slate-950/70 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowVectorContext(!showVectorContext)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  Local Vector DB Grounding ({vectorSources.length} relevant reference chunks retrieved in &lt;2ms)
                </span>
              </div>
              {showVectorContext ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showVectorContext && (
              <div className="p-4 border-t border-slate-800 space-y-3 text-xs">
                {vectorSources.map((vs, idx) => (
                  <div key={vs.document.id || idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-semibold text-indigo-300">
                        {vs.document.domain} — {vs.document.topic}
                      </span>
                      <span className="font-mono text-emerald-400">
                        Similarity: {(vs.similarityScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{vs.document.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* If Not Evaluated Yet: Show Input Form */}
        {!lastEvaluation ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="diagnostic-answer-textarea" className="block text-xs font-medium text-slate-300 flex justify-between">
                <span>Your Answer & Reasoning</span>
                <span className="text-slate-500">Explain your thought process openly</span>
              </label>
              <textarea
                id="diagnostic-answer-textarea"
                rows={5}
                value={answerText}
                onChange={e => setAnswerText(e.target.value)}
                placeholder="Type your response here... Include explanations, equations, or examples as appropriate."
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
                disabled={isEvaluating}
                required
              />
            </div>

            {/* Metacognitive Confidence Calibration Slider */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    Metacognitive Calibration: How confident are you in this answer?
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-300 font-mono">{confidence}%</span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={confidence}
                onChange={e => setConfidence(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer"
                disabled={isEvaluating}
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                <span>0% (Uncertain / Guessing)</span>
                <span>50% (Moderate)</span>
                <span>100% (Absolute Certainty)</span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end">
              <button
                id="submit-diagnostic-answer-btn"
                type="submit"
                disabled={isEvaluating || !answerText.trim()}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm flex items-center space-x-2 shadow-md shadow-indigo-950/50 transition-all"
              >
                {isEvaluating ? (
                  <>
                    <Brain className="w-4 h-4 animate-spin" />
                    <span>Evaluating Response & Updating Rubric...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Answer</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Feedback Card After Submission */
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm font-bold text-white">Formative Evaluation & Feedback</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-400">
                    Rubric Tier: <strong className="text-slate-200 capitalize">{lastEvaluation.rubricTier.replace(/([A-Z])/g, ' $1')}</strong>
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-950 border border-indigo-700 text-indigo-300 font-mono">
                    Score: {lastEvaluation.score} / 100
                  </span>
                </div>
              </div>

              {/* Misconception Alert if Triggered */}
              {lastEvaluation.isMisconception && lastEvaluation.misconceptionDetails && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200 space-y-1.5 text-xs">
                  <div className="flex items-center space-x-2 font-bold text-rose-300">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Misconception Detected: {lastEvaluation.misconceptionDetails.concept}</span>
                  </div>
                  <p className="text-rose-300/90">
                    <strong>Observed working intuition:</strong> {lastEvaluation.misconceptionDetails.learnerBelief}
                  </p>
                  <p className="text-rose-100 font-medium">
                    <strong>Correct Principle:</strong> {lastEvaluation.misconceptionDetails.expectedConcept}
                  </p>
                </div>
              )}

              {/* Structured Feedback Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="font-bold text-emerald-400 block">✓ Demonstrated Strength</span>
                  <p className="text-slate-300 leading-relaxed">{lastEvaluation.feedback.whatWasCorrect}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="font-bold text-amber-400 block">⚡ Targeted Improvement</span>
                  <p className="text-slate-300 leading-relaxed">{lastEvaluation.feedback.whatNeedsImprovement}</p>
                </div>
              </div>

              {/* Actionable takeaway */}
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200">
                <strong className="text-indigo-300">Actionable Takeaway:</strong> {lastEvaluation.feedback.actionableImprovement}
              </div>

              {/* Metacognitive Calibration Note */}
              {typeof lastEvaluation.calibrationDelta === 'number' && (
                <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                  <span>Confidence Calibration:</span>
                  <strong className="text-slate-300">
                    {Math.abs(lastEvaluation.calibrationDelta) <= 15
                      ? 'Well-calibrated self-awareness'
                      : lastEvaluation.calibrationDelta > 15
                      ? `Overconfident by +${lastEvaluation.calibrationDelta} pts`
                      : `Underconfident by ${lastEvaluation.calibrationDelta} pts`}
                  </strong>
                </div>
              )}
            </div>

            {/* Next Action Button */}
            <div className="flex items-center justify-end">
              <button
                id="next-diagnostic-question-btn"
                onClick={handleNext}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center space-x-2 shadow-lg shadow-emerald-950/40 transition-all"
              >
                <span>
                  {diagnosticState.currentQuestionIndex >= diagnosticState.totalEstimatedQuestions - 1
                    ? 'Generate Diagnostic Report & Pathway'
                    : 'Proceed to Next Adaptive Question'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
