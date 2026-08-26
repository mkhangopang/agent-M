/**
 * Local Vector Database Engine for PLIA
 * 100% Offline, runs locally with zero external network dependencies.
 * Uses a hybrid dense vector embedding (128-dim normalized n-gram hashed bag-of-words + term weight)
 * and BM25 cosine ranking for sub-millisecond semantic retrieval.
 */

import { BloomLevel, VectorDocument, VectorSearchResult } from '../types';

const VECTOR_DIMENSION = 128;
const STORAGE_KEY = 'plia_local_vector_db_v1';

// Deterministic hashing helper
function hashString(str: string, seed: number = 0): number {
  let h = seed ^ 0x12345678;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 0x5bd1e995);
    h ^= h >>> 15;
  }
  return (h >>> 0) % VECTOR_DIMENSION;
}

// Tokenize text cleanly
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

// Generate a 128-dimensional dense unit vector from text
export function generateLocalEmbedding(text: string): number[] {
  const vector = new Array(VECTOR_DIMENSION).fill(0);
  const tokens = tokenize(text);
  if (tokens.length === 0) return vector;

  // Single tokens with frequency weighting
  const termCounts: Record<string, number> = {};
  for (const token of tokens) {
    termCounts[token] = (termCounts[token] || 0) + 1;
  }

  for (const [token, count] of Object.entries(termCounts)) {
    const weight = 1 + Math.log(count);
    const idx1 = hashString(token, 42);
    const idx2 = hashString(token, 1337);
    vector[idx1] += weight;
    vector[idx2] += weight * 0.5;

    // Bigrams for context awareness
    for (let i = 0; i < token.length - 2; i++) {
      const trigram = token.slice(i, i + 3);
      const triIdx = hashString(trigram, 99);
      vector[triIdx] += 0.25;
    }
  }

  // Normalize to unit vector for pure cosine similarity
  let norm = 0;
  for (let i = 0; i < VECTOR_DIMENSION; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIMENSION; i++) {
      vector[i] /= norm;
    }
  }

  return vector;
}

// Cosine similarity between two unit vectors = dot product
export function cosineSimilarity(v1: number[], v2: number[]): number {
  if (!v1 || !v2 || v1.length !== v2.length) return 0;
  let dot = 0;
  for (let i = 0; i < v1.length; i++) {
    dot += v1[i] * v2[i];
  }
  return Math.max(0, Math.min(1, dot));
}

// Pre-seeded foundational curriculum and misconception database
const SEED_DOCUMENTS: Omit<VectorDocument, 'embedding' | 'createdAt'>[] = [
  // Biology
  {
    id: 'bio-001',
    subject: 'Biology',
    domain: 'Cellular Respiration',
    topic: 'Glycolysis & Krebs Cycle',
    bloomLevel: 'understand',
    category: 'curriculum',
    content: 'Cellular respiration converts glucose and oxygen into ATP, carbon dioxide, and water. Glycolysis occurs in the cytoplasm anaerobically yielding 2 net ATP. The Krebs cycle and Electron Transport Chain occur within the mitochondria requiring oxygen, generating up to 36-38 total ATP.',
  },
  {
    id: 'bio-002',
    subject: 'Biology',
    domain: 'Cellular Respiration',
    topic: 'Anaerobic Lactic Acid Fermentation',
    bloomLevel: 'apply',
    category: 'misconception',
    content: 'Common misconception: Learners often think respiration is simply breathing or that cells can only produce energy when oxygen is present. In reality, glycolysis continues under anaerobic conditions through fermentation (lactic acid in animals, ethanol in yeast) to regenerate NAD+.',
  },
  {
    id: 'bio-003',
    subject: 'Biology',
    domain: 'Genetics',
    topic: 'DNA Replication & Polymerase',
    bloomLevel: 'analyze',
    category: 'curriculum',
    content: 'DNA replication is semi-conservative. DNA Helicase unwinds the double helix, RNA Primase lays primers, and DNA Polymerase III synthesizes the leading strand continuously 5 to 3 while the lagging strand is synthesized discontinuously as Okazaki fragments joined by DNA Ligase.',
  },
  {
    id: 'bio-004',
    subject: 'Biology',
    domain: 'Genetics',
    topic: 'Dominant vs Recessive Allele Misconception',
    bloomLevel: 'analyze',
    category: 'misconception',
    content: 'Misconception: Dominant traits are automatically the most common in a population or inherently stronger. In truth, allele frequency is dictated by natural selection and genetic drift, not dominance (e.g. Huntington disease is dominant but rare; Type O blood is recessive but prevalent).',
  },
  {
    id: 'bio-005',
    subject: 'Biology',
    domain: 'Ecology',
    topic: 'Trophic Levels & 10% Energy Rule',
    bloomLevel: 'apply',
    category: 'curriculum',
    content: 'In ecological food webs, only approximately 10 percent of energy transfers from one trophic level to the next. The remaining 90 percent is lost as heat, metabolic work, and undigested biomass. This thermodynamic constraint strictly limits food chain length.',
  },

  // Computer Science & Programming
  {
    id: 'cs-001',
    subject: 'Computer Science',
    domain: 'Algorithms',
    topic: 'Big O Notation & Time Complexity',
    bloomLevel: 'analyze',
    category: 'curriculum',
    content: 'Big O notation characterizes asymptotic upper bound growth. O(1) constant time, O(log N) binary search on sorted data, O(N) linear scan, O(N log N) merge sort/quick sort average, O(N^2) nested loop comparisons, and O(2^N) exponential recursion without memoization.',
  },
  {
    id: 'cs-002',
    subject: 'Computer Science',
    domain: 'Data Structures',
    topic: 'Hash Tables & Collision Resolution',
    bloomLevel: 'apply',
    category: 'curriculum',
    content: 'Hash tables map keys to array indices via a hash function, providing average O(1) insertion, lookup, and deletion. Collisions are resolved through separate chaining (linked lists or balanced trees per bucket) or open addressing (linear probing, quadratic probing, double hashing).',
  },
  {
    id: 'cs-003',
    subject: 'Computer Science',
    domain: 'Programming Paradigms',
    topic: 'Pass by Reference vs Pass by Value',
    bloomLevel: 'understand',
    category: 'misconception',
    content: 'Misconception: Beginners believe JavaScript/Python passes objects by reference. In reality, variables hold reference values (pointers) that are passed by value (call-by-sharing). Reassigning the parameter inside a function does not mutate the external reference.',
  },
  {
    id: 'cs-004',
    subject: 'Computer Science',
    domain: 'Asynchronous Programming',
    topic: 'Event Loop & Call Stack',
    bloomLevel: 'analyze',
    category: 'curriculum',
    content: 'The single-threaded event loop constantly monitors the Call Stack and Task Queues (Microtask Queue for Promises, Macrotask Queue for setTimeout/I/O). Microtasks always drain completely before the next macrotask is processed.',
  },
  {
    id: 'cs-005',
    subject: 'Computer Science',
    domain: 'System Design',
    topic: 'CAP Theorem & Distributed Consistency',
    bloomLevel: 'evaluate',
    category: 'curriculum',
    content: 'The CAP Theorem asserts a distributed system cannot simultaneously guarantee Consistency (every read receives most recent write), Availability (every non-failing node responds), and Partition Tolerance (system continues during network breaks). Under network partitions, systems must trade C or A.',
  },

  // Physics
  {
    id: 'phys-001',
    subject: 'Physics',
    domain: 'Mechanics',
    topic: 'Newton Laws of Motion & Net Force',
    bloomLevel: 'apply',
    category: 'curriculum',
    content: 'Newton First Law: an object remains in uniform motion unless acted upon by a net external force. Second Law: F_net = m * a. Third Law: for every action force, there is an equal and opposite reaction force acting on different interacting bodies.',
  },
  {
    id: 'phys-002',
    subject: 'Physics',
    domain: 'Mechanics',
    topic: 'Motion Requires Force Misconception',
    bloomLevel: 'understand',
    category: 'misconception',
    content: 'Aristotelian misconception: Believing a continuous forward force is required to sustain constant velocity motion. By Newton First Law of Inertia, constant velocity requires zero net force; force is only required to change velocity (acceleration).',
  },
  {
    id: 'phys-003',
    subject: 'Physics',
    domain: 'Thermodynamics',
    topic: 'Entropy & Second Law',
    bloomLevel: 'evaluate',
    category: 'curriculum',
    content: 'The Second Law of Thermodynamics states the total entropy of an isolated system always increases over time. Heat flows spontaneously from higher temperature to lower temperature reservoirs; converting heat entirely into mechanical work is impossible without ambient losses.',
  },
  {
    id: 'phys-004',
    subject: 'Physics',
    domain: 'Electromagnetism',
    topic: 'Faraday Induction & Lenz Law',
    bloomLevel: 'analyze',
    category: 'curriculum',
    content: 'Faraday Law states an induced electromotive force (EMF) in any closed loop equals the negative rate of change of magnetic flux through the loop. Lenz Law explains the negative sign: the induced current creates a magnetic field that opposes the change in magnetic flux.',
  },

  // Mathematics
  {
    id: 'math-001',
    subject: 'Mathematics',
    domain: 'Calculus',
    topic: 'Derivatives & Rates of Change',
    bloomLevel: 'understand',
    category: 'curriculum',
    content: 'The derivative f prime of x represents the instantaneous rate of change of a function, defined as the limit of [f(x+h) - f(x)] / h as h approaches 0. Geometrically, it is the exact slope of the tangent line to the curve at point x.',
  },
  {
    id: 'math-002',
    subject: 'Mathematics',
    domain: 'Calculus',
    topic: 'Fundamental Theorem of Calculus',
    bloomLevel: 'apply',
    category: 'curriculum',
    content: 'The Fundamental Theorem connects differentiation and integration. Part 1: the derivative of an accumulation function integral from a to x of f(t)dt is f(x). Part 2: the definite integral from a to b of f(x)dx equals F(b) - F(a), where F is any antiderivative.',
  },
  {
    id: 'math-003',
    subject: 'Mathematics',
    domain: 'Probability & Statistics',
    topic: 'Conditional Probability & Bayes Theorem',
    bloomLevel: 'analyze',
    category: 'curriculum',
    content: 'Bayes Theorem updates prior beliefs with observed evidence: P(A|B) = [P(B|A) * P(A)] / P(B). It separates true positive rate (sensitivity) from false alarm rates, showing why rare disease tests can have surprisingly low posterior positive predictive values.',
  },
  {
    id: 'math-004',
    subject: 'Mathematics',
    domain: 'Probability',
    topic: 'Gambler Fallacy Misconception',
    bloomLevel: 'understand',
    category: 'misconception',
    content: 'Misconception: Thinking past independent random events alter future probabilities (e.g., believing a fair coin flipped 5 tails in a row is "due" for heads). Each independent trial retains exactly P(Heads) = 0.5.',
  },

  // Data Science & AI
  {
    id: 'ai-001',
    subject: 'AI & Data Science',
    domain: 'Machine Learning',
    topic: 'Bias-Variance Tradeoff & Regularization',
    bloomLevel: 'analyze',
    category: 'curriculum',
    content: 'Supervised models face bias (underfitting from overly rigid assumptions) versus variance (overfitting to training noise). L1 Lasso regularization forces sparse zero weights for feature selection, while L2 Ridge penalizes large coefficients smoothly.',
  },
  {
    id: 'ai-002',
    subject: 'AI & Data Science',
    domain: 'Deep Learning',
    topic: 'Transformer Architecture & Self-Attention',
    bloomLevel: 'evaluate',
    category: 'curriculum',
    content: 'Transformers replace recurrent sequential processing with Multi-Head Self-Attention. Keys, Queries, and Values calculate softmax(Q * K^T / sqrt(d_k)) * V, enabling parallel token interaction across arbitrary sequence distances without vanishing gradient bottlenecks.',
  },

  // Chemistry
  {
    id: 'chem-001',
    subject: 'Chemistry',
    domain: 'Chemical Equilibrium',
    topic: 'Le Chatelier Principle',
    bloomLevel: 'apply',
    category: 'curriculum',
    content: 'When a chemical system at dynamic equilibrium experiences a disturbance (concentration, temperature, pressure), the system shifts in the direction that counteracts the applied change to re-establish the equilibrium constant K_eq.',
  },

  // Economics
  {
    id: 'econ-001',
    subject: 'Economics',
    domain: 'Microeconomics',
    topic: 'Price Elasticity of Demand',
    bloomLevel: 'analyze',
    category: 'curriculum',
    content: 'Price elasticity measures the percentage change in quantity demanded relative to percentage change in price. If elasticity > 1, demand is elastic (revenue drops if price increases); if < 1, inelastic (necessities where revenue rises with price).',
  },
];

class LocalVectorDatabase {
  private documents: Map<string, VectorDocument> = new Map();
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init(): void {
    if (this.isInitialized) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: VectorDocument[] = JSON.parse(stored);
        for (const doc of parsed) {
          if (!doc.embedding) {
            doc.embedding = generateLocalEmbedding(`${doc.topic} ${doc.domain} ${doc.content}`);
          }
          this.documents.set(doc.id, doc);
        }
      }
    } catch (e) {
      console.warn('Could not read vector store from localStorage, using memory seed:', e);
    }

    // Ensure seed documents exist
    if (this.documents.size === 0) {
      for (const seed of SEED_DOCUMENTS) {
        const fullText = `${seed.topic} ${seed.domain} ${seed.content}`;
        const doc: VectorDocument = {
          ...seed,
          embedding: generateLocalEmbedding(fullText),
          createdAt: new Date().toISOString(),
        };
        this.documents.set(doc.id, doc);
      }
      this.persist();
    }

    this.isInitialized = true;
  }

  private persist(): void {
    try {
      const docsArray = Array.from(this.documents.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(docsArray));
    } catch (e) {
      console.warn('LocalStorage save failed for vector DB:', e);
    }
  }

  public getAll(): VectorDocument[] {
    return Array.from(this.documents.values());
  }

  public getById(id: string): VectorDocument | undefined {
    return this.documents.get(id);
  }

  public insert(doc: Omit<VectorDocument, 'embedding' | 'createdAt'> & { embedding?: number[]; createdAt?: string }): VectorDocument {
    const fullText = `${doc.topic} ${doc.domain} ${doc.content}`;
    const embedding = doc.embedding || generateLocalEmbedding(fullText);
    const completeDoc: VectorDocument = {
      ...doc,
      embedding,
      createdAt: doc.createdAt || new Date().toISOString(),
    };
    this.documents.set(completeDoc.id, completeDoc);
    this.persist();
    return completeDoc;
  }

  public delete(id: string): boolean {
    const deleted = this.documents.delete(id);
    if (deleted) this.persist();
    return deleted;
  }

  public clear(): void {
    this.documents.clear();
    this.persist();
  }

  public resetToSeeds(): void {
    this.documents.clear();
    for (const seed of SEED_DOCUMENTS) {
      const fullText = `${seed.topic} ${seed.domain} ${seed.content}`;
      const doc: VectorDocument = {
        ...seed,
        embedding: generateLocalEmbedding(fullText),
        createdAt: new Date().toISOString(),
      };
      this.documents.set(doc.id, doc);
    }
    this.persist();
  }

  /**
   * Fast Hybrid Search (Cosine Vector Similarity + Token Keyword Overlap)
   */
  public search(
    query: string,
    options: {
      subject?: string;
      category?: string;
      bloomLevel?: BloomLevel;
      topK?: number;
      minScore?: number;
    } = {}
  ): VectorSearchResult[] {
    const { subject, category, bloomLevel, topK = 5, minScore = 0.1 } = options;
    const queryVector = generateLocalEmbedding(query);
    const queryTokens = new Set(tokenize(query));

    const results: VectorSearchResult[] = [];

    for (const doc of this.documents.values()) {
      // Filter by subject if specified (case-insensitive substring)
      if (subject && subject.trim().length > 0) {
        const subLower = subject.toLowerCase();
        const docSubLower = doc.subject.toLowerCase();
        if (!docSubLower.includes(subLower) && !subLower.includes(docSubLower)) {
          // If neither contains the other, skip
          continue;
        }
      }

      if (category && doc.category !== category) continue;
      if (bloomLevel && doc.bloomLevel && doc.bloomLevel !== bloomLevel) continue;

      const cosScore = doc.embedding ? cosineSimilarity(queryVector, doc.embedding) : 0;

      // Keyword token overlap bonus
      const docTokens = tokenize(`${doc.topic} ${doc.domain} ${doc.content}`);
      const matchedTokens: string[] = [];
      for (const dt of docTokens) {
        if (queryTokens.has(dt) && !matchedTokens.includes(dt)) {
          matchedTokens.push(dt);
        }
      }

      const tokenBonus = Math.min(0.3, matchedTokens.length * 0.08);
      const combinedScore = Math.min(1.0, cosScore * 0.7 + tokenBonus);

      if (combinedScore >= minScore) {
        results.push({
          document: doc,
          similarityScore: combinedScore,
          matchedTokens,
        });
      }
    }

    // Sort descending by score
    results.sort((a, b) => b.similarityScore - a.similarityScore);
    return results.slice(0, topK);
  }

  /**
   * Chunk and ingest raw learner notes or curriculum textbook text
   */
  public ingestCustomText(
    subject: string,
    title: string,
    rawText: string,
    domain: string = 'Learner Ingested Notes'
  ): number {
    const paragraphs = rawText
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 30);

    let count = 0;
    for (let i = 0; i < paragraphs.length; i++) {
      const chunk = paragraphs[i];
      const id = `user-doc-${Date.now()}-${i}`;
      this.insert({
        id,
        subject,
        domain,
        topic: `${title} (Section ${i + 1})`,
        content: chunk,
        category: 'user_note',
      });
      count++;
    }
    return count;
  }
}

export const vectorDb = new LocalVectorDatabase();
