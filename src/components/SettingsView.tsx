import React, { useState } from 'react';
import {
  Settings,
  Cpu,
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Zap,
  Terminal,
  Activity,
} from 'lucide-react';
import { OllamaConfig } from '../types';
import { ollamaService } from '../lib/ollamaClient';
import { LocalStorageManager } from '../lib/storage';
import { vectorDb } from '../lib/vectorDb';

interface SettingsViewProps {
  ollamaConfig: OllamaConfig;
  onUpdateConfig: (newConfig: Partial<OllamaConfig>) => void;
  onVectorCountChange: (count: number) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  ollamaConfig,
  onUpdateConfig,
  onVectorCountChange,
}) => {
  const [baseUrl, setBaseUrl] = useState(ollamaConfig.baseUrl);
  const [selectedModel, setSelectedModel] = useState(ollamaConfig.selectedModel);
  const [mockMode, setMockMode] = useState(ollamaConfig.mockMode);
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    reachable: boolean;
    models: string[];
    latencyMs: number;
    error?: string;
  } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = onUpdateConfig({
      baseUrl: baseUrl.trim(),
      selectedModel: selectedModel.trim(),
      mockMode,
    });
  };

  const handleTestConnection = async () => {
    setIsChecking(true);
    const res = await ollamaService.checkHealth();
    setCheckResult(res);
    if (res.reachable) {
      onUpdateConfig({
        isReachable: true,
        availableModels: res.models,
        latencyMs: res.latencyMs,
      });
    }
    setIsChecking(false);
  };

  const handleClearAllStorage = () => {
    if (window.confirm('WARNING: This will clear all local learner profiles and active diagnostics. Are you sure?')) {
      LocalStorageManager.clearAllData();
      vectorDb.resetToSeeds();
      onVectorCountChange(vectorDb.getAll().length);
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            System Diagnostics & Privacy
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Ollama LLM & Engine Settings
        </h1>
        <p className="text-xs text-slate-300">
          Configure your local Ollama instance, test model availability, and manage your embedded local vector database.
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <span>Local Ollama Integration</span>
        </h2>

        {/* Ollama Base URL */}
        <div className="space-y-2">
          <label htmlFor="settings-base-url-input" className="block text-xs font-medium text-slate-300">Ollama Base URL</label>
          <input
            id="settings-base-url-input"
            type="text"
            value={baseUrl}
            onChange={e => setBaseUrl(e.target.value)}
            placeholder="http://localhost:11434"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
            required
          />
          <p className="text-[11px] text-slate-500">
            Default local Ollama address is usually <code className="text-indigo-300 font-mono">http://localhost:11434</code>.
          </p>
        </div>

        {/* Selected Model */}
        <div className="space-y-2">
          <label htmlFor="settings-model-input" className="block text-xs font-medium text-slate-300">Selected Model</label>
          <input
            id="settings-model-input"
            type="text"
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            placeholder="e.g. qwen3:8b, llama3.1:8b, mistral, phi3, deepseek-r1:8b"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
            required
          />
          <p className="text-[11px] text-slate-500">
            Configurable model identifier (e.g. <code className="text-indigo-300">qwen3:8b</code>, <code className="text-indigo-300">llama3:8b</code>, <code className="text-indigo-300">mistral</code>).
          </p>
        </div>

        {/* Mock Mode Toggle */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-white block">Offline Deterministic Engine (Mock Mode)</span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Enables deterministic local pedagogical evaluation and question sequencing without requiring an active Ollama instance.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={mockMode}
              onChange={e => setMockMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
          </label>
        </div>

        {/* Buttons: Test & Save */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            id="test-ollama-connectivity-btn"
            type="button"
            onClick={handleTestConnection}
            disabled={isChecking}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
          >
            {isChecking ? (
              <>
                <Activity className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Pinging Ollama...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Test Ollama Connectivity</span>
              </>
            )}
          </button>

          <button
            id="save-ollama-settings-btn"
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            Save Configuration
          </button>
        </div>

        {/* Diagnostic Results Box */}
        {checkResult && (
          <div
            className={`p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in ${
              checkResult.reachable
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                : 'bg-amber-950/40 border-amber-800 text-amber-200'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center space-x-1.5">
                {checkResult.reachable ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
                <span>
                  {checkResult.reachable
                    ? `Ollama Reachable (${checkResult.latencyMs}ms Latency)`
                    : 'Ollama Connection Offline'}
                </span>
              </span>
            </div>

            {checkResult.reachable ? (
              <div className="space-y-1">
                <p>
                  <strong>Installed Models on Device ({checkResult.models.length}):</strong>{' '}
                  {checkResult.models.join(', ') || 'No models found in Ollama repository.'}
                </p>
                <p className="text-[11px] text-emerald-300/80">
                  Target model <code className="font-mono text-white">{selectedModel}</code> will be used for JSON structured diagnostic generations.
                </p>
              </div>
            ) : (
              <div className="space-y-1 text-slate-300 text-[11px]">
                <p className="text-amber-300 font-semibold">
                  PLIA cannot reach Ollama at {baseUrl}.
                </p>
                <p>
                  To start Ollama locally, open your terminal / PowerShell and run:
                </p>
                <code className="block p-2 rounded bg-slate-950 text-emerald-400 font-mono text-[11px]">
                  ollama run {selectedModel}
                </code>
                <p className="text-slate-400 mt-1">
                  <em>Note: PLIA will seamlessly use its built-in offline educational engine so you can continue learning without interruptions!</em>
                </p>
              </div>
            )}
          </div>
        )}
      </form>

      {/* Privacy Notice Card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Local Privacy Guarantee</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          PLIA operates 100% locally on this computer. No learner data, diagnostic questions, responses, or vectors are ever transmitted to external cloud APIs or remote tracking telemetry.
        </p>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleClearAllStorage}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
          >
            Clear All Local App Data
          </button>
        </div>
      </div>
    </div>
  );
};
