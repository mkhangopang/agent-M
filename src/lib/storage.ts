/**
 * Local-First Storage & Multi-Learner State Manager for PLIA
 * Supports SQLite backend synchronization via `localBackendService` with
 * 100% resilient client-side offline caching.
 */

import {
  AIChatMessage,
  DiagnosticState,
  LearnerProfile,
  LearningPathway,
  PathwaySnapshot,
  SpacedReviewItem,
} from '../types';
import { localBackendService } from './backendClient';

const ACTIVE_LEARNER_KEY = 'plia_active_learner_id_v2';
const LEARNERS_REGISTRY_KEY = 'plia_learners_registry_v2';
const DEFAULT_LEARNER_ID = 'learner-default-01';

export interface LearnerRegistryItem {
  learnerId: string;
  name: string;
  subject: string;
  goal: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'unspecified';
  availableLearningTime: string;
  createdAt: string;
  lastActiveAt: string;
}

export class LocalStorageManager {
  private activeLearnerId: string = DEFAULT_LEARNER_ID;

  constructor() {
    this.initActiveLearner();
  }

  private initActiveLearner(): void {
    try {
      const storedId = localStorage.getItem(ACTIVE_LEARNER_KEY);
      if (storedId) {
        this.activeLearnerId = storedId;
      } else {
        this.activeLearnerId = DEFAULT_LEARNER_ID;
        localStorage.setItem(ACTIVE_LEARNER_KEY, DEFAULT_LEARNER_ID);
        this.registerLearner({
          learnerId: DEFAULT_LEARNER_ID,
          name: 'Primary Learner',
          subject: 'Computer Science',
          goal: 'Master Distributed Systems & System Architecture',
          experienceLevel: 'intermediate',
          availableLearningTime: '30 mins / day',
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        });
      }
    } catch {
      this.activeLearnerId = DEFAULT_LEARNER_ID;
    }
  }

  // --- Multi-Learner Management ---
  public getActiveLearnerId(): string {
    return this.activeLearnerId;
  }

  public setActiveLearnerId(learnerId: string): void {
    this.activeLearnerId = learnerId;
    try {
      localStorage.setItem(ACTIVE_LEARNER_KEY, learnerId);
      this.touchLearnerActivity(learnerId);
    } catch {
      // ignore
    }
  }

  public getLearners(): LearnerRegistryItem[] {
    try {
      const raw = localStorage.getItem(LEARNERS_REGISTRY_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // fallback
    }
    return [
      {
        learnerId: DEFAULT_LEARNER_ID,
        name: 'Primary Learner',
        subject: 'Computer Science',
        goal: 'Master Distributed Systems & Architecture',
        experienceLevel: 'intermediate',
        availableLearningTime: '30 mins / day',
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      },
    ];
  }

  public registerLearner(item: LearnerRegistryItem): void {
    const list = this.getLearners();
    const existingIndex = list.findIndex(l => l.learnerId === item.learnerId);
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...item, lastActiveAt: new Date().toISOString() };
    } else {
      list.push(item);
    }
    try {
      localStorage.setItem(LEARNERS_REGISTRY_KEY, JSON.stringify(list));
      // Sync with local backend
      localBackendService.saveLearner({
        learner_id: item.learnerId,
        name: item.name,
        subject: item.subject,
        goal: item.goal,
        experience_level: item.experienceLevel,
        available_learning_time: item.availableLearningTime,
      });
    } catch {
      // ignore
    }
  }

  public deleteLearner(learnerId: string): void {
    const list = this.getLearners().filter(l => l.learnerId !== learnerId);
    try {
      localStorage.setItem(LEARNERS_REGISTRY_KEY, JSON.stringify(list));
      localStorage.removeItem(`plia_profile_${learnerId}`);
      localStorage.removeItem(`plia_pathway_${learnerId}`);
      localStorage.removeItem(`plia_diagnostic_state_${learnerId}`);
      localStorage.removeItem(`plia_snapshots_${learnerId}`);
      localStorage.removeItem(`plia_reviews_${learnerId}`);
      localStorage.removeItem(`plia_chat_${learnerId}`);

      localBackendService.deleteLearner(learnerId);

      if (this.activeLearnerId === learnerId) {
        const next = list[0]?.learnerId || DEFAULT_LEARNER_ID;
        this.setActiveLearnerId(next);
      }
    } catch {
      // ignore
    }
  }

  private touchLearnerActivity(learnerId: string): void {
    const list = this.getLearners();
    const item = list.find(l => l.learnerId === learnerId);
    if (item) {
      item.lastActiveAt = new Date().toISOString();
      try {
        localStorage.setItem(LEARNERS_REGISTRY_KEY, JSON.stringify(list));
      } catch {
        // ignore
      }
    }
  }

  // --- Scoped Learner Profile ---
  public saveLearnerProfile(profile: LearnerProfile): void {
    const key = `plia_profile_${profile.learnerId || this.activeLearnerId}`;
    try {
      localStorage.setItem(key, JSON.stringify(profile));
      this.touchLearnerActivity(profile.learnerId || this.activeLearnerId);
      // Sync to SQLite backend
      localBackendService.saveProfile(profile.learnerId || this.activeLearnerId, profile);
    } catch (e) {
      console.warn('Failed to save learner profile:', e);
    }
  }

  public getLearnerProfile(learnerId?: string): LearnerProfile | null {
    const targetId = learnerId || this.activeLearnerId;
    const key = `plia_profile_${targetId}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {
      return null;
    }
    return null;
  }

  // --- Scoped Learning Pathway ---
  public saveLearningPathway(pathway: LearningPathway): void {
    const key = `plia_pathway_${pathway.learnerId || this.activeLearnerId}`;
    try {
      localStorage.setItem(key, JSON.stringify(pathway));
      localBackendService.savePathway(pathway.learnerId || this.activeLearnerId, pathway);
    } catch (e) {
      console.warn('Failed to save learning pathway:', e);
    }
  }

  public getLearningPathway(learnerId?: string): LearningPathway | null {
    const targetId = learnerId || this.activeLearnerId;
    const key = `plia_pathway_${targetId}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {
      return null;
    }
    return null;
  }

  // --- Scoped Diagnostic State ---
  public saveDiagnosticState(state: DiagnosticState): void {
    const key = `plia_diagnostic_state_${state.learnerId || this.activeLearnerId}`;
    try {
      localStorage.setItem(key, JSON.stringify(state));
      localBackendService.saveDiagnosticState(state.learnerId || this.activeLearnerId, state);
    } catch (e) {
      console.warn('Failed to save diagnostic state:', e);
    }
  }

  public getDiagnosticState(learnerId?: string): DiagnosticState | null {
    const targetId = learnerId || this.activeLearnerId;
    const key = `plia_diagnostic_state_${targetId}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {
      return null;
    }
    return null;
  }

  public clearDiagnosticState(learnerId?: string): void {
    const targetId = learnerId || this.activeLearnerId;
    try {
      localStorage.removeItem(`plia_diagnostic_state_${targetId}`);
    } catch {
      // ignore
    }
  }

  // --- Scoped Snapshots ---
  public saveSnapshot(snapshot: PathwaySnapshot): void {
    const targetId = snapshot.learnerId || this.activeLearnerId;
    const key = `plia_snapshots_${targetId}`;
    try {
      const existing = this.getSnapshots(targetId);
      const updated = [snapshot, ...existing.filter(s => s.id !== snapshot.id)];
      localStorage.setItem(key, JSON.stringify(updated));
      localBackendService.saveSnapshot(targetId, snapshot);
    } catch (e) {
      console.warn('Failed to save snapshot:', e);
    }
  }

  public getSnapshots(learnerId?: string): PathwaySnapshot[] {
    const targetId = learnerId || this.activeLearnerId;
    const key = `plia_snapshots_${targetId}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {
      return [];
    }
    return [];
  }

  public deleteSnapshot(snapshotId: string, learnerId?: string): void {
    const targetId = learnerId || this.activeLearnerId;
    const key = `plia_snapshots_${targetId}`;
    try {
      const existing = this.getSnapshots(targetId);
      const updated = existing.filter(s => s.id !== snapshotId);
      localStorage.setItem(key, JSON.stringify(updated));
      localBackendService.deleteSnapshot(snapshotId);
    } catch {
      // ignore
    }
  }

  // --- Scoped Spaced Review Items ---
  public getSpacedReviews(learnerId?: string): SpacedReviewItem[] {
    const targetId = learnerId || this.activeLearnerId;
    const key = `plia_reviews_${targetId}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {
      return [];
    }
    return [];
  }

  public saveSpacedReviews(reviews: SpacedReviewItem[], learnerId?: string): void {
    const targetId = learnerId || this.activeLearnerId;
    const key = `plia_reviews_${targetId}`;
    try {
      localStorage.setItem(key, JSON.stringify(reviews));
    } catch {
      // ignore
    }
  }

  // --- Scoped Chat History ---
  public getChatHistory(learnerId?: string): AIChatMessage[] {
    const targetId = learnerId || this.activeLearnerId;
    const key = `plia_chat_${targetId}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {
      return [];
    }
    return [];
  }

  public saveChatHistory(messages: AIChatMessage[], learnerId?: string): void {
    const targetId = learnerId || this.activeLearnerId;
    const key = `plia_chat_${targetId}`;
    try {
      // Keep last 100 messages max
      const trimmed = messages.slice(-100);
      localStorage.setItem(key, JSON.stringify(trimmed));
    } catch {
      // ignore
    }
  }

  // --- Full Export / Import Utility ---
  public exportData(): string {
    const data: Record<string, unknown> = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      activeLearnerId: this.activeLearnerId,
      learners: this.getLearners(),
      profiles: {} as Record<string, unknown>,
      pathways: {} as Record<string, unknown>,
      snapshots: {} as Record<string, unknown>,
      diagnosticStates: {} as Record<string, unknown>,
    };

    const learners = this.getLearners();
    for (const l of learners) {
      const p = this.getLearnerProfile(l.learnerId);
      if (p) (data.profiles as Record<string, unknown>)[l.learnerId] = p;

      const pw = this.getLearningPathway(l.learnerId);
      if (pw) (data.pathways as Record<string, unknown>)[l.learnerId] = pw;

      const sn = this.getSnapshots(l.learnerId);
      if (sn.length > 0) (data.snapshots as Record<string, unknown>)[l.learnerId] = sn;

      const ds = this.getDiagnosticState(l.learnerId);
      if (ds) (data.diagnosticStates as Record<string, unknown>)[l.learnerId] = ds;
    }

    return JSON.stringify(data, null, 2);
  }

  public importData(jsonString: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'Invalid JSON structure' };
      }

      if (Array.isArray(parsed.learners)) {
        localStorage.setItem(LEARNERS_REGISTRY_KEY, JSON.stringify(parsed.learners));
      }

      if (parsed.profiles) {
        for (const [id, prof] of Object.entries(parsed.profiles)) {
          localStorage.setItem(`plia_profile_${id}`, JSON.stringify(prof));
        }
      }

      if (parsed.pathways) {
        for (const [id, pw] of Object.entries(parsed.pathways)) {
          localStorage.setItem(`plia_pathway_${id}`, JSON.stringify(pw));
        }
      }

      if (parsed.snapshots) {
        for (const [id, sn] of Object.entries(parsed.snapshots)) {
          localStorage.setItem(`plia_snapshots_${id}`, JSON.stringify(sn));
        }
      }

      if (parsed.activeLearnerId) {
        this.setActiveLearnerId(parsed.activeLearnerId);
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  // --- Static Convenience Delegates ---
  public static getCurrentLearnerId(): string {
    return storageManager.getActiveLearnerId();
  }

  public static setCurrentLearnerId(id: string): void {
    storageManager.setActiveLearnerId(id);
  }

  public static getCurrentLearner(): LearnerProfile | null {
    return storageManager.getLearnerProfile();
  }

  public static getAllLearners(): LearnerProfile[] {
    const list = storageManager.getLearners();
    return list.map(l => storageManager.getLearnerProfile(l.learnerId)).filter((p): p is LearnerProfile => p !== null);
  }

  public static saveLearner(profile: LearnerProfile): void {
    storageManager.saveLearnerProfile(profile);
  }

  public static deleteLearner(id: string): void {
    storageManager.deleteLearner(id);
  }

  public static getPathwayForLearner(learnerId: string): LearningPathway | null {
    return storageManager.getLearningPathway(learnerId);
  }

  public static savePathway(pathway: LearningPathway): void {
    storageManager.saveLearningPathway(pathway);
  }

  public static getActiveDiagnostic(): DiagnosticState | null {
    return storageManager.getDiagnosticState();
  }

  public static saveActiveDiagnostic(state: DiagnosticState): void {
    storageManager.saveDiagnosticState(state);
  }

  public static clearActiveDiagnostic(): void {
    storageManager.clearDiagnosticState();
  }

  public static getAllSnapshots(learnerId?: string): PathwaySnapshot[] {
    return storageManager.getSnapshots(learnerId);
  }

  public static saveSnapshot(snapshot: PathwaySnapshot): void {
    storageManager.saveSnapshot(snapshot);
  }

  public static deleteSnapshot(id: string, learnerId?: string): void {
    storageManager.deleteSnapshot(id, learnerId);
  }

  public static getSpacedReviews(learnerId?: string): SpacedReviewItem[] {
    return storageManager.getSpacedReviews(learnerId);
  }

  public static saveSpacedReviews(reviews: SpacedReviewItem[], learnerId?: string): void {
    storageManager.saveSpacedReviews(reviews, learnerId);
  }

  public static scheduleSpacedReview(
    itemOrLearnerId: SpacedReviewItem | string,
    conceptOrLearnerId?: string,
    domain?: string
  ): void {
    if (typeof itemOrLearnerId === 'string' && conceptOrLearnerId && domain) {
      const learnerId = itemOrLearnerId;
      const concept = conceptOrLearnerId;
      const reviews = storageManager.getSpacedReviews(learnerId);
      const existingIdx = reviews.findIndex(r => r.concept === concept && r.domain === domain);
      const now = new Date();
      const nextReview = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      const newItem: SpacedReviewItem = {
        id: `sr-${Date.now()}`,
        concept,
        domain,
        lastMasteredDate: now.toISOString(),
        intervalDays: 1,
        nextReviewDate: nextReview,
        repetitionCount: 1,
        status: 'upcoming',
      };
      if (existingIdx >= 0) {
        reviews[existingIdx] = {
          ...reviews[existingIdx],
          lastMasteredDate: now.toISOString(),
          intervalDays: Math.min(30, (reviews[existingIdx].intervalDays || 1) * 2),
          repetitionCount: (reviews[existingIdx].repetitionCount || 1) + 1,
        };
      } else {
        reviews.push(newItem);
      }
      storageManager.saveSpacedReviews(reviews, learnerId);
    } else if (typeof itemOrLearnerId === 'object') {
      const item = itemOrLearnerId;
      const learnerId = conceptOrLearnerId;
      const reviews = storageManager.getSpacedReviews(learnerId);
      const existingIdx = reviews.findIndex(r => r.id === item.id || (r.concept === item.concept && r.domain === item.domain));
      if (existingIdx >= 0) {
        reviews[existingIdx] = item;
      } else {
        reviews.push(item);
      }
      storageManager.saveSpacedReviews(reviews, learnerId);
    }
  }

  public static clearAllData(): void {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
  }

  public static exportData(): string {
    return storageManager.exportData();
  }

  public static importData(jsonString: string): { success: boolean; error?: string } {
    return storageManager.importData(jsonString);
  }
}

export const storageManager = new LocalStorageManager();
