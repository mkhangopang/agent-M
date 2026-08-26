/**
 * Ollama Client Abstraction for PLIA
 * Handles local communication with Ollama at http://localhost:11434 (or custom endpoint).
 * Supports model discovery, structured JSON completions, automatic repair,
 * local vector database grounding, and deterministic offline fallback.
 */

import { OllamaConfig, VectorSearchResult } from '../types';
import { vectorDb } from './vectorDb';

const DEFAULT_CONFIG: OllamaConfig = {
  baseUrl: 'http://localhost:11434',
  selectedModel: 'qwen3:8b',
  availableModels: [],
  isReachable: false,
  lastChecked: '',
  mockMode: false,
};

const OLLAMA_CONFIG_KEY = 'plia_ollama_config_v1';

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
      // In browser environment, check Ollama via fetch
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
          selectedModel: isSelectedPresent ? this.config.selectedModel : (models[0] || this.config.selectedModel),
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
}

export const ollamaService = new OllamaService();
