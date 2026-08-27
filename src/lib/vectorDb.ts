/**
 * Embedded Vector Database & Semantic Retrieval Engine for PLIA
 * 
 * Features:
 * - Real vector embedding generation via Ollama (`/api/embeddings` / `/api/embed`)
 * - Fallback high-speed deterministic dense heuristic vector engine for 100% offline degraded mode
 * - Persistent local embedding cache for instant load times without re-embedding
 * - Cosine similarity calculation with keyword-overlap boost and domain filtering
 * - Strict input validation, chunking boundaries, and sanitization for custom user ingestions
 * - Pre-seeded curated curriculum documents across Core Computer Science, Physics, Calculus, Biology, Machine Learning, and Cognitive Science
 */

import { VectorDocument, VectorSearchResult } from '../types';

const EMBEDDING_CACHE_STORAGE_KEY = 'plia_vector_embedding_cache_v2';
const VECTOR_DOCS_STORAGE_KEY = 'plia_custom_vector_docs_v2';

// 128-dimensional dense heuristic fallback embedding
export function generateLocalEmbedding(text: string): number[] {
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const tokens = clean.split(/\s+/).filter(t => t.length > 1);
  const dim = 128;
  const vector = new Array(dim).fill(0);

  if (tokens.length === 0) return vector;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    let hash = 0;
    for (let c = 0; c < token.length; c++) {
      hash = (hash << 5) - hash + token.charCodeAt(c);
      hash |= 0;
    }

    const pos = Math.abs(hash) % dim;
    const sign = (hash & 1) === 0 ? 1 : -1;
    const weight = Math.log(1 + 1 / (i + 1)) * 1.5 + (token.length > 5 ? 1.2 : 0.8);
    vector[pos] += sign * weight;

    // Secondary hash projection for semantic density
    const pos2 = Math.abs(hash * 31 + 17) % dim;
    vector[pos2] += sign * 0.5;
  }

  // Normalize to unit vector
  let sumSquares = 0;
  for (let i = 0; i < dim; i++) {
    sumSquares += vector[i] * vector[i];
  }
  const magnitude = Math.sqrt(sumSquares);
  if (magnitude === 0) return vector;

  for (let i = 0; i < dim; i++) {
    vector[i] = vector[i] / magnitude;
  }

  return vector;
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) {
    // If dimensionalities differ (e.g. Ollama 768-dim vs 128-dim), compute dot product on overlap or 0
    const minLen = Math.min(vecA.length, vecB.length);
    if (minLen === 0) return 0;
    let dot = 0;
    for (let i = 0; i < minLen; i++) {
      dot += vecA[i] * vecB[i];
    }
    return Math.max(0, Math.min(1, (dot + 1) / 2));
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  const rawCos = dotProduct / denominator;
  // Scale from [-1, 1] to [0, 1]
  return Math.max(0, Math.min(1, (rawCos + 1) / 2));
}

const SEED_CURRICULUM_DOCUMENTS: Omit<VectorDocument, 'embedding'>[] = [
  // Computer Science & Distributed Systems
  {
    id: 'seed-cs-01',
    subject: 'Computer Science',
    domain: 'Distributed Systems',
    topic: 'CAP Theorem & PACELC',
    content: 'The CAP theorem states that a distributed data store can simultaneously provide at most two of three guarantees: Consistency (every read receives the most recent write or an error), Availability (every request receives a non-error response), and Partition Tolerance (the system continues to operate despite an arbitrary number of dropped or delayed messages). In practice, network partitions (P) are unavoidable, so systems must choose between Consistency (CP) and Availability (AP). PACELC extends CAP: if partition (P), choose Availability (A) or Consistency (C); Else (E), choose Latency (L) or Consistency (C).',
    category: 'curriculum',
    bloomLevel: 'analyze',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-cs-02',
    subject: 'Computer Science',
    domain: 'Distributed Systems',
    topic: 'Raft Consensus Protocol & State Machine Replication',
    content: 'Raft is a consensus algorithm designed for understandability. It decomposes consensus into leader election, log replication, and safety. A leader accepts log entries from clients, replicates them across followers, and commits entries once acknowledged by a majority (quorum). Raft guarantees election safety, leader append-only invariant, log matching property, leader completeness, and state machine safety invariants. If leader heartbeats time out, followers transition to candidate and initiate randomized election timers.',
    category: 'curriculum',
    bloomLevel: 'apply',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-cs-03',
    subject: 'Computer Science',
    domain: 'Algorithms',
    topic: 'Dynamic Programming & Optimal Substructure',
    content: 'Dynamic Programming (DP) solves complex optimization problems by decomposing them into overlapping subproblems with optimal substructure. An optimal solution to the overall problem incorporates optimal solutions to its subproblems. Memoization represents top-down caching of recursive results, while Tabulation represents bottom-up iterative table construction. Identifying state transitions, base conditions, and memory compression (rolling variables) are foundational DP skills.',
    category: 'curriculum',
    bloomLevel: 'understand',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-cs-04',
    subject: 'Computer Science',
    domain: 'Operating Systems',
    topic: 'Concurrency & Deadlock Prevention',
    content: 'Deadlock in concurrent systems occurs when a set of processes are blocked because each process is holding a resource and waiting for another resource held by another process. Coffman conditions: 1. Mutual Exclusion, 2. Hold and Wait, 3. No Preemption, 4. Circular Wait. Deadlock prevention breaks at least one Coffman condition (e.g. strict total ordering on resource acquisition to eliminate circular wait). Lock-free architectures leverage hardware compare-and-swap (CAS) primitives.',
    category: 'curriculum',
    bloomLevel: 'analyze',
    createdAt: new Date().toISOString(),
  },

  // Physics
  {
    id: 'seed-phys-01',
    subject: 'Physics',
    domain: 'Classical Mechanics',
    topic: 'Newtonian Laws & Inertial Reference Frames',
    content: 'Newton First Law (Law of Inertia) states that an object continues in its state of rest or uniform rectilinear motion unless acted upon by a net non-zero external force. Velocity is constant when net force is zero. Newton Second Law equates net force to the time rate of change of momentum (F = dp/dt = m*a for constant mass). Newton Third Law dictates that every action entails an equal and opposite reaction acting on separate interacting bodies.',
    category: 'curriculum',
    bloomLevel: 'understand',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-phys-02',
    subject: 'Physics',
    domain: 'Thermodynamics',
    topic: 'Entropy & Second Law of Thermodynamics',
    content: 'The Second Law of Thermodynamics states that the total entropy of an isolated system never decreases over time; in spontaneous natural processes, entropy increases toward thermodynamic equilibrium. Carnot efficiency represents the theoretical upper limit for heat engines operating between temperatures Thot and Tcold: eta = 1 - (Tcold / Thot). Microscopic statistical mechanics defines entropy via Boltzmann formula: S = k_B * ln(Omega), where Omega is the microstate multiplicity.',
    category: 'curriculum',
    bloomLevel: 'analyze',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-phys-03',
    subject: 'Physics',
    domain: 'Electromagnetism',
    topic: 'Maxwell Equations & Electromagnetic Waves',
    content: 'Maxwell equations synthesize classical electromagnetism into four partial differential equations: Gauss Law for electric fields (div E = rho / epsilon_0), Gauss Law for magnetism (div B = 0), Faraday Law of induction (curl E = -dB/dt), and Ampere-Maxwell Law with displacement current (curl B = mu_0*J + mu_0*epsilon_0*dE/dt). Combining curl equations in vacuum yields the electromagnetic wave equation propagating at speed c = 1/sqrt(mu_0 * epsilon_0).',
    category: 'curriculum',
    bloomLevel: 'evaluate',
    createdAt: new Date().toISOString(),
  },

  // Mathematics & Calculus
  {
    id: 'seed-math-01',
    subject: 'Mathematics',
    domain: 'Calculus',
    topic: 'Fundamental Theorem of Calculus',
    content: 'The Fundamental Theorem of Calculus bridges differentiation and integration. Part 1 establishes that if f is continuous on [a,b] and F(x) = integral_a^x f(t)dt, then F is differentiable and F prime(x) = f(x). Part 2 establishes that integral_a^b f(x)dx = F(b) - F(a) where F is any antiderivative of f. This confirms integration and differentiation are inverse operations of continuous real functions.',
    category: 'curriculum',
    bloomLevel: 'understand',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-math-02',
    subject: 'Mathematics',
    domain: 'Linear Algebra',
    topic: 'Eigenvalues, Eigenvectors & Spectral Decomposition',
    content: 'For an n x n square matrix A, a non-zero vector v is an eigenvector and lambda is its corresponding eigenvalue if A*v = lambda*v. Geometric interpretation: matrix transformation acts purely as a scalar stretch along the direction of v without rotation. Solved via characteristic polynomial det(A - lambda*I) = 0. Symmetric matrices have real eigenvalues and orthogonal eigenvectors, admitting spectral diagonalization A = Q * Lambda * Q^T.',
    category: 'curriculum',
    bloomLevel: 'apply',
    createdAt: new Date().toISOString(),
  },

  // Biology
  {
    id: 'seed-bio-01',
    subject: 'Biology',
    domain: 'Cellular Biology',
    topic: 'Cellular Respiration & Chemiosmosis',
    content: 'Cellular respiration converts biochemical energy from glucose into adenosine triphosphate (ATP) across three stages: Glycolysis (cytoplasm, anaerobic, net 2 ATP, 2 NADH), Krebs / Citric Acid Cycle (mitochondrial matrix, generates NADH and FADH2), and Oxidative Phosphorylation (inner mitochondrial membrane). Electron Transport Chain pumps protons into the intermembrane space, establishing an electrochemical proton gradient (proton motive force). ATP Synthase synthesizes ATP via chemiosmosis.',
    category: 'curriculum',
    bloomLevel: 'understand',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-bio-02',
    subject: 'Biology',
    domain: 'Genetics',
    topic: 'Mendelian Inheritance & Hardy-Weinberg Equilibrium',
    content: 'Mendel laws encompass Segregation (allele pairs separate during gamete formation) and Independent Assortment (genes for different traits assort independently if unlinked). Dominant alleles express in heterozygotes but do not necessarily equate to higher population frequency. Hardy-Weinberg equilibrium (p^2 + 2pq + q^2 = 1) models allele and genotype frequencies under assumptions of no mutation, no gene flow, random mating, infinite population size, and no natural selection.',
    category: 'curriculum',
    bloomLevel: 'analyze',
    createdAt: new Date().toISOString(),
  },

  // Machine Learning
  {
    id: 'seed-ml-01',
    subject: 'Machine Learning',
    domain: 'Deep Learning',
    topic: 'Transformer Architecture & Self-Attention',
    content: 'The Transformer architecture replaces recurrence with multi-head self-attention. Queries (Q), Keys (K), and Values (V) are projected linearly: Attention(Q,K,V) = softmax(Q * K^T / sqrt(d_k)) * V. Scaling by sqrt(d_k) prevents vanishing gradients in softmax at high dimensions. Positional encodings inject token sequence order. Residual connections and LayerNorm stabilize deep gradient flow.',
    category: 'curriculum',
    bloomLevel: 'analyze',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-ml-02',
    subject: 'Machine Learning',
    domain: 'Optimization',
    topic: 'Backpropagation & Loss Gradients',
    content: 'Backpropagation computes the gradient of the loss function with respect to every weight in a neural network via recursive application of the multivariable calculus chain rule. In forward pass, activations are computed and cached. In backward pass, error sensitivities (delta) are propagated from output layer back to input layer. Optimization algorithms (SGD, Adam, RMSProp) utilize these gradients to iteratively minimize empirical loss.',
    category: 'curriculum',
    bloomLevel: 'apply',
    createdAt: new Date().toISOString(),
  },
];

export class LocalVectorDatabase {
  private documents: Map<string, VectorDocument> = new Map();
  private embeddingCache: Map<string, number[]> = new Map();

  constructor() {
    this.loadEmbeddingCache();
    this.initializeDocuments();
    this.loadCustomDocuments();
  }

  private loadEmbeddingCache(): void {
    try {
      const stored = localStorage.getItem(EMBEDDING_CACHE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, number[]>;
        for (const [key, vec] of Object.entries(parsed)) {
          if (Array.isArray(vec) && vec.length > 0) {
            this.embeddingCache.set(key, vec);
          }
        }
      }
    } catch {
      // cache initialize fallback
    }
  }

  private saveEmbeddingCache(): void {
    try {
      const obj: Record<string, number[]> = {};
      // Cap cache size at 500 entries to prevent storage overflow
      let count = 0;
      for (const [k, v] of this.embeddingCache.entries()) {
        if (count++ > 500) break;
        obj[k] = v;
      }
      localStorage.setItem(EMBEDDING_CACHE_STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {
      console.warn('Could not save vector embedding cache:', e);
    }
  }

  private initializeDocuments(): void {
    for (const doc of SEED_CURRICULUM_DOCUMENTS) {
      const embedding = this.getOrGenerateEmbedding(doc.content);
      this.documents.set(doc.id, {
        ...doc,
        embedding,
      });
    }
  }

  private loadCustomDocuments(): void {
    try {
      const stored = localStorage.getItem(VECTOR_DOCS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as VectorDocument[];
        for (const doc of parsed) {
          if (!doc.embedding || doc.embedding.length === 0) {
            doc.embedding = this.getOrGenerateEmbedding(doc.content);
          }
          this.documents.set(doc.id, doc);
        }
      }
    } catch {
      // ignore
    }
  }

  private saveCustomDocuments(): void {
    try {
      const customDocs = Array.from(this.documents.values()).filter(
        d => !SEED_CURRICULUM_DOCUMENTS.some(s => s.id === d.id)
      );
      localStorage.setItem(VECTOR_DOCS_STORAGE_KEY, JSON.stringify(customDocs));
    } catch (e) {
      console.warn('Failed to persist custom vector documents:', e);
    }
  }

  private getOrGenerateEmbedding(text: string): number[] {
    const key = text.slice(0, 150);
    if (this.embeddingCache.has(key)) {
      return this.embeddingCache.get(key)!;
    }
    const local = generateLocalEmbedding(text);
    this.embeddingCache.set(key, local);
    return local;
  }

  /**
   * Asynchronously upgrades embeddings using real Ollama vectors when available
   */
  public async upgradeEmbeddingsWithOllama(
    embedFn: (text: string) => Promise<number[]>,
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    const docs = Array.from(this.documents.values());
    let updated = 0;
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      const key = `ollama_${doc.content.slice(0, 150)}`;
      if (!this.embeddingCache.has(key)) {
        try {
          const vec = await embedFn(doc.content);
          if (vec && vec.length > 0) {
            doc.embedding = vec;
            this.embeddingCache.set(key, vec);
            this.documents.set(doc.id, doc);
            updated++;
          }
        } catch {
          // keep heuristic
        }
      }
      if (onProgress) {
        onProgress(i + 1, docs.length);
      }
    }
    if (updated > 0) {
      this.saveEmbeddingCache();
      this.saveCustomDocuments();
    }
  }

  /**
   * Search documents by semantic cosine similarity and token relevance
   */
  public search(
    query: string,
    options: {
      subject?: string;
      domain?: string;
      category?: VectorDocument['category'];
      topK?: number;
      minScore?: number;
      queryEmbedding?: number[];
    } = {}
  ): VectorSearchResult[] {
    const { subject, domain, category, topK = 4, minScore = 0.1, queryEmbedding } = options;
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return [];

    const qVec = queryEmbedding || this.getOrGenerateEmbedding(cleanQuery);
    const queryTokens = cleanQuery.split(/\W+/).filter(t => t.length > 2);

    const results: VectorSearchResult[] = [];

    for (const doc of this.documents.values()) {
      if (subject && doc.subject.toLowerCase() !== subject.toLowerCase()) {
        continue;
      }
      if (domain && doc.domain.toLowerCase() !== domain.toLowerCase()) {
        continue;
      }
      if (category && doc.category !== category) {
        continue;
      }

      const docVec = doc.embedding || this.getOrGenerateEmbedding(doc.content);
      const similarity = cosineSimilarity(qVec, docVec);

      // Keyword token boost
      const docText = `${doc.topic} ${doc.content}`.toLowerCase();
      const matchedTokens: string[] = [];
      for (const token of queryTokens) {
        if (docText.includes(token)) {
          matchedTokens.push(token);
        }
      }

      const tokenBoost = queryTokens.length > 0 ? (matchedTokens.length / queryTokens.length) * 0.25 : 0;
      const combinedScore = Math.min(1, similarity * 0.75 + tokenBoost);

      if (combinedScore >= minScore) {
        results.push({
          document: doc,
          similarityScore: combinedScore,
          matchedTokens,
        });
      }
    }

    results.sort((a, b) => b.similarityScore - a.similarityScore);
    return results.slice(0, topK);
  }

  /**
   * Strict input validation and sanitization for custom user text ingestion
   */
  public ingestCustomText(
    subject: string,
    domain: string,
    topic: string,
    rawContent: string,
    category: VectorDocument['category'] = 'user_note',
    learnerId?: string
  ): { success: boolean; chunksIngested: number; error?: string } {
    // 1. Sanitize & trim inputs
    const cleanSubject = (subject || 'General').trim().slice(0, 80);
    const cleanDomain = (domain || 'Custom Domain').trim().slice(0, 80);
    const cleanTopic = (topic || 'Imported Note').trim().slice(0, 120);
    const cleanContent = rawContent.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();

    // 2. Bound checks
    if (!cleanContent || cleanContent.length < 10) {
      return { success: false, chunksIngested: 0, error: 'Document content is too short (min 10 characters).' };
    }

    const MAX_CONTENT_LENGTH = 500000; // 500k characters max
    if (cleanContent.length > MAX_CONTENT_LENGTH) {
      return { success: false, chunksIngested: 0, error: `Content exceeds max limit of ${MAX_CONTENT_LENGTH} characters.` };
    }

    // 3. Chunk text cleanly by paragraphs and sentences
    const CHUNK_SIZE = 800;
    const CHUNK_OVERLAP = 150;
    const chunks: string[] = [];

    let startIndex = 0;
    while (startIndex < cleanContent.length && chunks.length < 100) {
      let endIndex = Math.min(startIndex + CHUNK_SIZE, cleanContent.length);

      // Find sentence or paragraph break near the end of chunk
      if (endIndex < cleanContent.length) {
        const breakOffset = cleanContent.slice(endIndex - 80, endIndex + 40).search(/(\.\s|\n\n)/);
        if (breakOffset !== -1) {
          endIndex = endIndex - 80 + breakOffset + 1;
        }
      }

      const chunkText = cleanContent.slice(startIndex, endIndex).trim();
      if (chunkText.length > 20) {
        chunks.push(chunkText);
      }

      if (endIndex >= cleanContent.length) break;
      startIndex = Math.max(startIndex + 1, endIndex - CHUNK_OVERLAP);
    }

    if (chunks.length === 0) {
      return { success: false, chunksIngested: 0, error: 'Failed to extract valid text chunks.' };
    }

    // 4. Ingest each chunk as a vector document
    const now = new Date().toISOString();
    for (let i = 0; i < chunks.length; i++) {
      const chunkDoc: VectorDocument = {
        id: `user-doc-${Date.now()}-${i}`,
        subject: cleanSubject,
        domain: cleanDomain,
        topic: chunks.length > 1 ? `${cleanTopic} (Part ${i + 1}/${chunks.length})` : cleanTopic,
        content: chunks[i],
        category,
        embedding: this.getOrGenerateEmbedding(chunks[i]),
        metadata: {
          chunkIndex: i + 1,
          totalChunks: chunks.length,
          learnerId: learnerId || 'default',
        },
        createdAt: now,
      };

      this.documents.set(chunkDoc.id, chunkDoc);
    }

    this.saveCustomDocuments();
    return { success: true, chunksIngested: chunks.length };
  }

  public getAllDocuments(): VectorDocument[] {
    return Array.from(this.documents.values());
  }

  public getAll(): VectorDocument[] {
    return this.getAllDocuments();
  }

  public getDocumentCount(): number {
    return this.documents.size;
  }

  public deleteDocument(id: string): boolean {
    if (this.documents.has(id)) {
      this.documents.delete(id);
      this.saveCustomDocuments();
      return true;
    }
    return false;
  }

  public delete(id: string): boolean {
    return this.deleteDocument(id);
  }

  public resetToSeeds(): void {
    this.documents.clear();
    this.initializeDocuments();
    try {
      localStorage.removeItem(VECTOR_DOCS_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  public clearCustomDocuments(): void {
    const seedIds = new Set(SEED_CURRICULUM_DOCUMENTS.map(s => s.id));
    for (const id of Array.from(this.documents.keys())) {
      if (!seedIds.has(id)) {
        this.documents.delete(id);
      }
    }
    this.saveCustomDocuments();
  }
}

export const vectorDb = new LocalVectorDatabase();
