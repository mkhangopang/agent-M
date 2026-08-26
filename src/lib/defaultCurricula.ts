/**
 * Default Curricula & Question Banks for PLIA
 * Multi-subject coverage across Bloom's Taxonomy and Cognitive Complexity tiers.
 */

import { DiagnosticQuestion } from '../types';

export interface SubjectCurriculumTemplate {
  subject: string;
  domains: string[];
  intakeQuestions: DiagnosticQuestion[];
  baselineQuestions: DiagnosticQuestion[];
  cognitiveQuestions: DiagnosticQuestion[];
  metacognitiveQuestions: DiagnosticQuestion[];
}

export const SUBJECT_CURRICULA: Record<string, SubjectCurriculumTemplate> = {
  Biology: {
    subject: 'Biology',
    domains: ['Cellular Respiration', 'Genetics', 'Ecology', 'Evolution', 'Physiology'],
    intakeQuestions: [
      {
        id: 'bio-intake-1',
        questionNumber: 1,
        subject: 'Biology',
        domain: 'Learner Intake',
        bloomLevel: 'understand',
        difficulty: 'easy',
        questionType: 'explanation',
        question: 'To start our diagnostic, tell me what specific area or goal in Biology you want to focus on (e.g., cell biology, genetics, exam prep, or practical application), and what prior biology courses or experience you have.',
        expectedEvidence: 'Clear articulation of learner goal, scope of interest, and prior academic background.',
        rubric: {
          noUnderstanding: 'Vague or non-responsive answer with no subject details.',
          partialUnderstanding: 'Mentions a general topic or goal without clear scope.',
          thoroughUnderstanding: 'Clearly defines target biology subfield, specific learning goal, and prior baseline.',
        },
      },
    ],
    baselineQuestions: [
      {
        id: 'bio-base-1',
        questionNumber: 2,
        subject: 'Biology',
        domain: 'Cellular Respiration',
        bloomLevel: 'remember',
        difficulty: 'easy',
        questionType: 'factual_recall',
        question: 'What is the primary chemical energy currency produced in cellular respiration, and in which organelle does the majority of its aerobic production occur?',
        expectedEvidence: 'Identifies ATP (Adenosine Triphosphate) and Mitochondria.',
        rubric: {
          noUnderstanding: 'Fails to name ATP or mitochondria; names incorrect molecules/organelles.',
          partialUnderstanding: 'Names ATP or mitochondria correctly, but confuses details or omits one.',
          thoroughUnderstanding: 'Explicitly identifies ATP as the energy currency and mitochondria as the site of aerobic production.',
        },
      },
      {
        id: 'bio-base-2',
        questionNumber: 3,
        subject: 'Biology',
        domain: 'Genetics',
        bloomLevel: 'understand',
        difficulty: 'easy',
        questionType: 'explanation',
        question: 'Explain in your own words the fundamental functional difference between DNA and RNA in a eukaryotic cell.',
        expectedEvidence: 'Explains DNA as double-stranded genetic blueprint/long-term storage in nucleus vs RNA as single-stranded messenger/translator (mRNA/tRNA/rRNA) in protein synthesis.',
        rubric: {
          noUnderstanding: 'Confuses DNA with protein; cannot distinguish functional roles.',
          partialUnderstanding: 'Notes structural difference (double vs single strand) or bases, but vague on operational roles in protein synthesis.',
          thoroughUnderstanding: 'Explains DNA as master genomic archive in nucleus and RNA as intermediary messenger and protein synthesis machinery.',
        },
      },
    ],
    cognitiveQuestions: [
      {
        id: 'bio-cog-1',
        questionNumber: 4,
        subject: 'Biology',
        domain: 'Cellular Respiration',
        bloomLevel: 'apply',
        difficulty: 'medium',
        questionType: 'scenario',
        question: 'A competitive sprinter runs a 400-meter dash at maximum effort and experiences severe muscle fatigue and a burning sensation. What metabolic pathway is predominantly operating in her muscle cells, and why does this pathway yield far less ATP per glucose molecule than aerobic respiration?',
        expectedEvidence: 'Identifies anaerobic glycolysis / lactic acid fermentation, lack of oxidative phosphorylation / Krebs cycle, yielding only 2 net ATP vs ~36-38 ATP.',
        rubric: {
          noUnderstanding: 'Attributes burning to muscle tears or aerobic energy without mentioning anaerobic glycolysis or fermentation.',
          partialUnderstanding: 'Mentions lactic acid or lack of oxygen, but fails to explain why only 2 ATP are produced via glycolysis alone.',
          thoroughUnderstanding: 'Accurately explains anaerobic glycolysis and lactic acid fermentation, noting that without oxygen, electrons cannot pass through the mitochondrial ETC, capping net yield at 2 ATP from glycolysis.',
        },
      },
      {
        id: 'bio-cog-2',
        questionNumber: 5,
        subject: 'Biology',
        domain: 'Genetics',
        bloomLevel: 'analyze',
        difficulty: 'medium',
        questionType: 'error_analysis',
        question: 'A student claims: "Dominant alleles are always beneficial, more common in populations, and will eventually eliminate recessive alleles over generations." Analyze this statement. Point out what is conceptually flawed, and provide one specific biological example to refute it.',
        expectedEvidence: 'Identifies misconception that dominance equals natural selection fitness or allele frequency. Cites Hardy-Weinberg equilibrium or real examples (e.g. Huntington disease is dominant but rare; Type O blood is recessive but common).',
        rubric: {
          noUnderstanding: 'Agrees with the student claim or shows misconception that dominant alleles always spread.',
          partialUnderstanding: 'Correctly states the claim is wrong, but lacks a clear theoretical explanation or clear biological counter-example.',
          thoroughUnderstanding: 'Critiques the flaw clearly: dominance describes phenotype masking in heterozygotes, while allele frequencies depend on evolutionary fitness and selection pressures. Provides valid example like Huntington or O blood group.',
        },
      },
      {
        id: 'bio-cog-3',
        questionNumber: 6,
        subject: 'Biology',
        domain: 'Ecology',
        bloomLevel: 'analyze',
        difficulty: 'difficult',
        questionType: 'reasoning',
        question: 'In an aquatic ecosystem, why is the biomass of top apex predators (such as sharks) typically orders of magnitude smaller than the biomass of primary producers (phytoplankton)? Explain through thermodynamic principles.',
        expectedEvidence: 'Explains the 10% rule / Second Law of Thermodynamics (entropy, metabolic heat loss, unassimilated biomass) across successive trophic transfers.',
        rubric: {
          noUnderstanding: 'Merely states predators eat more food without thermodynamic or trophic energy loss principles.',
          partialUnderstanding: 'Mentions energy is lost at each level, but does not quantify or connect to thermodynamic entropy/heat dissipation.',
          thoroughUnderstanding: 'Analytically explains the ~90% trophic energy loss at each step due to metabolic respiration and thermodynamic entropy, limiting sustainable apex biomass.',
        },
      },
      {
        id: 'bio-cog-4',
        questionNumber: 7,
        subject: 'Biology',
        domain: 'Physiology & Cellular Transport',
        bloomLevel: 'evaluate',
        difficulty: 'difficult',
        questionType: 'evidence_evaluation',
        question: 'A researcher proposes injecting pure distilled water into a patient suffering from extreme dehydration to rapidly restore cellular fluid volume. Evaluate the physiological consequences of this proposal on red blood cells using osmosis principles, and justify why isotonic saline (0.9% NaCl) is used instead.',
        expectedEvidence: 'Evaluates hypotonic environment causing water influx, cell swelling and lysis (hemolysis). Justifies isotonic solution preventing net osmotic flux.',
        rubric: {
          noUnderstanding: 'Believes distilled water is superior because it is pure.',
          partialUnderstanding: 'Mentions cells might burst, but lacks clear osmotic gradient terminology (hypotonic vs isotonic) or cellular mechanism.',
          thoroughUnderstanding: 'Rigorously evaluates the hypotonic gradient causing rapid osmotic influx and osmotic lysis (hemolysis), justifying isotonic 0.9% saline to maintain dynamic osmotic equilibrium.',
        },
      },
      {
        id: 'bio-cog-5',
        questionNumber: 8,
        subject: 'Biology',
        domain: 'Experimental Design & Evolution',
        bloomLevel: 'create',
        difficulty: 'difficult',
        questionType: 'creation',
        question: 'Design a controlled laboratory experiment to test whether a newly discovered bacterial strain evolves resistance to an antibiotic through spontaneous pre-existing mutations or through directed mutation induced by exposure to the drug. Specify your control, treatment, and how you will measure the outcome.',
        expectedEvidence: 'Proposes replica plating (Luria-Delbrück fluctuation test style) or pre-exposure isolation vs control plates to prove selection of pre-existing variants.',
        rubric: {
          noUnderstanding: 'Suggests exposing bacteria to drug without controls or mechanism to distinguish pre-existing vs induced mutation.',
          partialUnderstanding: 'Designs a basic antibiotic disk test, but does not isolate pre-exposure generational lineages or replica plating.',
          thoroughUnderstanding: 'Creates a robust experimental protocol (e.g. replica plating or fluctuation test) with positive/negative controls and lineage tracking to demonstrate selection of spontaneous mutations.',
        },
      },
    ],
    metacognitiveQuestions: [
      {
        id: 'bio-meta-1',
        questionNumber: 9,
        subject: 'Biology',
        domain: 'Metacognition',
        bloomLevel: 'evaluate',
        difficulty: 'medium',
        questionType: 'reasoning',
        question: 'Reflect on your problem-solving process during these questions. Which topic felt most intuitive, which felt most uncertain, and what specific strategy or representation (diagrams, analogies, practice problems) helps you master difficult scientific concepts?',
        expectedEvidence: 'Demonstrates self-monitoring, error awareness, and strategic learning insight.',
        rubric: {
          noUnderstanding: 'Dismissive or no reflection on personal learning strategy.',
          partialUnderstanding: 'Lists a topic without reflecting on cognitive strategy or uncertainty.',
          thoroughUnderstanding: 'Articulates clear metacognitive awareness of strengths, knowledge boundaries, and self-directed study methods.',
        },
      },
    ],
  },

  'Computer Science': {
    subject: 'Computer Science',
    domains: ['Data Structures', 'Algorithms', 'Asynchronous Systems', 'Software Architecture', 'Debugging'],
    intakeQuestions: [
      {
        id: 'cs-intake-1',
        questionNumber: 1,
        subject: 'Computer Science',
        domain: 'Learner Intake',
        bloomLevel: 'understand',
        difficulty: 'easy',
        questionType: 'explanation',
        question: 'Welcome! What is your primary objective in Computer Science (e.g. mastering core data structures & algorithms, system design, web backend, or preparing for technical interviews), and what programming languages have you worked with?',
        expectedEvidence: 'Articulates goal, background, and language comfort.',
        rubric: {
          noUnderstanding: 'No specific goal or language stated.',
          partialUnderstanding: 'Mentions a language or broad topic without depth.',
          thoroughUnderstanding: 'Clearly outlines target domain, programming stack, and specific mastery goals.',
        },
      },
    ],
    baselineQuestions: [
      {
        id: 'cs-base-1',
        questionNumber: 2,
        subject: 'Computer Science',
        domain: 'Data Structures',
        bloomLevel: 'remember',
        difficulty: 'easy',
        questionType: 'factual_recall',
        question: 'What is the average time complexity for searching, inserting, and deleting an element in a balanced Binary Search Tree (such as an AVL or Red-Black tree), and what is the worst-case complexity of a naive unbalanced BST?',
        expectedEvidence: 'Identifies O(log N) for balanced BST and O(N) worst case for unbalanced BST (degenerated to a linked list).',
        rubric: {
          noUnderstanding: 'Confuses BST complexity with O(1) or O(N^2).',
          partialUnderstanding: 'Mentions O(log N) for balanced but misses the O(N) degenerate case, or vice versa.',
          thoroughUnderstanding: 'Accurately specifies O(log N) average/balanced and O(N) worst-case linear degeneration.',
        },
      },
      {
        id: 'cs-base-2',
        questionNumber: 3,
        subject: 'Computer Science',
        domain: 'Data Structures',
        bloomLevel: 'understand',
        difficulty: 'easy',
        questionType: 'explanation',
        question: 'How does a Hash Table achieve average O(1) lookup time, and what happens under the hood when a hash collision occurs?',
        expectedEvidence: 'Explains hash function mapping key to array index, and collision resolution techniques (separate chaining with linked lists/trees or open addressing with probing).',
        rubric: {
          noUnderstanding: 'Cannot explain hash index mapping or collision.',
          partialUnderstanding: 'Explains index mapping but unclear on collision resolution mechanics.',
          thoroughUnderstanding: 'Clearly explains mathematical key hashing to index bucket and details collision strategies (chaining vs open addressing).',
        },
      },
    ],
    cognitiveQuestions: [
      {
        id: 'cs-cog-1',
        questionNumber: 4,
        subject: 'Computer Science',
        domain: 'Algorithms',
        bloomLevel: 'apply',
        difficulty: 'medium',
        questionType: 'problem_solving',
        question: 'You are given an unsorted array of N integers and need to find whether two numbers sum up to a target value K. Compare two approaches: a two-pointer approach requiring sorting first, versus a Hash Set approach. State their time and space complexities and explain which you would choose if memory is strictly constrained.',
        expectedEvidence: 'Sorting + 2-pointer: O(N log N) time, O(1) space. Hash Set: O(N) time, O(N) space. Recommends sorting + 2-pointer for strictly constrained memory.',
        rubric: {
          noUnderstanding: 'Proposes nested loop O(N^2) without analyzing time/space tradeoffs.',
          partialUnderstanding: 'Mentions hash set or sorting, but calculates incorrect Big O or fails to justify memory constraint.',
          thoroughUnderstanding: 'Correctly identifies O(N log N) / O(1) space for 2-pointer and O(N) / O(N) space for Hash Set, justifying 2-pointer when RAM is bottlenecked.',
        },
      },
      {
        id: 'cs-cog-2',
        questionNumber: 5,
        subject: 'Computer Science',
        domain: 'Asynchronous Systems',
        bloomLevel: 'analyze',
        difficulty: 'medium',
        questionType: 'error_analysis',
        question: 'Look at this scenario: A developer executes `setTimeout(() => console.log("A"), 0)`, then `Promise.resolve().then(() => console.log("B"))`, then `console.log("C")`. In what exact order will the letters print in a standard JavaScript/Node event loop environment, and why?',
        expectedEvidence: 'Output order: C -> B -> A. Synchronous execution runs first (C), Microtask queue drains next (Promise B), Macrotask queue timer executes last (setTimeout A).',
        rubric: {
          noUnderstanding: 'Guesses A -> B -> C or fails to recognize synchronous vs asynchronous priority.',
          partialUnderstanding: 'Gets order correct (C, B, A) by intuition but cannot explain microtask vs macrotask queue mechanics.',
          thoroughUnderstanding: 'Precisely gives C -> B -> A and analytically explains Call Stack -> Microtask Queue (Promises) -> Macrotask Queue (Timers).',
        },
      },
      {
        id: 'cs-cog-3',
        questionNumber: 6,
        subject: 'Computer Science',
        domain: 'Software Architecture',
        bloomLevel: 'evaluate',
        difficulty: 'difficult',
        questionType: 'comparison',
        question: 'Evaluate the tradeoffs of a Microservices architecture versus a Modular Monolith for a high-growth startup with a team of 6 engineers. Under what conditions is moving to microservices an architectural anti-pattern?',
        expectedEvidence: 'Evaluates network latency, distributed transactions, devops overhead, and cognitive load. Microservices are an anti-pattern when domain boundaries are fluid and team size is small.',
        rubric: {
          noUnderstanding: 'States microservices are always superior because of modern scalability hype.',
          partialUnderstanding: 'Mentions server costs or complexity, but lacks architectural depth on bounded contexts or operational overhead.',
          thoroughUnderstanding: 'Rigorously evaluates operational complexity, distributed debugging, network partitions, and team coordination, justifying a modular monolith until domain boundaries and organizational scale necessitate microservices.',
        },
      },
      {
        id: 'cs-cog-4',
        questionNumber: 7,
        subject: 'Computer Science',
        domain: 'System Design',
        bloomLevel: 'create',
        difficulty: 'difficult',
        questionType: 'creation',
        question: 'Design a resilient rate-limiter algorithm for an API gateway that must handle 50,000 requests/sec with a limit of 100 requests/minute per API key. Outline the data structure and concurrency strategy you would use (e.g. Token Bucket, Leaky Bucket, Sliding Window Log), and explain how you prevent race conditions.',
        expectedEvidence: 'Proposes Token Bucket or Sliding Window Counter with atomic Redis Lua script or local mutex / atomic CAS operations.',
        rubric: {
          noUnderstanding: 'Suggests a simple global counter with no concurrency safety or window tracking.',
          partialUnderstanding: 'Names Token Bucket or Sliding Window, but misses concurrency handling (race conditions, atomic updates).',
          thoroughUnderstanding: 'Creates a comprehensive architecture (Token Bucket or Sliding Window Counter) utilizing atomic increments (e.g. Redis Lua scripts or lock-free atomic CAS) to ensure sub-millisecond precision without race conditions.',
        },
      },
    ],
    metacognitiveQuestions: [
      {
        id: 'cs-meta-1',
        questionNumber: 8,
        subject: 'Computer Science',
        domain: 'Metacognition',
        bloomLevel: 'evaluate',
        difficulty: 'medium',
        questionType: 'reasoning',
        question: 'When you encounter a complex runtime bug or unexpected edge-case, walk me through your systematic debugging strategy. How do you isolate hypotheses instead of changing code randomly?',
        expectedEvidence: 'Articulates hypothesis generation, minimal reproducible example, binary search / logging / debugger step-through.',
        rubric: {
          noUnderstanding: 'Says they guess or change lines until it works.',
          partialUnderstanding: 'Mentions console.log or stack trace without a structured diagnostic framework.',
          thoroughUnderstanding: 'Explains a structured scientific method: reproducing minimally, forming falsifiable hypotheses, instrumenting assertions, and verifying boundaries.',
        },
      },
    ],
  },

  Physics: {
    subject: 'Physics',
    domains: ['Classical Mechanics', 'Thermodynamics', 'Electromagnetism', 'Wave Optics', 'Modern Physics'],
    intakeQuestions: [
      {
        id: 'phys-intake-1',
        questionNumber: 1,
        subject: 'Physics',
        domain: 'Learner Intake',
        bloomLevel: 'understand',
        difficulty: 'easy',
        questionType: 'explanation',
        question: 'What area of Physics are you aiming to master (e.g. mechanics, electromagnetism, AP/university physics, or conceptual understanding), and what is your mathematical background (algebra, calculus)?',
        expectedEvidence: 'States physics subfield and math comfort level.',
        rubric: {
          noUnderstanding: 'Vague response without topic or math level.',
          partialUnderstanding: 'Mentions general physics without math background.',
          thoroughUnderstanding: 'Clearly articulates physics goals, target concepts, and calculus/algebra foundations.',
        },
      },
    ],
    baselineQuestions: [
      {
        id: 'phys-base-1',
        questionNumber: 2,
        subject: 'Physics',
        domain: 'Classical Mechanics',
        bloomLevel: 'remember',
        difficulty: 'easy',
        questionType: 'factual_recall',
        question: 'State Newton Three Laws of Motion clearly, and write down the formula relating net force, mass, and acceleration.',
        expectedEvidence: 'First Law (Inertia), Second Law (F_net = m*a), Third Law (Equal and opposite action-reaction on distinct bodies).',
        rubric: {
          noUnderstanding: 'Fails to state the laws or writes incorrect formulas.',
          partialUnderstanding: 'Recalls F=ma but misstates Third Law or First Law.',
          thoroughUnderstanding: 'Accurately formulates all three laws and emphasizes action-reaction operates on separate bodies with F=ma.',
        },
      },
    ],
    cognitiveQuestions: [
      {
        id: 'phys-cog-1',
        questionNumber: 3,
        subject: 'Physics',
        domain: 'Classical Mechanics',
        bloomLevel: 'apply',
        difficulty: 'medium',
        questionType: 'scenario',
        question: 'A rocket in deep interstellar space (where gravity is negligible) is moving at a constant speed of 10,000 km/h. To maintain this constant velocity, do the engines need to keep firing continuously? Explain using physical laws.',
        expectedEvidence: 'Applies Newton 1st Law: Zero net force is required to maintain constant velocity in a vacuum. Engines can be shut off.',
        rubric: {
          noUnderstanding: 'States engines must keep firing to overcome space or maintain momentum (Aristotelian misconception).',
          partialUnderstanding: 'States no, but reasons vaguely without citing inertia or zero net force.',
          thoroughUnderstanding: 'Clearly applies Newton First Law of Inertia: with zero friction or external net force, an object remains in uniform rectilinear motion with zero thrust.',
        },
      },
      {
        id: 'phys-cog-2',
        questionNumber: 4,
        subject: 'Physics',
        domain: 'Thermodynamics',
        bloomLevel: 'analyze',
        difficulty: 'difficult',
        questionType: 'error_analysis',
        question: 'An inventor claims to have built a closed thermal cycle engine that extracts 1000 Joules of heat from a single reservoir at 300 Kelvin and converts all 1000 Joules entirely into useful mechanical work with zero heat rejected to the surroundings. Analyze why this violates fundamental laws of physics.',
        expectedEvidence: 'Identifies violation of Second Law of Thermodynamics (Kelvin-Planck statement) and Carnot efficiency limits. Entropy of isolated system would decrease or zero reservoir gradient.',
        rubric: {
          noUnderstanding: 'Believes this is possible because Energy is conserved (First Law satisfied).',
          partialUnderstanding: 'Notes that no engine is 100% efficient, but fails to cite Second Law of Thermodynamics or Kelvin-Planck statement.',
          thoroughUnderstanding: 'Rigorously explains that while energy is conserved (First Law), 100% conversion from a single thermal reservoir violates the Second Law (Kelvin-Planck statement) as heat flow requires a thermal gradient to a cold sink.',
        },
      },
    ],
    metacognitiveQuestions: [
      {
        id: 'phys-meta-1',
        questionNumber: 5,
        subject: 'Physics',
        domain: 'Metacognition',
        bloomLevel: 'evaluate',
        difficulty: 'medium',
        questionType: 'reasoning',
        question: 'When solving a complex physics problem, how do you verify your final result? (e.g., checking dimensional analysis/units, extreme limits, physical plausibility)?',
        expectedEvidence: 'Describes sanity checks: dimensional analysis, checking limits (as variable -> 0 or infinity), symmetry.',
        rubric: {
          noUnderstanding: 'Says they just trust the formula or calculator.',
          partialUnderstanding: 'Mentions unit checking only.',
          thoroughUnderstanding: 'Articulates multiple verification techniques: dimensional analysis, boundary limits, and physical intuition check.',
        },
      },
    ],
  },

  Mathematics: {
    subject: 'Mathematics',
    domains: ['Algebra & Functions', 'Calculus', 'Linear Algebra', 'Probability & Statistics', 'Proof & Logic'],
    intakeQuestions: [
      {
        id: 'math-intake-1',
        questionNumber: 1,
        subject: 'Mathematics',
        domain: 'Learner Intake',
        bloomLevel: 'understand',
        difficulty: 'easy',
        questionType: 'explanation',
        question: 'Welcome! What mathematical domain or topic are you working to master (e.g. calculus, linear algebra, statistics, discrete math, or general problem solving), and what is your current goal?',
        expectedEvidence: 'Identifies math level and specific learning targets.',
        rubric: {
          noUnderstanding: 'No specific topic stated.',
          partialUnderstanding: 'States general math without focus area.',
          thoroughUnderstanding: 'Clearly details topic, target concepts, and applications.',
        },
      },
    ],
    baselineQuestions: [
      {
        id: 'math-base-1',
        questionNumber: 2,
        subject: 'Mathematics',
        domain: 'Calculus',
        bloomLevel: 'remember',
        difficulty: 'easy',
        questionType: 'factual_recall',
        question: 'What is the derivative of f(x) = x^3 - 5x + 7 with respect to x, and what does the value of the derivative represent geometrically?',
        expectedEvidence: 'Derivative is 3x^2 - 5. Geometrically, it represents the slope of the tangent line to the curve at any point x.',
        rubric: {
          noUnderstanding: 'Incorrect derivative computation and geometric meaning.',
          partialUnderstanding: 'Computes 3x^2 - 5 correctly, but omits or misstates geometric tangent slope interpretation.',
          thoroughUnderstanding: 'Accurately computes 3x^2 - 5 and explains the geometric interpretation as the instantaneous slope of the tangent line.',
        },
      },
    ],
    cognitiveQuestions: [
      {
        id: 'math-cog-1',
        questionNumber: 3,
        subject: 'Mathematics',
        domain: 'Probability & Statistics',
        bloomLevel: 'apply',
        difficulty: 'medium',
        questionType: 'problem_solving',
        question: 'A medical test for a rare disease affecting 1 in 1,000 people has a 99% accuracy rate (both sensitivity and specificity). If a randomly selected person tests positive, what is the approximate probability that they actually have the disease? Set up Bayes Theorem to explain your reasoning.',
        expectedEvidence: 'Calculates P(Disease | +) = (0.99 * 0.001) / [(0.99 * 0.001) + (0.01 * 0.999)] ≈ ~9%. Explains false positives dominate in low prevalence.',
        rubric: {
          noUnderstanding: 'Asserts the probability is 99% without accounting for base rate fallacy.',
          partialUnderstanding: 'Recognizes the base rate fallacy and sets up formula, but calculates incorrectly.',
          thoroughUnderstanding: 'Rigorously applies Bayes Theorem demonstrating that due to low base prevalence (~0.1%), false positive alarms outnumber true positives, resulting in ~9% posterior probability.',
        },
      },
      {
        id: 'math-cog-2',
        questionNumber: 4,
        subject: 'Mathematics',
        domain: 'Proof & Logic',
        bloomLevel: 'analyze',
        difficulty: 'difficult',
        questionType: 'reasoning',
        question: 'Prove or disprove: For all integers n, if n^2 is even, then n must be even. Outline the proof method you choose (e.g. proof by contrapositive or contradiction) and execute the logical steps.',
        expectedEvidence: 'Uses contrapositive: Assume n is odd (n = 2k + 1). Then n^2 = (2k+1)^2 = 4k^2 + 4k + 1 = 2(2k^2 + 2k) + 1, which is odd. Hence by contrapositive, if n^2 is even, n is even.',
        rubric: {
          noUnderstanding: 'Shows only a single example (e.g. 4^2 = 16) without a general proof.',
          partialUnderstanding: 'Sets up contradiction or contrapositive, but makes algebraic or logical gaps.',
          thoroughUnderstanding: 'Executes a rigorous algebraic proof by contrapositive, showing odd integer form n = 2k+1 squares to an odd integer 2m+1, concluding validity for all integers.',
        },
      },
    ],
    metacognitiveQuestions: [
      {
        id: 'math-meta-1',
        questionNumber: 5,
        subject: 'Mathematics',
        domain: 'Metacognition',
        bloomLevel: 'evaluate',
        difficulty: 'medium',
        questionType: 'reasoning',
        question: 'When tackling an unfamiliar mathematical proof or problem, how do you decide between different strategic approaches (algebraic derivation, geometric visualization, induction, contradiction)?',
        expectedEvidence: 'Reflects on problem structure, invariant recognition, and strategy selection.',
        rubric: {
          noUnderstanding: 'No strategy described.',
          partialUnderstanding: 'Mentions trying one method randomly.',
          thoroughUnderstanding: 'Articulates structural analysis: looking for discrete steps (induction), boolean implications (contrapositive), or spatial invariants.',
        },
      },
    ],
  },
};

/**
 * Fallback generator for subjects not in the pre-built curricula catalog.
 * Dynamically constructs adaptive questions using local vector database context!
 */
export function getCurriculumForSubject(subject: string): SubjectCurriculumTemplate {
  const normalized = subject.trim();
  const matchedKey = Object.keys(SUBJECT_CURRICULA).find(
    k => k.toLowerCase() === normalized.toLowerCase()
  );

  if (matchedKey) {
    return SUBJECT_CURRICULA[matchedKey];
  }

  // Dynamic generic curriculum structure for any subject (Economics, Chemistry, History, etc.)
  return {
    subject: normalized,
    domains: [`${normalized} Fundamentals`, `${normalized} Core Principles`, `${normalized} Analysis & Application`, `${normalized} Synthesis & Transfer`],
    intakeQuestions: [
      {
        id: `gen-intake-1`,
        questionNumber: 1,
        subject: normalized,
        domain: 'Learner Intake',
        bloomLevel: 'understand',
        difficulty: 'easy',
        questionType: 'explanation',
        question: `Welcome to your diagnostic in ${normalized}! What specific topics or objectives do you want to achieve, and what is your current experience level with ${normalized}?`,
        expectedEvidence: 'Articulates clear goal, subfields of interest, and prior baseline.',
        rubric: {
          noUnderstanding: 'No clear response.',
          partialUnderstanding: 'Mentions basic goal.',
          thoroughUnderstanding: 'Clearly details target goals and background context in the subject.',
        },
      },
    ],
    baselineQuestions: [
      {
        id: `gen-base-1`,
        questionNumber: 2,
        subject: normalized,
        domain: `${normalized} Fundamentals`,
        bloomLevel: 'remember',
        difficulty: 'easy',
        questionType: 'factual_recall',
        question: `In ${normalized}, what is one fundamental law, core concept, or foundational definition that governs this field? Define it clearly.`,
        expectedEvidence: 'Accurate definition of a foundational concept in the subject.',
        rubric: {
          noUnderstanding: 'Incorrect or inaccurate definition.',
          partialUnderstanding: 'Basic definition with minor omissions.',
          thoroughUnderstanding: 'Thorough, accurate definition and context.',
        },
      },
      {
        id: `gen-base-2`,
        questionNumber: 3,
        subject: normalized,
        domain: `${normalized} Core Principles`,
        bloomLevel: 'understand',
        difficulty: 'easy',
        questionType: 'explanation',
        question: `Explain how this foundational principle in ${normalized} operates in practice. Why is it central to understanding the subject?`,
        expectedEvidence: 'Clear explanation of underlying mechanisms.',
        rubric: {
          noUnderstanding: 'Superficial or erroneous explanation.',
          partialUnderstanding: 'Explains basics with limited depth.',
          thoroughUnderstanding: 'Thorough explanation with conceptual clarity.',
        },
      },
    ],
    cognitiveQuestions: [
      {
        id: `gen-cog-1`,
        questionNumber: 4,
        subject: normalized,
        domain: `${normalized} Analysis & Application`,
        bloomLevel: 'apply',
        difficulty: 'medium',
        questionType: 'scenario',
        question: `Describe a real-world scenario or practical problem in ${normalized}. How would you apply your knowledge to solve it?`,
        expectedEvidence: 'Demonstrates practical application to a concrete scenario.',
        rubric: {
          noUnderstanding: 'Unable to apply concepts to scenario.',
          partialUnderstanding: 'Applies concepts partially.',
          thoroughUnderstanding: 'Systematic, correct application with clear reasoning.',
        },
      },
      {
        id: `gen-cog-2`,
        questionNumber: 5,
        subject: normalized,
        domain: `${normalized} Analysis & Application`,
        bloomLevel: 'analyze',
        difficulty: 'medium',
        questionType: 'error_analysis',
        question: `What is a common misconception or common pitfall that people make when learning ${normalized}? Why does it happen, and how do you correct it?`,
        expectedEvidence: 'Identifies a genuine misconception and articulates the correct underlying principle.',
        rubric: {
          noUnderstanding: 'Fails to identify a valid misconception.',
          partialUnderstanding: 'Identifies a mistake but does not explain the conceptual root.',
          thoroughUnderstanding: 'Insightful breakdown of misconception and correct model.',
        },
      },
      {
        id: `gen-cog-3`,
        questionNumber: 6,
        subject: normalized,
        domain: `${normalized} Synthesis & Transfer`,
        bloomLevel: 'evaluate',
        difficulty: 'difficult',
        questionType: 'evidence_evaluation',
        question: `Suppose you are presented with two competing theories, strategies, or methodologies in ${normalized}. What criteria would you use to evaluate which one is superior in a given context?`,
        expectedEvidence: 'Articulates rigorous evaluation criteria based on evidence, efficiency, or validity.',
        rubric: {
          noUnderstanding: 'Arbitrary preference without criteria.',
          partialUnderstanding: 'Lists one criterion without justification.',
          thoroughUnderstanding: 'Evaluates multiple criteria with structured justification.',
        },
      },
      {
        id: `gen-cog-4`,
        questionNumber: 7,
        subject: normalized,
        domain: `${normalized} Synthesis & Transfer`,
        bloomLevel: 'create',
        difficulty: 'difficult',
        questionType: 'creation',
        question: `How would you synthesize what you know in ${normalized} to design an original project, experiment, or framework to solve a novel challenge?`,
        expectedEvidence: 'Original synthesis demonstrating transfer and creative problem-solving.',
        rubric: {
          noUnderstanding: 'Generic or unoriginal proposal.',
          partialUnderstanding: 'Outlines idea with basic transfer.',
          thoroughUnderstanding: 'Original, comprehensive synthesis with clear structure.',
        },
      },
    ],
    metacognitiveQuestions: [
      {
        id: `gen-meta-1`,
        questionNumber: 8,
        subject: normalized,
        domain: 'Metacognition',
        bloomLevel: 'evaluate',
        difficulty: 'medium',
        questionType: 'reasoning',
        question: `Reflecting on your learning journey in ${normalized}, what areas do you find most challenging, and what learning methods (spaced repetition, worked examples, interactive practice) work best for you?`,
        expectedEvidence: 'Metacognitive self-awareness of strengths, limitations, and optimal learning strategies.',
        rubric: {
          noUnderstanding: 'Minimal reflection.',
          partialUnderstanding: 'Brief note on difficulty.',
          thoroughUnderstanding: 'Deep metacognitive insight into learning processes.',
        },
      },
    ],
  };
}
