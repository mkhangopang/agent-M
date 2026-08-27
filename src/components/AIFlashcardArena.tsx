import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  RefreshCw,
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Layers,
  Brain,
  RotateCw,
  Zap,
} from 'lucide-react';
import { AIGeneratedFlashcard, BloomLevel, OllamaConfig } from '../types';
import { ollamaService } from '../lib/ollamaClient';

interface AIFlashcardArenaProps {
  activeSubject?: string;
  ollamaConfig: OllamaConfig;
}

const DEFAULT_CARDS: Record<string, AIGeneratedFlashcard[]> = {
  'Computer Science': [
    {
      id: 'cs-card-1',
      subject: 'Computer Science',
      domain: 'Distributed Systems',
      concept: 'CAP Theorem Invariant',
      frontPrompt: 'Why is it impossible for a distributed system over an asynchronous network to provide both Consistency and Availability during a Network Partition?',
      backExplanation: 'Because when network links fail (Partition), nodes cannot coordinate state atomically. To maintain Consistency, you must reject writes on isolated nodes (sacrificing Availability). To remain Available, you must accept writes that cannot sync (sacrificing Consistency).',
      bloomLevel: 'analyze',
      difficulty: 'medium',
      repetitions: 1,
      intervalDays: 1,
      easeFactor: 2.5,
      nextReviewDate: new Date().toISOString(),
    },
    {
      id: 'cs-card-2',
      subject: 'Computer Science',
      domain: 'Concurrency',
      concept: 'Deadlock Necessary Conditions (Coffman)',
      frontPrompt: 'State the four Coffman conditions required simultaneously for a deadlock to occur.',
      backExplanation: '1. Mutual Exclusion (non-shareable resources)\n2. Hold and Wait (holding resources while requesting others)\n3. No Preemption (resources cannot be forcibly confiscated)\n4. Circular Wait (a closed chain of threads waiting for each other). Eliminating ANY one condition prevents deadlock.',
      bloomLevel: 'remember',
      difficulty: 'hard',
      repetitions: 0,
      intervalDays: 1,
      easeFactor: 2.5,
      nextReviewDate: new Date().toISOString(),
    },
  ],
  Biology: [
    {
      id: 'bio-card-1',
      subject: 'Biology',
      domain: 'Cellular Respiration',
      concept: 'Chemiosmotic ATP Synthesis Coupling',
      frontPrompt: 'How does the mitochondrial electron transport chain drive ATP synthesis through ATP synthase without direct chemical phosphorylation?',
      backExplanation: 'Protons (H+) are pumped across the inner mitochondrial membrane into the intermembrane space, creating an electrochemical proton gradient (proton-motive force). As protons flow down their gradient back into the matrix through ATP synthase, rotor rotation catalyzes ADP + Pi into ATP.',
      bloomLevel: 'understand',
      difficulty: 'medium',
      repetitions: 1,
      intervalDays: 2,
      easeFactor: 2.5,
      nextReviewDate: new Date().toISOString(),
    },
  ],
};

export const AIFlashcardArena: React.FC<AIFlashcardArenaProps> = ({
  activeSubject = 'Computer Science',
  ollamaConfig,
}) => {
  const [subject, setSubject] = useState(activeSubject);
  const [cards, setCards] = useState<AIGeneratedFlashcard[]>(() => {
    return DEFAULT_CARDS[activeSubject] || DEFAULT_CARDS['Computer Science'];
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [masteredCount, setMasteredCount] = useState(0);

  useEffect(() => {
    setSubject(activeSubject);
    const existing = DEFAULT_CARDS[activeSubject] || DEFAULT_CARDS['Computer Science'];
    setCards(existing);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [activeSubject]);

  const handleGenerateCards = async () => {
    setIsGenerating(true);
    const topicToUse = customTopic.trim() || subject;

    const prompt = `Generate 4 high-yield active-recall conceptual flashcards for subject: "${subject}", topic: "${topicToUse}".
Return a valid JSON array of objects with keys:
[
  {
    "id": "card-${Date.now()}-1",
    "subject": "${subject}",
    "domain": "Domain Name",
    "concept": "Concept Title",
    "frontPrompt": "Deep conceptual or diagnostic question testing first-principles understanding (no trivial yes/no questions)",
    "backExplanation": "Clear, concise mental model explaining the mechanism and invariant",
    "bloomLevel": "understand",
    "difficulty": "medium",
    "repetitions": 0,
    "intervalDays": 1,
    "easeFactor": 2.5,
    "nextReviewDate": "${new Date().toISOString()}"
  }
]`;

    try {
      const fallbackCards: AIGeneratedFlashcard[] = [
        {
          id: `card-${Date.now()}-1`,
          subject,
          domain: topicToUse,
          concept: `Core Invariant of ${topicToUse}`,
          frontPrompt: `What is the primary governing equation or invariant mechanism that dictates stability in ${topicToUse}?`,
          backExplanation: `In ${topicToUse}, equilibrium is preserved when internal energy/state transitions match boundary constraints. Violating this leads to cascade divergence.`,
          bloomLevel: 'understand',
          difficulty: 'medium',
          repetitions: 0,
          intervalDays: 1,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        },
        {
          id: `card-${Date.now()}-2`,
          subject,
          domain: topicToUse,
          concept: `Common Failure Mode in ${topicToUse}`,
          frontPrompt: `What is the most common diagnostic misconception when analyzing ${topicToUse}?`,
          backExplanation: `Learners frequently confuse transient intermediate states with terminal equilibrium. Always verify boundary conditions first.`,
          bloomLevel: 'analyze',
          difficulty: 'hard',
          repetitions: 0,
          intervalDays: 1,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        },
      ];

      const result = await ollamaService.generateStructured<AIGeneratedFlashcard[]>(
        'You are an expert cognitive learning designer. Return valid JSON array only.',
        prompt,
        {
          queryForVectorContext: `${subject} ${topicToUse} concepts`,
          subject,
          fallbackGenerator: () => fallbackCards,
        }
      );

      if (Array.isArray(result.data) && result.data.length > 0) {
        setCards(result.data);
        setCurrentIndex(0);
        setIsFlipped(false);
      }
    } catch (e) {
      console.error('Failed to generate flashcards:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRateCard = (qualityGrade: number) => {
    // SM-2 Spaced Repetition Logic
    const currentCard = cards[currentIndex];
    if (!currentCard) return;

    let newEase = currentCard.easeFactor + (0.1 - (5 - qualityGrade) * (0.08 + (5 - qualityGrade) * 0.02));
    if (newEase < 1.3) newEase = 1.3;

    let newInterval = 1;
    let newRepetitions = currentCard.repetitions;

    if (qualityGrade >= 3) {
      if (newRepetitions === 0) newInterval = 1;
      else if (newRepetitions === 1) newInterval = 3;
      else newInterval = Math.round(currentCard.intervalDays * newEase);
      newRepetitions++;
      if (qualityGrade === 5) setMasteredCount(prev => prev + 1);
    } else {
      newRepetitions = 0;
      newInterval = 1;
    }

    // Move to next card
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      try {
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
      } catch {}
      setIsFlipped(false);
      setCurrentIndex(0);
    }
  };

  const currentCard = cards[currentIndex] || cards[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800">
                Spaced Repetition & Active Retrieval
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-mono">
                {ollamaConfig.isReachable ? `AI Powered (${ollamaConfig.selectedModel})` : 'Offline Mode'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              AI Retrieval Flashcard Arena
            </h1>
          </div>

          {/* Generator Controls */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={customTopic}
              onChange={e => setCustomTopic(e.target.value)}
              placeholder="Custom concept or topic..."
              className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-44"
            />
            <button
              onClick={handleGenerateCards}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Synthesizing...' : 'Generate Cards'}</span>
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            Card {currentIndex + 1} of {cards.length}
          </span>
          <span>Mastered this session: {masteredCount}</span>
        </div>
      </div>

      {/* Flashcard Interactive Stage */}
      {currentCard ? (
        <div className="space-y-6">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="min-h-[280px] sm:min-h-[320px] rounded-3xl bg-slate-900 border-2 border-indigo-900/60 p-8 sm:p-12 shadow-2xl flex flex-col justify-between cursor-pointer transition-all hover:border-indigo-600/80 group select-none relative overflow-hidden"
          >
            {/* Top Card Metadata */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-950 text-indigo-400 border border-slate-800">
                {currentCard.domain} • {currentCard.concept}
              </span>
              <span className="text-xs text-slate-400 flex items-center space-x-1 group-hover:text-indigo-300 transition-colors">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Click or tap to flip</span>
              </span>
            </div>

            {/* Main Prompt / Answer Area */}
            <div className="py-6 text-center space-y-4">
              {!isFlipped ? (
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Active Recall Challenge
                  </span>
                  <p className="text-lg sm:text-xl font-bold text-white leading-relaxed max-w-2xl mx-auto">
                    {currentCard.frontPrompt}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
                    Core Explanation & Mental Model
                  </span>
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl mx-auto whitespace-pre-wrap">
                    {currentCard.backExplanation}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Card Footer */}
            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
              <span>Bloom Level: {currentCard.bloomLevel}</span>
              <span>Difficulty: {currentCard.difficulty}</span>
            </div>
          </div>

          {/* SM-2 Self-Assessment Grading Buttons (Visible when flipped) */}
          {isFlipped && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block text-center">
                Rate your retrieval quality to schedule next review:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => handleRateCard(1)}
                  className="py-3 rounded-2xl bg-rose-950/80 hover:bg-rose-900/90 border border-rose-800 text-rose-200 text-xs font-semibold transition-all cursor-pointer text-center"
                >
                  <span className="block font-bold">1 - Forgot</span>
                  <span className="text-[10px] text-rose-400">Review in 10m</span>
                </button>
                <button
                  onClick={() => handleRateCard(2)}
                  className="py-3 rounded-2xl bg-amber-950/80 hover:bg-amber-900/90 border border-amber-800 text-amber-200 text-xs font-semibold transition-all cursor-pointer text-center"
                >
                  <span className="block font-bold">2 - Hard</span>
                  <span className="text-[10px] text-amber-400">Review tomorrow</span>
                </button>
                <button
                  onClick={() => handleRateCard(4)}
                  className="py-3 rounded-2xl bg-blue-950/80 hover:bg-blue-900/90 border border-blue-800 text-blue-200 text-xs font-semibold transition-all cursor-pointer text-center"
                >
                  <span className="block font-bold">3 - Good</span>
                  <span className="text-[10px] text-blue-400">Review in 3 days</span>
                </button>
                <button
                  onClick={() => handleRateCard(5)}
                  className="py-3 rounded-2xl bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-800 text-emerald-200 text-xs font-semibold transition-all cursor-pointer text-center"
                >
                  <span className="block font-bold">4 - Easy</span>
                  <span className="text-[10px] text-emerald-400">Review in 7 days</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
