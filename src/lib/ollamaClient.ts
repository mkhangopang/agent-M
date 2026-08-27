/**
 * Ollama Client Abstraction for PLIA
 * Handles local communication with Ollama at http://localhost:11434 (or custom endpoint).
 * Supports model discovery, structured JSON completions, automatic repair,
 * local vector database grounding, streaming AI tutor chat, and deterministic offline fallback.
 */

import {
  AIChatMessage,
  AICoachPersona,
  BloomLevel,
  DiagnosticQuestion,
  OllamaConfig,
  RealWorldSimulationCase,
  VectorSearchResult,
} from '../types';
import { vectorDb } from './vectorDb';

const DEFAULT_CONFIG: OllamaConfig = {
  baseUrl: 'http://localhost:11434',
  selectedModel: 'llama3.2',
  availableModels: [],
  isReachable: false,
  lastChecked: '',
  mockMode: false,
};

const OLLAMA_CONFIG_KEY = 'plia_ollama_config_v1';

const PERSONA_SYSTEM_PROMPTS: Record<AICoachPersona, string> = {
  socratic: `You are Socrates AI, an expert adaptive learning mentor. Never give direct answers right away. Instead:
- Ask precise, probing questions that lead the learner to discover the solution from first principles.
- Highlight subtle contradictions or edge cases in their thinking.
- Praise constructive attempts and guide them step-by-step through mathematical or conceptual logic.
- Keep responses focused, encouraging, and pedagogically sound.`,

  senior_lead: `You are a Staff Principal Engineer / Industry Lead Specialist. 
- You evaluate problems from real-world production architecture, scalability, reliability, error handling, and performance perspectives.
- Challenge the learner on trade-offs, edge cases, silent failure modes, and industry best practices.
- Give crisp, actionable feedback with practical code/structural examples.`,

  feynman: `You are the Feynman Technique Mentor.
- Explain complex concepts using intuitive physical analogies, plain English, and zero unnecessary jargon.
- If the learner uses a buzzword without explaining it, ask them to describe the underlying mechanism like they are explaining it to a 10-year-old.
- Break multi-variable mechanisms into clear visual or step-by-step mental models.`,

  examiner: `You are a Rigorous Academic Examiner & Critical Debater.
- You test theoretical accuracy, rigorous domain definitions, boundary conditions, and quantitative validity.
- Detect cognitive biases, common misconceptions, and unjustified leaps of logic.
- Score arguments against formal rubrics and challenge the learner with counterexamples.`,
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
  public async checkHealth(): Promise<{ reachable: boolean; models: string[]; latencyMs: number; error?: string }> {
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

        this.saveConfig({
          isReachable: true,
          availableModels: models,
          lastChecked: new Date().toISOString(),
          latencyMs,
          selectedModel: isSelectedPresent
            ? this.config.selectedModel
            : models.find(m => m.includes('llama') || m.includes('qwen') || m.includes('mistral')) || models[0] || this.config.selectedModel,
        });

        return { reachable: true, models, latencyMs };
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
      return { reachable: false, models: [], latencyMs, error: errorMessage };
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

    // Vector DB Retrieval for chat context
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    const query = options.currentConcept ? `${options.currentConcept} ${lastUserMessage}` : lastUserMessage;

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

    // Format chat messages for Ollama API
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // If mock mode or Ollama is offline, return rich intelligent fallback
    if (this.config.mockMode || !this.config.isReachable) {
      const fallbackResponse = this.generateFallbackChatResponse(lastUserMessage, persona, options.subject);
      const latencyMs = Math.round(performance.now() - startTime);

      if (options.onChunk) {
        options.onChunk(fallbackResponse);
      }

      return {
        content: fallbackResponse,
        modelUsed: 'Local Heuristic Engine (Offline)',
        latencyMs,
        tokensPerSec: 42,
        vectorGrounding,
      };
    }

    try {
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
        throw new Error(`Ollama chat failed with status ${response.status}`);
      }

      const json = await response.json();
      const content = json.message?.content || 'No response generated.';
      const latencyMs = Math.round(performance.now() - startTime);
      const estimatedTokens = Math.round(content.length / 4);
      const tokensPerSec = latencyMs > 0 ? Math.round((estimatedTokens / latencyMs) * 1000) : 30;

      if (options.onChunk) {
        options.onChunk(content);
      }

      return {
        content,
        modelUsed: this.config.selectedModel,
        latencyMs,
        tokensPerSec: Math.max(1, tokensPerSec),
        vectorGrounding,
      };
    } catch (err) {
      console.warn('Ollama chat failed, using fallback:', err);
      const fallback = this.generateFallbackChatResponse(lastUserMessage, persona, options.subject);
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        content: fallback,
        modelUsed: 'Local Heuristic Engine (Fallback)',
        latencyMs,
        tokensPerSec: 35,
        vectorGrounding,
      };
    }
  }

  /**
   * Generate structured JSON completion from Ollama.
   * Grounded with local vector database context.
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

    // Retrieve relevant context from local Vector Database
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
            `[Vector DB Document ${idx + 1} (${s.document.domain} - ${s.document.topic}, Cosine Similarity: ${(s.similarityScore * 100).toFixed(1)}%)]:\n${s.document.content}`
        )
        .join('\n\n');

      augmentedSystemPrompt += `\n\n--- LOCAL VECTOR DATABASE RETRIEVED CONTEXT ---\n${contextText}\n--- END RETRIEVED CONTEXT ---\nUse the local vector context above to ensure subject accuracy and detect known misconceptions.`;
    }

    // If Mock Mode is enabled or Ollama is unreachable and we have a fallback
    if (this.config.mockMode || !this.config.isReachable) {
      if (fallbackGenerator) {
        return {
          data: fallbackGenerator(),
          isFromOllama: false,
          vectorSources,
        };
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s for local model inference

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
            temperature: 0.2, // low temperature for consistent evaluation and structured schemas
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama chat request failed with status: ${response.statusText}`);
      }

      const json = await response.json();
      const content = json.message?.content || '{}';

      // Parse JSON
      try {
        const parsed: T = JSON.parse(content);
        return { data: parsed, isFromOllama: true, vectorSources };
      } catch (parseError) {
        console.warn('Initial Ollama JSON parse failed, attempting regex extraction:', parseError);
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          const extracted: T = JSON.parse(match[0]);
          return { data: extracted, isFromOllama: true, vectorSources };
        }
        throw new Error('Could not parse valid JSON from Ollama response');
      }
    } catch (error) {
      console.warn('Ollama call error, falling back to local pedagogical engine:', error);
      if (fallbackGenerator) {
        return {
          data: fallbackGenerator(),
          isFromOllama: false,
          vectorSources,
        };
      }
      throw error;
    }
  }

  /**
   * Generate a completely dynamic, realistic real-world simulation problem
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
  "title": "A catchy, realistic professional title (e.g. Incident Post-Mortem, Emergency Triage, System Scalability Failure)",
  "subject": "${subject}",
  "domain": "${domain}",
  "difficulty": "${difficulty}",
  "bloomLevel": "analyze",
  "industryContext": "Realistic company or organization background (e.g. Fintech trading engine, BioTech research lab, Hospital ICU)",
  "incidentOrProblem": "Detailed, multi-paragraph real-world problem description with specific numbers, symptoms, or observed defects.",
  "starterDataOrCode": "Realistic code snippet, log extract, mathematical data table, or telemetry metrics illustrating the problem.",
  "constraints": ["Constraint 1", "Constraint 2", "Constraint 3"],
  "actionPrompt": "Clear, direct actionable task prompt for the learner to solve or analyze.",
  "expectedCriteria": ["Criterion 1: Identification of root mechanism", "Criterion 2: Trade-off analysis", "Criterion 3: Proposed robust solution"],
  "hints": ["First-principles hint", "Edge-case clue", "Architectural guidance"],
  "expertAnalysis": "Detailed reference model solution explaining the optimal approach and why common naive approaches fail."
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

    try {
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
    } catch {
      return fallback;
    }
  }

  /**
   * Fallback chat generator for offline mode
   */
  private generateFallbackChatResponse(userPrompt: string, persona: AICoachPersona, subject?: string): string {
    const sub = subject || 'your subject';
    const lower = userPrompt.toLowerCase();

    if (persona === 'socratic') {
      if (lower.includes('how') || lower.includes('what') || lower.includes('why')) {
        return `Let's break that down from first principles in **${sub}**. 

Before jumping to the final conclusion, consider this foundational question:
1. What is the fundamental invariant or physical/mathematical law governing this mechanism?
2. If you changed the primary input variable by 2x, what would happen to the opposing force or state?

Take a shot at answering that, and we will build the full solution together!`;
      }
      return `Good thinking! Let's examine the boundaries of your idea. 

What happens if an unexpected edge case occurs—such as zero input, extreme load, or a conflicting constraint? How would your explanation in **${sub}** adapt?`;
    }

    if (persona === 'senior_lead') {
      return `From an industry engineering perspective in **${sub}**:

- **Core Assessment**: Your approach touches on the right mechanism, but in production, we have to account for latency, failure modes, and observability.
- **Key Trade-off**: Are you optimizing for simplicity or throughput? Have you considered what happens when dependencies fail?
- **Action Item**: Detail how you would add defensive validation and rollback mechanisms for this concept.`;
    }

    if (persona === 'feynman') {
      return `Imagine we are explaining this to someone who has never heard of **${sub}**.

Instead of using technical terms, picture it like this:
- Imagine a highway where cars represent the data/energy.
- What happens at the toll booth (the bottleneck)?

Can you describe the mechanism using this simple picture without using any formal jargon?`;
    }

    // examiner
    return `Let's evaluate your argument against formal standards in **${sub}**:

- **Theoretical Rigor**: How do you prove this holds true under non-ideal conditions?
- **Misconception Check**: Ensure you are not confusing correlation with causation here.
- **Next Question**: Define the exact boundary conditions under which this relationship breaks down.`;
  }
}

export const ollamaService = new OllamaService();
