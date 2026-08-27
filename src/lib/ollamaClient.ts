/**
 * Ollama Client Abstraction for PLIA
 * Handles local communication with Ollama at http://localhost:11434 (or custom endpoint).
 * Supports model discovery, one-click model pulling, real vector embeddings (/api/embeddings & /api/embed),
 * structured JSON completions, automatic repair, local vector database grounding, streaming AI tutor chat,
 * and a unified deterministic offline fallback engine.
 */

import {
  AIChatMessage,
  AICoachPersona,
  OllamaConfig,
  RealWorldSimulationCase,
  VectorSearchResult,
} from '../types';
import { generateLocalEmbedding, vectorDb } from './vectorDb';

const DEFAULT_CONFIG: OllamaConfig = {
  baseUrl: 'http://localhost:11434',
  selectedModel: 'llama3.2',
  embeddingModel: 'nomic-embed-text',
  availableModels: [],
  isReachable: false,
  lastChecked: '',
  mockMode: false,
};

const OLLAMA_CONFIG_KEY = 'plia_ollama_config_v1';

export const PERSONA_SYSTEM_PROMPTS: Record<AICoachPersona, string> = {
  socratic: `You are Socrates AI, an adaptive educational intelligence mentor.
- Never provide direct answers immediately; guide the learner to uncover solutions from first principles.
- Formulate focused, probing questions that test conceptual assumptions and boundary conditions.
- Highlight contradictions, celebrate methodical reasoning, and scaffold understanding progressively.`,

  senior_lead: `You are a Staff Principal Systems Architect & Technical Director.
- Evaluate scenarios with an emphasis on production resilience, scale, error-budget trade-offs, and failure modes.
- Challenge naive assumptions, unhandled concurrency, and architectural bottlenecks with pragmatic domain depth.
- Provide crisp, actionable feedback backed by real-world engineering standards.`,

  feynman: `You are the Feynman Technique Explainer.
- Deconstruct complex, multi-variable mechanisms using intuitive physical analogies, plain English, and zero jargon.
- If the learner uses buzzwords without explaining their mechanics, ask for a 10-year-old level physical model.
- Transform abstract equations and axioms into vivid, memorable mental models.`,

  examiner: `You are a Rigorous Academic Examiner & Critical Debater.
- Scrutinize theoretical definitions, quantitative invariants, and empirical proofs with uncompromising precision.
- Expose cognitive biases, unjustified inferential leaps, and subtle domain misconceptions.
- Score arguments against formal rubrics and challenge hypotheses with pointed counterexamples.`,
};

class OllamaService {
  private config: OllamaConfig = DEFAULT_CONFIG;

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      const stored = localStorage.getItem(OLLAMA_CONFIG_KEY);
      if (stored) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch {
      this.config = DEFAULT_CONFIG;
    }
  }

  public saveConfig(newConfig: Partial<OllamaConfig>): OllamaConfig {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(OLLAMA_CONFIG_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to persist Ollama config:', e);
    }
    return this.config;
  }

  public getConfig(): OllamaConfig {
    return { ...this.config };
  }

  /**
   * Health-check Ollama endpoint and retrieve list of downloaded local models
   */
  public async checkHealth(): Promise<{
    reachable: boolean;
    models: string[];
    hasEmbeddingModel: boolean;
    latencyMs: number;
    error?: string;
  }> {
    const startTime = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
      });

      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - startTime);

      if (response.ok) {
        const data = await response.json();
        const models = Array.isArray(data.models) ? data.models.map((m: { name: string }) => m.name) : [];
        const isSelectedPresent = models.includes(this.config.selectedModel);
        const embedModels = models.filter(m => m.includes('embed') || m.includes('nomic') || m.includes('bge') || m.includes('minilm'));
        const activeEmbedModel = embedModels.includes(this.config.embeddingModel)
          ? this.config.embeddingModel
          : embedModels[0] || this.config.embeddingModel;

        const updatedModel = isSelectedPresent
          ? this.config.selectedModel
          : models.find(m => m.includes('llama') || m.includes('qwen') || m.includes('mistral') || m.includes('phi')) || models[0] || this.config.selectedModel;

        this.saveConfig({
          isReachable: true,
          availableModels: models,
          lastChecked: new Date().toISOString(),
          latencyMs,
          selectedModel: updatedModel,
          embeddingModel: activeEmbedModel,
        });

        return {
          reachable: true,
          models,
          hasEmbeddingModel: embedModels.length > 0 || models.includes(this.config.embeddingModel),
          latencyMs,
        };
      } else {
        throw new Error(`Ollama returned HTTP status ${response.status}`);
      }
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - startTime);
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.saveConfig({
        isReachable: false,
        lastChecked: new Date().toISOString(),
        latencyMs,
      });
      return {
        reachable: false,
        models: [],
        hasEmbeddingModel: false,
        latencyMs,
        error: errorMessage,
      };
    }
  }

  /**
   * One-click model pull with streaming progress updates
   */
  public async pullModel(
    modelName: string,
    onProgress?: (status: string, completed?: number, total?: number) => void
  ): Promise<{ success: boolean; message: string }> {
    if (this.config.mockMode || !this.config.isReachable) {
      // Simulate successful pull in mock mode
      if (onProgress) {
        onProgress('Downloading manifest...', 10, 100);
        await new Promise(r => setTimeout(r, 400));
        onProgress('Pulling model layers...', 60, 100);
        await new Promise(r => setTimeout(r, 600));
        onProgress('Verifying checksum...', 100, 100);
      }
      return { success: true, message: `Model ${modelName} registered (Mock Mode).` };
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, stream: true }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Failed to initiate pull for ${modelName}: HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.status && onProgress) {
              onProgress(data.status, data.completed, data.total);
            }
          } catch {
            // ignore non-json chunks
          }
        }
      }

      await this.checkHealth();
      return { success: true, message: `Successfully pulled ${modelName}` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: msg };
    }
  }

  /**
   * Real Vector Embedding Generator via Ollama (/api/embeddings or /api/embed)
   * Falls back gracefully to deterministic dense heuristic vector if Ollama or embed model is unavailable.
   */
  public async embed(text: string, customModel?: string): Promise<number[]> {
    const trimmed = text.trim();
    if (!trimmed) {
      return new Array(128).fill(0);
    }

    // If offline or mock mode, use high-speed deterministic heuristic embedding
    if (this.config.mockMode || !this.config.isReachable) {
      return generateLocalEmbedding(trimmed);
    }

    const modelToUse = customModel || this.config.embeddingModel || this.config.selectedModel;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      // Attempt /api/embeddings (standard Ollama embeddings endpoint)
      const response = await fetch(`${this.config.baseUrl}/api/embeddings`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelToUse,
          prompt: trimmed,
        }),
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (Array.isArray(json.embedding) && json.embedding.length > 0) {
          // Normalize vector to unit length
          return this.normalizeVector(json.embedding);
        }
      }

      // If /api/embeddings returned an error, attempt newer /api/embed format
      const embedController = new AbortController();
      const embedTimeoutId = setTimeout(() => embedController.abort(), 6000);

      const responseEmbed = await fetch(`${this.config.baseUrl}/api/embed`, {
        method: 'POST',
        signal: embedController.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelToUse,
          input: trimmed,
        }),
      });

      clearTimeout(embedTimeoutId);

      if (responseEmbed.ok) {
        const embedJson = await responseEmbed.json();
        const embeddings = embedJson.embeddings;
        if (Array.isArray(embeddings) && embeddings.length > 0 && Array.isArray(embeddings[0])) {
          return this.normalizeVector(embeddings[0]);
        }
      }

      // If Ollama returned non-200, fallback to local dense vector
      return generateLocalEmbedding(trimmed);
    } catch {
      // Fallback seamlessly to deterministic local heuristic vector
      return generateLocalEmbedding(trimmed);
    }
  }

  private normalizeVector(vec: number[]): number[] {
    let sumSquares = 0;
    for (let i = 0; i < vec.length; i++) {
      sumSquares += vec[i] * vec[i];
    }
    const norm = Math.sqrt(sumSquares);
    if (norm === 0) return vec;
    return vec.map(v => v / norm);
  }

  /**
   * Unified AI Execution Wrapper with Standardized Offline Fallback
   */
  private async executeWithFallback<T>(
    operationName: string,
    ollamaRunner: () => Promise<T>,
    fallbackGenerator: () => T
  ): Promise<{ data: T; isFromOllama: boolean; latencyMs: number }> {
    const startTime = performance.now();

    // Direct fallback if offline or mock mode
    if (this.config.mockMode || !this.config.isReachable) {
      const data = fallbackGenerator();
      const latencyMs = Math.round(performance.now() - startTime);
      return { data, isFromOllama: false, latencyMs };
    }

    try {
      const data = await ollamaRunner();
      const latencyMs = Math.round(performance.now() - startTime);
      return { data, isFromOllama: true, latencyMs };
    } catch (err) {
      console.warn(`[PLIA OllamaService] ${operationName} failed, executing standardized fallback:`, err);
      const data = fallbackGenerator();
      const latencyMs = Math.round(performance.now() - startTime);
      return { data, isFromOllama: false, latencyMs };
    }
  }

  /**
   * Interactive Chat Completion with streaming token callback or complete response
   */
  public async chat(
    messages: AIChatMessage[],
    options: {
      persona?: AICoachPersona;
      subject?: string;
      currentConcept?: string;
      onChunk?: (chunk: string) => void;
    } = {}
  ): Promise<{ content: string; modelUsed: string; latencyMs: number; tokensPerSec: number; vectorGrounding: string[] }> {
    const startTime = performance.now();
    const persona = options.persona || 'socratic';
    const basePersonaPrompt = PERSONA_SYSTEM_PROMPTS[persona] || PERSONA_SYSTEM_PROMPTS.socratic;

    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    const query = options.currentConcept ? `${options.currentConcept} ${lastUserMessage}` : lastUserMessage;

    // Retrieve vector context
    const vectorResults = query ? vectorDb.search(query, { subject: options.subject, topK: 2, minScore: 0.12 }) : [];
    const vectorGrounding = vectorResults.map(r => `${r.document.domain}: ${r.document.topic}`);

    let systemPrompt = `${basePersonaPrompt}\n\nSubject Context: ${options.subject || 'General Problem Solving'}`;
    if (options.currentConcept) {
      systemPrompt += `\nActive Learning Concept: ${options.currentConcept}`;
    }

    if (vectorResults.length > 0) {
      systemPrompt += `\n\n--- LOCAL VECTOR DB GROUNDING ---\n${vectorResults
        .map(v => `[${v.document.topic} (${v.document.domain})]: ${v.document.content}`)
        .join('\n\n')}\n--- END LOCAL CONTEXT ---`;
    }

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ];

    const fallbackResponse = this.generateFallbackChatResponse(lastUserMessage, persona, options.subject);

    const runnerResult = await this.executeWithFallback<string>(
      'chat',
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(`${this.config.baseUrl}/api/chat`, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.config.selectedModel,
            messages: formattedMessages,
            stream: false,
            options: {
              temperature: 0.7,
              top_p: 0.9,
            },
          }),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Ollama chat returned HTTP ${response.status}`);
        }

        const json = await response.json();
        return json.message?.content || fallbackResponse;
      },
      () => fallbackResponse
    );

    const content = runnerResult.data;
    if (options.onChunk) {
      options.onChunk(content);
    }

    const latencyMs = runnerResult.latencyMs;
    const estimatedTokens = Math.max(1, Math.round(content.length / 4));
    const tokensPerSec = latencyMs > 0 ? Math.round((estimatedTokens / latencyMs) * 1000) : 35;

    return {
      content,
      modelUsed: runnerResult.isFromOllama ? this.config.selectedModel : 'Local Heuristic Engine (Offline)',
      latencyMs,
      tokensPerSec: Math.max(1, tokensPerSec),
      vectorGrounding,
    };
  }

  /**
   * Generate structured JSON completion from Ollama with local vector database grounding.
   */
  public async generateStructured<T>(
    systemPrompt: string,
    userPrompt: string,
    options: {
      queryForVectorContext?: string;
      subject?: string;
      fallbackGenerator?: () => T;
    } = {}
  ): Promise<{ data: T; isFromOllama: boolean; vectorSources: VectorSearchResult[] }> {
    const { queryForVectorContext, subject, fallbackGenerator } = options;

    let vectorSources: VectorSearchResult[] = [];
    if (queryForVectorContext) {
      vectorSources = vectorDb.search(queryForVectorContext, {
        subject,
        topK: 3,
        minScore: 0.15,
      });
    }

    let augmentedSystemPrompt = systemPrompt;
    if (vectorSources.length > 0) {
      const contextText = vectorSources
        .map(
          (s, idx) =>
            `[Vector DB Document ${idx + 1} (${s.document.domain} - ${s.document.topic}, Score: ${(s.similarityScore * 100).toFixed(1)}%)]:\n${s.document.content}`
        )
        .join('\n\n');

      augmentedSystemPrompt += `\n\n--- LOCAL VECTOR DATABASE RETRIEVED CONTEXT ---\n${contextText}\n--- END RETRIEVED CONTEXT ---`;
    }

    const defaultFallback = (): T => {
      if (fallbackGenerator) return fallbackGenerator();
      return {} as T;
    };

    const result = await this.executeWithFallback<T>(
      'generateStructured',
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);

        const response = await fetch(`${this.config.baseUrl}/api/chat`, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.config.selectedModel,
            messages: [
              { role: 'system', content: augmentedSystemPrompt },
              { role: 'user', content: userPrompt },
            ],
            format: 'json',
            stream: false,
            options: {
              temperature: 0.2,
            },
          }),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Ollama chat request failed: HTTP ${response.status}`);
        }

        const json = await response.json();
        const content = json.message?.content || '{}';

        try {
          return JSON.parse(content) as T;
        } catch {
          const match = content.match(/\{[\s\S]*\}/);
          if (match) {
            return JSON.parse(match[0]) as T;
          }
          throw new Error('Could not parse valid JSON from Ollama response');
        }
      },
      defaultFallback
    );

    return {
      data: result.data,
      isFromOllama: result.isFromOllama,
      vectorSources,
    };
  }

  /**
   * Generate a dynamic real-world simulation problem
   */
  public async generateDynamicSimulationCase(
    subject: string,
    domain: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'intermediate'
  ): Promise<RealWorldSimulationCase> {
    const prompt = `Generate a realistic, immersive real-world industry case study / scenario problem for subject: "${subject}", domain: "${domain}", difficulty: "${difficulty}".
Format your response as a valid JSON object matching this exact TypeScript schema:
{
  "id": "sim-${Date.now()}",
  "title": "A catchy, realistic professional title",
  "subject": "${subject}",
  "domain": "${domain}",
  "difficulty": "${difficulty}",
  "bloomLevel": "analyze",
  "industryContext": "Realistic company or organization background",
  "incidentOrProblem": "Detailed, multi-paragraph real-world problem description with specific numbers, symptoms, or observed defects.",
  "starterDataOrCode": "Realistic code snippet, log extract, mathematical data table, or telemetry metrics.",
  "constraints": ["Constraint 1", "Constraint 2", "Constraint 3"],
  "actionPrompt": "Clear, direct actionable task prompt for the learner to solve or analyze.",
  "expectedCriteria": ["Criterion 1", "Criterion 2", "Criterion 3"],
  "hints": ["First-principles hint", "Edge-case clue", "Architectural guidance"],
  "expertAnalysis": "Detailed reference model solution explaining the optimal approach."
}`;

    const fallback: RealWorldSimulationCase = {
      id: `sim-${Date.now()}`,
      title: `${subject} Real-World Diagnostic: ${domain} Case Study`,
      subject,
      domain,
      difficulty,
      bloomLevel: 'analyze',
      industryContext: `A high-throughput enterprise operating in ${subject} is facing unexpected instability and anomalous behavior during peak operational cycles.`,
      incidentOrProblem: `During standard operations in ${domain}, anomalous telemetry indicated a cascade failure. The system failed to sustain steady-state invariants when throughput exceeded 120% baseline. Initial logs show degraded latency, unhandled race conditions, and divergent states.`,
      starterDataOrCode: `// Telemetry Snapshot (${domain})\n{\n  "status": "CRITICAL",\n  "throughput_load": "142%",\n  "observed_invariant_violation": true,\n  "error_stack": "InvalidStateTransition in ${domain} controller at cycle 4092"\n}`,
      constraints: [
        'Must maintain data consistency without sacrificing overall throughput',
        'Cannot introduce unbounded memory or computational overhead',
        'Must explicitly handle concurrent race conditions and boundary cases',
      ],
      actionPrompt: `Analyze the failure mechanism in ${domain}. Identify the exact root cause, explain why naive retry mechanisms will exacerbate the issue, and provide an architectural remediation plan.`,
      expectedCriteria: [
        `Explicitly addresses the governing principles of ${domain}`,
        'Identifies systemic bottlenecks and side-effects',
        'Formulates a verifiable, resilient solution architecture',
      ],
      hints: [
        `Consider how state invariants are maintained when load exceeds baseline assumptions in ${domain}.`,
        'Look for hidden synchronization bottlenecks or unbuffered queues.',
        'Apply backpressure or idempotent transaction semantics.',
      ],
      expertAnalysis: `The optimal resolution decouples the ingestion pipeline using idempotent processing and structured backpressure, preventing state divergence and ensuring deterministic recovery.`,
    };

    const res = await this.generateStructured<RealWorldSimulationCase>(
      'You are an expert real-world scenario architect for technical and scientific domains. Return valid JSON only.',
      prompt,
      {
        queryForVectorContext: `${subject} ${domain} case study simulation`,
        subject,
        fallbackGenerator: () => fallback,
      }
    );
    return res.data;
  }

  /**
   * Deterministic fallback chat generator for offline mode
   */
  private generateFallbackChatResponse(userPrompt: string, persona: AICoachPersona, subject?: string): string {
    const sub = subject || 'your subject';
    const lower = userPrompt.toLowerCase();

    if (persona === 'socratic') {
      if (lower.includes('how') || lower.includes('what') || lower.includes('why')) {
        return `Let's break that down from first principles in **${sub}**. 

Before jumping to the final conclusion, consider this foundational question:
1. What is the fundamental invariant or governing law in this scenario?
2. If you altered the primary control parameter by 2x, what would happen to the opposing force or state?

Take a shot at articulating that, and we will construct the complete solution step-by-step!`;
      }
      return `Good observation! Let's examine the boundaries of your idea. 

What happens if an unexpected edge case occurs—such as zero input, extreme load, or a conflicting constraint? How would your explanation in **${sub}** adapt?`;
    }

    if (persona === 'senior_lead') {
      return `From an industry engineering perspective in **${sub}**:

- **Core Assessment**: Your approach touches on the right mechanism, but in production, we have to account for latency, failure modes, and observability.
- **Key Trade-off**: Are you optimizing for simplicity or throughput? Have you considered what happens when dependencies fail?
- **Action Item**: Detail how you would add defensive validation and rollback mechanisms for this concept.`;
    }

    if (persona === 'feynman') {
      return `Imagine we are explaining this to someone who has never studied **${sub}**.

Instead of using technical terms, picture it like this:
- Imagine a highway where cars represent the data or energy units.
- What happens at the bottleneck?

Can you describe the mechanism using this simple picture without using any formal buzzwords?`;
    }

    // examiner
    return `Let's evaluate your argument against formal academic standards in **${sub}**:

- **Theoretical Rigor**: How do you prove this holds true under non-ideal boundary conditions?
- **Misconception Check**: Ensure you are not confusing correlation with causation here.
- **Next Question**: Define the exact operational regime under which this relationship breaks down.`;
  }
}

export const ollamaService = new OllamaService();
