import React, { useState } from 'react';
import {
  Database,
  Search,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Zap,
  BookOpen,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { VectorDocument, VectorSearchResult } from '../types';
import { vectorDb } from '../lib/vectorDb';

interface VectorDbExplorerProps {
  onVectorCountChange: (count: number) => void;
}

export const VectorDbExplorer: React.FC<VectorDbExplorerProps> = ({ onVectorCountChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [searchResults, setSearchResults] = useState<VectorSearchResult[]>([]);
  const [searchLatency, setSearchLatency] = useState<number | null>(null);
  const [allDocs, setAllDocs] = useState<VectorDocument[]>(() => vectorDb.getAll());

  // Ingestion form state
  const [ingestSubject, setIngestSubject] = useState('Biology');
  const [ingestTitle, setIngestTitle] = useState('');
  const [ingestText, setIngestText] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestSuccessMessage, setIngestSuccessMessage] = useState('');

  const refreshDocs = () => {
    const docs = vectorDb.getAll();
    setAllDocs(docs);
    onVectorCountChange(docs.length);
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchLatency(null);
      return;
    }

    const start = performance.now();
    const results = vectorDb.search(searchQuery, {
      subject: selectedSubjectFilter === 'all' ? undefined : selectedSubjectFilter,
      topK: 8,
      minScore: 0.05,
    });
    const latency = Math.round((performance.now() - start) * 100) / 100;

    setSearchResults(results);
    setSearchLatency(latency);
  };

  const handleIngest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestText.trim() || !ingestTitle.trim()) return;

    setIsIngesting(true);
    const count = vectorDb.ingestCustomText(
      ingestSubject,
      ingestTitle,
      ingestText,
      'Learner Syllabus / Textbook Notes'
    );
    setIsIngesting(false);

    setIngestSuccessMessage(`Successfully chunked and vector-indexed ${count} section(s) into local vector database!`);
    setIngestTitle('');
    setIngestText('');
    refreshDocs();
    setTimeout(() => setIngestSuccessMessage(''), 4000);
  };

  const handleDelete = (id: string) => {
    vectorDb.delete(id);
    refreshDocs();
    if (searchResults.length > 0) {
      handleSearch();
    }
  };

  const handleResetToSeeds = () => {
    if (window.confirm('Reset local vector database to default curriculum seeds?')) {
      vectorDb.resetToSeeds();
      refreshDocs();
      setSearchResults([]);
    }
  };

  const uniqueSubjects = Array.from(new Set(allDocs.map(d => d.subject)));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header & Metrics */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                100% Offline Embedded RAG Engine
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-emerald-400 font-medium">Sub-Millisecond Retrieval</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Local Vector Database Explorer
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Deterministic 128-dimensional dense vector embeddings + BM25 cosine scoring for instant curriculum retrieval, misconception checks, and custom notes ingestion.
            </p>
          </div>

          <button
            onClick={handleResetToSeeds}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center space-x-1.5 transition-all self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Seeds</span>
          </button>
        </div>

        {/* Real-time DB Telemetry Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Indexed Vectors</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-white font-mono">{allDocs.length}</span>
              <span className="text-xs text-indigo-400">chunks</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Vector Dimension</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-emerald-400 font-mono">128</span>
              <span className="text-xs text-slate-400">D Dense</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Search Metric</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-bold text-indigo-300">Cosine + BM25</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Retrieval Latency</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-amber-400 font-mono">
                {searchLatency !== null ? `${searchLatency} ms` : '< 1.5 ms'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Semantic Search vs Ingestion Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Cols: Live Semantic Vector Search Workbench */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Search className="w-5 h-5 text-indigo-400" />
              <span>Semantic Similarity Query</span>
            </h2>
            {searchLatency !== null && (
              <span className="text-xs font-mono text-emerald-400">
                Found {searchResults.length} matches in {searchLatency}ms
              </span>
            )}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                  }}
                  placeholder="e.g. 'anaerobic respiration ATP yield' or 'Big O binary tree search'"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>

              <select
                value={selectedSubjectFilter}
                onChange={e => setSelectedSubjectFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="all">All Subjects</option>
                {uniqueSubjects.map(subj => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center space-x-1"
              >
                <span>Search</span>
              </button>
            </div>
          </form>

          {/* Search Results Display */}
          <div className="space-y-3 pt-2">
            {searchResults.length > 0 ? (
              searchResults.map((res, idx) => (
                <div
                  key={res.document.id || idx}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 hover:border-indigo-800/80 transition-all text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 font-semibold text-[10px] uppercase">
                        {res.document.subject}
                      </span>
                      <span className="font-bold text-slate-200">
                        {res.document.domain} — {res.document.topic}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-emerald-400 font-bold text-xs">
                        {(res.similarityScore * 100).toFixed(1)}% match
                      </span>
                      {res.document.category === 'user_note' && (
                        <button
                          onClick={() => handleDelete(res.document.id)}
                          className="text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete custom note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed">{res.document.content}</p>

                  {res.matchedTokens.length > 0 && (
                    <div className="flex items-center space-x-1 text-[10px] text-slate-500">
                      <span>Matched tokens:</span>
                      <span className="text-indigo-400 font-mono">{res.matchedTokens.join(', ')}</span>
                    </div>
                  )}
                </div>
              ))
            ) : searchQuery.trim() ? (
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                No vectors matched above the similarity threshold.
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-2 text-xs text-slate-400">
                <Database className="w-8 h-8 text-slate-600 mx-auto" />
                <p>Type any keyword or concept query to test real-time vector search across pre-loaded curricula and ingested notes.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Ingest Custom Notes Studio */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>Ingest Custom Notes / Syllabus</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Add your course syllabus, lecture notes, or textbooks to ground PLIA with your specific materials.
            </p>
          </div>

          {ingestSuccessMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{ingestSuccessMessage}</span>
            </div>
          )}

          <form onSubmit={handleIngest} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="ingest-subject-input" className="block text-xs font-medium text-slate-300">Subject</label>
              <input
                id="ingest-subject-input"
                type="text"
                value={ingestSubject}
                onChange={e => setIngestSubject(e.target.value)}
                placeholder="e.g. Biology, Macroeconomics, Quantum Physics"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ingest-title-input" className="block text-xs font-medium text-slate-300">Document / Topic Title</label>
              <input
                id="ingest-title-input"
                type="text"
                value={ingestTitle}
                onChange={e => setIngestTitle(e.target.value)}
                placeholder="e.g. Chapter 4: Photosynthesis & Light Reactions"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ingest-content-textarea" className="block text-xs font-medium text-slate-300">Document Content (Paste Text)</label>
              <textarea
                id="ingest-content-textarea"
                rows={6}
                value={ingestText}
                onChange={e => setIngestText(e.target.value)}
                placeholder="Paste paragraph notes, textbook excerpts, or syllabus descriptions here. PLIA will automatically chunk and vectorize the text locally..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed"
                required
              />
            </div>

            <button
              id="chunk-and-vectorize-btn"
              type="submit"
              disabled={isIngesting || !ingestText.trim() || !ingestTitle.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Chunk & Vectorize Document</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
