/**
 * Local Persistence Layer for PLIA
 * Saves all learner records, diagnostic sessions, pathways, and spaced reviews locally in localStorage/IndexedDB.
 * Provides export/import functions for JSON profiles and local database backups.
 */

import { DiagnosticState, LearnerProfile, LearningPathway, PathwaySnapshot, SpacedReviewItem } from '../types';

const LEARNERS_KEY = 'plia_learners_v1';
const CURRENT_LEARNER_KEY = 'plia_current_learner_id_v1';
const ACTIVE_DIAGNOSTIC_KEY = 'plia_active_diagnostic_v1';
const PATHWAYS_KEY = 'plia_pathways_v1';
const SPACED_REVIEWS_KEY = 'plia_spaced_reviews_v1';
const SNAPSHOTS_KEY = 'plia_snapshots_v1';

export class LocalStorageManager {
  // --- Learners ---
  public static getAllLearners(): LearnerProfile[] {
    try {
      const data = localStorage.getItem(LEARNERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static getLearnerById(id: string): LearnerProfile | undefined {
    const learners = this.getAllLearners();
    return learners.find(l => l.learnerId === id);
  }

  public static saveLearner(profile: LearnerProfile): void {
    const learners = this.getAllLearners();
    const index = learners.findIndex(l => l.learnerId === profile.learnerId);
    if (index >= 0) {
      learners[index] = { ...profile, updatedAt: new Date().toISOString() };
    } else {
      learners.push(profile);
    }
    localStorage.setItem(LEARNERS_KEY, JSON.stringify(learners));
    this.setCurrentLearnerId(profile.learnerId);
  }

  public static getCurrentLearnerId(): string | null {
    return localStorage.getItem(CURRENT_LEARNER_KEY);
  }

  public static setCurrentLearnerId(id: string): void {
    localStorage.setItem(CURRENT_LEARNER_KEY, id);
  }

  public static getCurrentLearner(): LearnerProfile | null {
    const id = this.getCurrentLearnerId();
    if (!id) return null;
    return this.getLearnerById(id) || null;
  }

  public static deleteLearner(id: string): void {
    const learners = this.getAllLearners().filter(l => l.learnerId !== id);
    localStorage.setItem(LEARNERS_KEY, JSON.stringify(learners));
    if (this.getCurrentLearnerId() === id) {
      localStorage.removeItem(CURRENT_LEARNER_KEY);
    }
  }

  // --- Active Diagnostic State ---
  public static getActiveDiagnostic(): DiagnosticState | null {
    try {
      const data = localStorage.getItem(ACTIVE_DIAGNOSTIC_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public static saveActiveDiagnostic(state: DiagnosticState): void {
    localStorage.setItem(ACTIVE_DIAGNOSTIC_KEY, JSON.stringify(state));
  }

  public static clearActiveDiagnostic(): void {
    localStorage.removeItem(ACTIVE_DIAGNOSTIC_KEY);
  }

  // --- Learning Pathways ---
  public static getAllPathways(): Record<string, LearningPathway> {
    try {
      const data = localStorage.getItem(PATHWAYS_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  public static getPathwayForLearner(learnerId: string): LearningPathway | null {
    const pathways = this.getAllPathways();
    return pathways[learnerId] || null;
  }

  public static savePathway(pathway: LearningPathway): void {
    const pathways = this.getAllPathways();
    pathways[pathway.learnerId] = { ...pathway, updatedAt: new Date().toISOString() };
    localStorage.setItem(PATHWAYS_KEY, JSON.stringify(pathways));
  }

  // --- Spaced Reviews ---
  public static getSpacedReviews(learnerId: string): SpacedReviewItem[] {
    try {
      const data = localStorage.getItem(`${SPACED_REVIEWS_KEY}_${learnerId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveSpacedReviews(learnerId: string, items: SpacedReviewItem[]): void {
    localStorage.setItem(`${SPACED_REVIEWS_KEY}_${learnerId}`, JSON.stringify(items));
  }

  public static scheduleSpacedReview(learnerId: string, concept: string, domain: string): void {
    const reviews = this.getSpacedReviews(learnerId);
    const now = new Date();
    const nextDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); // 1 day interval

    const existingIdx = reviews.findIndex(r => r.concept === concept);
    if (existingIdx >= 0) {
      const current = reviews[existingIdx];
      const intervals = [1, 3, 7, 14, 30];
      const nextInterval = intervals[Math.min(intervals.length - 1, current.repetitionCount + 1)] || 30;
      reviews[existingIdx] = {
        ...current,
        repetitionCount: current.repetitionCount + 1,
        intervalDays: nextInterval,
        lastMasteredDate: now.toISOString(),
        nextReviewDate: new Date(now.getTime() + nextInterval * 24 * 60 * 60 * 1000).toISOString(),
        status: 'upcoming',
      };
    } else {
      reviews.push({
        id: `review-${Date.now()}`,
        concept,
        domain,
        lastMasteredDate: now.toISOString(),
        intervalDays: 1,
        nextReviewDate: nextDate.toISOString(),
        repetitionCount: 0,
        status: 'upcoming',
      });
    }

    this.saveSpacedReviews(learnerId, reviews);
  }

  // --- Pathway & Mastery Snapshots ---
  public static getAllSnapshots(learnerId?: string): PathwaySnapshot[] {
    try {
      const data = localStorage.getItem(SNAPSHOTS_KEY);
      const list: PathwaySnapshot[] = data ? JSON.parse(data) : [];
      if (learnerId) {
        return list.filter(s => s.learnerId === learnerId);
      }
      return list;
    } catch {
      return [];
    }
  }

  public static saveSnapshot(snapshot: PathwaySnapshot): void {
    const list = this.getAllSnapshots();
    const existingIdx = list.findIndex(s => s.id === snapshot.id);
    if (existingIdx >= 0) {
      list[existingIdx] = snapshot;
    } else {
      list.unshift(snapshot); // most recent first
    }
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(list));
  }

  public static deleteSnapshot(snapshotId: string): void {
    const list = this.getAllSnapshots().filter(s => s.id !== snapshotId);
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(list));
  }

  public static getSnapshotById(snapshotId: string): PathwaySnapshot | undefined {
    return this.getAllSnapshots().find(s => s.id === snapshotId);
  }

  // --- Export & Import ---
  public static exportFullData(): string {
    const exportObject = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      learners: this.getAllLearners(),
      pathways: this.getAllPathways(),
      snapshots: this.getAllSnapshots(),
      currentLearnerId: this.getCurrentLearnerId(),
    };
    return JSON.stringify(exportObject, null, 2);
  }

  public static importData(jsonString: string): { success: boolean; message: string; importedCount?: number } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.learners || !Array.isArray(parsed.learners)) {
        return { success: false, message: 'Invalid profile format: Missing learners array.' };
      }

      const existingLearners = this.getAllLearners();
      for (const learner of parsed.learners) {
        if (!learner.learnerId || !learner.subject) {
          continue;
        }
        const existingIdx = existingLearners.findIndex(l => l.learnerId === learner.learnerId);
        if (existingIdx >= 0) {
          existingLearners[existingIdx] = learner;
        } else {
          existingLearners.push(learner);
        }
      }

      localStorage.setItem(LEARNERS_KEY, JSON.stringify(existingLearners));

      if (parsed.pathways && typeof parsed.pathways === 'object') {
        const existingPathways = this.getAllPathways();
        const merged = { ...existingPathways, ...parsed.pathways };
        localStorage.setItem(PATHWAYS_KEY, JSON.stringify(merged));
      }

      if (parsed.snapshots && Array.isArray(parsed.snapshots)) {
        const existingSnapshots = this.getAllSnapshots();
        for (const snap of parsed.snapshots) {
          if (!existingSnapshots.some(s => s.id === snap.id)) {
            existingSnapshots.push(snap);
          }
        }
        localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(existingSnapshots));
      }

      return {
        success: true,
        message: `Successfully imported ${parsed.learners.length} learner profile(s).`,
        importedCount: parsed.learners.length,
      };
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : String(e);
      return { success: false, message: `JSON parsing error: ${err}` };
    }
  }

  public static clearAllData(): void {
    localStorage.removeItem(LEARNERS_KEY);
    localStorage.removeItem(CURRENT_LEARNER_KEY);
    localStorage.removeItem(ACTIVE_DIAGNOSTIC_KEY);
    localStorage.removeItem(PATHWAYS_KEY);
    localStorage.removeItem(SNAPSHOTS_KEY);
  }
}
