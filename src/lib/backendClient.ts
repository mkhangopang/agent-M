/**
 * Local Backend API Client for PLIA (FastAPI + SQLite)
 * Communicates with http://localhost:8000 with offline graceful fallback.
 */

import {
  BackendConfig,
  DiagnosticState,
  LearnerProfile,
  LearningPathway,
  PathwaySnapshot,
  SpacedReviewItem,
  VectorDocument,
} from '../types';

const BACKEND_CONFIG_KEY = 'plia_backend_config_v1';

const DEFAULT_BACKEND_CONFIG: BackendConfig = {
  baseUrl: 'http://localhost:8000',
  isConnected: false,
  lastChecked: '',
};

class LocalBackendService {
  private config: BackendConfig = DEFAULT_BACKEND_CONFIG;

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      const stored = localStorage.getItem(BACKEND_CONFIG_KEY);
      if (stored) {
        this.config = { ...DEFAULT_BACKEND_CONFIG, ...JSON.parse(stored) };
      }
    } catch {
      this.config = DEFAULT_BACKEND_CONFIG;
    }
  }

  public saveConfig(newConfig: Partial<BackendConfig>): BackendConfig {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(BACKEND_CONFIG_KEY, JSON.stringify(this.config));
    } catch {
      // ignore
    }
    return this.config;
  }

  public getConfig(): BackendConfig {
    return { ...this.config };
  }

  public async checkHealth(): Promise<{
    connected: boolean;
    learnerCount: number;
    databasePath?: string;
    latencyMs: number;
  }> {
    const startTime = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
      });

      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - startTime);

      if (res.ok) {
        const data = await res.json();
        this.saveConfig({
          isConnected: true,
          lastChecked: new Date().toISOString(),
          databasePath: data.database_path,
          learnerCount: data.learner_count,
          latencyMs,
        });
        return {
          connected: true,
          learnerCount: data.learner_count || 0,
          databasePath: data.database_path,
          latencyMs,
        };
      }
      throw new Error(`HTTP ${res.status}`);
    } catch {
      const latencyMs = Math.round(performance.now() - startTime);
      this.saveConfig({
        isConnected: false,
        lastChecked: new Date().toISOString(),
        latencyMs,
      });
      return {
        connected: false,
        learnerCount: 0,
        latencyMs,
      };
    }
  }

  // --- Multi-Learner ---
  public async getLearners(): Promise<Array<{ learner_id: string; name: string; subject: string; goal?: string; experience_level?: string; available_learning_time?: string }> | null> {
    if (!this.config.isConnected) return null;
    try {
      const res = await fetch(`${this.config.baseUrl}/api/learners`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return null;
  }

  public async saveLearner(learner: { learner_id: string; name: string; subject: string; goal?: string; experience_level?: string; available_learning_time?: string }): Promise<boolean> {
    if (!this.config.isConnected) return false;
    try {
      const res = await fetch(`${this.config.baseUrl}/api/learners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(learner),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async deleteLearner(learnerId: string): Promise<boolean> {
    if (!this.config.isConnected) return false;
    try {
      const res = await fetch(`${this.config.baseUrl}/api/learners/${learnerId}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  }

  // --- Profile ---
  public async getProfile(learnerId: string): Promise<LearnerProfile | null> {
    if (!this.config.isConnected) return null;
    try {
      const res = await fetch(`${this.config.baseUrl}/api/learners/${learnerId}/profile`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return null;
  }

  public async saveProfile(learnerId: string, profile: LearnerProfile): Promise<boolean> {
    if (!this.config.isConnected) return false;
    try {
      const res = await fetch(`${this.config.baseUrl}/api/learners/${learnerId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // --- Pathway ---
  public async getPathway(learnerId: string): Promise<LearningPathway | null> {
    if (!this.config.isConnected) return null;
    try {
      const res = await fetch(`${this.config.baseUrl}/api/learners/${learnerId}/pathway`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return null;
  }

  public async savePathway(learnerId: string, pathway: LearningPathway): Promise<boolean> {
    if (!this.config.isConnected) return false;
    try {
      const res = await fetch(`${this.config.baseUrl}/api/learners/${learnerId}/pathway`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pathway),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // --- Diagnostic State ---
  public async getDiagnosticState(learnerId: string): Promise<DiagnosticState | null> {
    if (!this.config.isConnected) return null;
    try {
      const res = await fetch(`${this.config.baseUrl}/api/learners/${learnerId}/diagnostic-state`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return null;
  }

  public async saveDiagnosticState(learnerId: string, state: DiagnosticState): Promise<boolean> {
    if (!this.config.isConnected) return false;
    try {
      const res = await fetch(`${this.config.baseUrl}/api/learners/${learnerId}/diagnostic-state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // --- Snapshots ---
  public async getSnapshots(learnerId: string): Promise<PathwaySnapshot[] | null> {
    if (!this.config.isConnected) return null;
    try {
      const res = await fetch(`${this.config.baseUrl}/api/learners/${learnerId}/snapshots`);
      if (res.ok) {
        const list = await res.json();
        return list.map((item: { snapshot?: PathwaySnapshot } & PathwaySnapshot) => item.snapshot || item);
      }
    } catch {
      // fallback
    }
    return null;
  }

  public async saveSnapshot(learnerId: string, snapshot: PathwaySnapshot): Promise<boolean> {
    if (!this.config.isConnected) return false;
    try {
      const res = await fetch(`${this.config.baseUrl}/api/learners/${learnerId}/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async deleteSnapshot(snapshotId: string): Promise<boolean> {
    if (!this.config.isConnected) return false;
    try {
      const res = await fetch(`${this.config.baseUrl}/api/snapshots/${snapshotId}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  }

  // --- Database Export / Import ---
  public async exportFullDatabase(): Promise<Record<string, unknown> | null> {
    if (!this.config.isConnected) return null;
    try {
      const res = await fetch(`${this.config.baseUrl}/api/export`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return null;
  }

  public async importFullDatabase(dump: Record<string, unknown>): Promise<boolean> {
    if (!this.config.isConnected) return false;
    try {
      const res = await fetch(`${this.config.baseUrl}/api/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dump),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const localBackendService = new LocalBackendService();
