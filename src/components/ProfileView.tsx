import React, { useState } from 'react';
import {
  User,
  Brain,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  RotateCcw,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { LearnerProfile } from '../types';
import { LocalStorageManager } from '../lib/storage';

interface ProfileViewProps {
  currentProfile: LearnerProfile | null;
  onSelectProfile: (profile: LearnerProfile) => void;
  onRetakeDiagnostic: () => void;
  onExportJson: () => void;
  onViewReport: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentProfile,
  onSelectProfile,
  onRetakeDiagnostic,
  onExportJson,
  onViewReport,
}) => {
  const [allLearners, setAllLearners] = useState<LearnerProfile[]>(() => LocalStorageManager.getAllLearners());
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [showImportBox, setShowImportBox] = useState(false);

  const refreshList = () => {
    setAllLearners(LocalStorageManager.getAllLearners());
  };

  const handleDeleteProfile = (id: string) => {
    if (window.confirm('Are you sure you want to delete this learner profile?')) {
      LocalStorageManager.deleteLearner(id);
      refreshList();
    }
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) return;

    const result = LocalStorageManager.importData(importJsonText);
    setImportStatus(result);
    if (result.success) {
      refreshList();
      setImportJsonText('');
      setTimeout(() => setImportStatus(null), 4000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Local Learner Management
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-emerald-400 font-medium">100% On-Device Persistence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Learner Profiles & Diagnostic History
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              All cognitive evaluations, Bloom taxonomy records, and personalized pathways are persisted locally in your browser and SQLite database.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onExportJson}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center space-x-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full JSON</span>
            </button>

            <button
              onClick={() => setShowImportBox(!showImportBox)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center space-x-1.5 transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
            </button>
          </div>
        </div>

        {/* Import Box if Toggled */}
        {showImportBox && (
          <form onSubmit={handleImport} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <label htmlFor="import-json-textarea" className="block text-xs font-bold uppercase text-slate-300">Paste Learner Profile JSON</label>
            <textarea
              id="import-json-textarea"
              rows={4}
              value={importJsonText}
              onChange={e => setImportJsonText(e.target.value)}
              placeholder="Paste exported PLIA JSON string here to restore profile..."
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500"
              required
            />
            <div className="flex justify-between items-center">
              {importStatus && (
                <span
                  className={`text-xs ${
                    importStatus.success ? 'text-emerald-400 font-semibold' : 'text-rose-400'
                  }`}
                >
                  {importStatus.message}
                </span>
              )}
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Validate & Import
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Profiles Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <span>Active & Saved Subject Profiles ({allLearners.length})</span>
        </h2>

        {allLearners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allLearners.map(learner => {
              const isCurrent = currentProfile?.learnerId === learner.learnerId;

              return (
                <div
                  key={learner.learnerId}
                  className={`p-6 rounded-3xl border transition-all text-left space-y-4 ${
                    isCurrent
                      ? 'bg-slate-900 border-indigo-500/80 shadow-xl shadow-indigo-950/40'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-lg text-white">{learner.subject}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 text-[10px] font-bold uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Learner: <strong className="text-slate-300">{learner.name || 'Anonymous'}</strong> • Version {learner.profileVersion}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteProfile(learner.learnerId)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      title="Delete profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stage & Mastery stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">Cognitive Stage:</span>
                      <strong className="text-emerald-400 font-semibold">{learner.stageName}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">Subject Mastery:</span>
                      <strong className="text-indigo-300 font-mono font-bold">
                        {learner.subjectMastery.overallMastery}%
                      </strong>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2">
                    <strong>Goal:</strong> {learner.goal}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-[10px] text-slate-500">
                      Updated {new Date(learner.updatedAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          onSelectProfile(learner);
                          onViewReport();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                      >
                        View Report
                      </button>

                      {!isCurrent ? (
                        <button
                          onClick={() => onSelectProfile(learner)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                        >
                          Select
                        </button>
                      ) : (
                        <button
                          onClick={onRetakeDiagnostic}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                        >
                          Re-diagnose
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <User className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Profiles Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Start an adaptive diagnostic from the Intake tab to generate and persist your personalized learning profile.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
