import React, { useState } from 'react';
import {
  Link2,
  ExternalLink,
  ThumbsUp,
  Bookmark,
  Share2,
  Search,
  Plus,
  Globe,
  Sparkles,
  Check,
  AlertCircle,
  Clock,
  Tag,
} from 'lucide-react';
import { DepartmentId, LinkPreviewData, UserProfile } from '../../types';
import { sound } from '../../utils/audio';
import { INITIAL_LINK_PREVIEWS } from '../../utils/mockData';

interface LinkPreviewSystemProps {
  user: UserProfile;
  initialFilterDept?: DepartmentId | 'all';
  onAddResourcePoints?: (xp: number) => void;
}

export const LinkPreviewSystem: React.FC<LinkPreviewSystemProps> = ({
  user,
  initialFilterDept = 'all',
  onAddResourcePoints,
}) => {
  const [resources, setResources] = useState<LinkPreviewData[]>(INITIAL_LINK_PREVIEWS);
  const [filterDept, setFilterDept] = useState<DepartmentId | 'all'>(initialFilterDept);
  const [searchQuery, setSearchQuery] = useState('');
  const [upvotedUrls, setUpvotedUrls] = useState<Set<string>>(new Set());
  const [bookmarkedUrls, setBookmarkedUrls] = useState<Set<string>>(new Set());

  // Add Link Modal / Form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [selectedDept, setSelectedDept] = useState<DepartmentId>('science');
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [livePreviewData, setLivePreviewData] = useState<LinkPreviewData | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Automatically fetch preview when typing/pasting URL
  const handleUrlChange = async (url: string) => {
    setInputUrl(url);
    setPreviewError(null);

    // Basic URL format detection
    const trimmed = url.trim();
    if (!trimmed.includes('.') || trimmed.length < 5) {
      setLivePreviewData(null);
      return;
    }

    setIsFetchingPreview(true);
    try {
      const response = await fetch(`/api/link-preview?url=${encodeURIComponent(trimmed)}`);
      const data = await response.json();
      if (response.ok && data.title) {
        setLivePreviewData({
          ...data,
          sharedBy: user.callsign,
          department: selectedDept,
          votes: 1,
          tags: ['Community Verified', selectedDept.toUpperCase()],
        });
        sound.playTerminalBeep();
      } else {
        setPreviewError(data.error || 'Unable to extract metadata from this URL.');
      }
    } catch (err: any) {
      setPreviewError('Network timeout while parsing link metadata.');
    } finally {
      setIsFetchingPreview(false);
    }
  };

  const handlePublishResource = () => {
    if (!livePreviewData) return;
    sound.playSuccess();
    setResources((prev) => [livePreviewData, ...prev]);
    if (onAddResourcePoints) onAddResourcePoints(150);
    setIsAddModalOpen(false);
    setInputUrl('');
    setLivePreviewData(null);
  };

  const toggleUpvote = (url: string) => {
    sound.playClick();
    setUpvotedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
        setResources((rList) =>
          rList.map((r) => (r.url === url ? { ...r, votes: (r.votes || 0) - 1 } : r))
        );
      } else {
        next.add(url);
        setResources((rList) =>
          rList.map((r) => (r.url === url ? { ...r, votes: (r.votes || 0) + 1 } : r))
        );
      }
      return next;
    });
  };

  const toggleBookmark = (url: string) => {
    sound.playClick();
    setBookmarkedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const copyToClipboard = (url: string) => {
    sound.playTerminalBeep();
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Filter resources
  const filteredResources = resources.filter((res) => {
    const matchesDept = filterDept === 'all' || res.department === filterDept;
    const matchesSearch =
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (res.tags && res.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesDept && matchesSearch;
  });

  return (
    <div className="w-full flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-cyan-500/30 p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-cyan-400">
              <Link2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">
                  Automated OpenGraph Detection Engine
                </span>
                <span className="px-2 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-300 rounded-full font-mono">
                  Universal Previews Active
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">
                LINK PREVIEW SYSTEM & ACADEMIC VAULT
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl">
                Automatically detects, scrapes, and generates rich clickable previews for scientific journals, repositories, and academic papers shared across ACADEMIX.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              setIsAddModalOpen(true);
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>SHARE ACADEMIC LINK</span>
          </button>
        </div>

        {/* Search & Department Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 border-t border-slate-800/80 pt-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search resources, topics, domains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Sectors' },
              { id: 'science', label: 'Science' },
              { id: 'math', label: 'Math' },
              { id: 'history', label: 'History' },
              { id: 'literature', label: 'Linguistics' },
              { id: 'arena', label: 'Arena' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playClick();
                  setFilterDept(tab.id as any);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  filterDept === tab.id
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resource Grid with Rich Clickable Link Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((item, idx) => {
          const isUpvoted = upvotedUrls.has(item.url);
          const isBookmarked = bookmarkedUrls.has(item.url);
          const isCopied = copiedUrl === item.url;

          return (
            <div
              key={idx}
              className="group bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl overflow-hidden shadow-xl transition-all flex flex-col justify-between"
            >
              {/* Top Banner Image with Domain Favicon Badge */}
              <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                {/* Favicon & Domain Pill */}
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-950/90 border border-slate-700/80 px-2.5 py-1 rounded-lg">
                  {item.favicon ? (
                    <img src={item.favicon} alt="Favicon" className="w-3.5 h-3.5 rounded-sm" />
                  ) : (
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span className="text-[11px] font-mono text-cyan-300 font-bold">{item.domain}</span>
                </div>

                {/* Department Tag */}
                {item.department && (
                  <div className="absolute top-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/90 text-slate-300 border border-slate-700 uppercase">
                    {item.department}
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-3 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {item.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 text-[10px] font-mono bg-slate-950 text-slate-400 rounded border border-slate-800"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-2">
                  <div className="flex items-center gap-2">
                    {/* Upvote */}
                    <button
                      onClick={() => toggleUpvote(item.url)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                        isUpvoted
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{item.votes || 0}</span>
                    </button>

                    {/* Bookmark */}
                    <button
                      onClick={() => toggleBookmark(item.url)}
                      className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        isBookmarked
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                      }`}
                      title="Bookmark resource"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>

                    {/* Share / Copy link */}
                    <button
                      onClick={() => copyToClipboard(item.url)}
                      className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-lg text-xs transition-all cursor-pointer"
                      title="Copy URL"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Clickable External Link */}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold transition-colors cursor-pointer group-hover:underline"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Link Preview Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 max-w-xl w-full shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-white font-display">Share & Index Academic Resource</h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-mono text-slate-300">
                Paste Any Website / Journal / Repository URL:
              </label>
              <input
                type="url"
                placeholder="https://nature.com/... or https://arxiv.org/..."
                value={inputUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />

              <div className="flex items-center gap-3">
                <label className="text-xs font-mono text-slate-400">Department:</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value as DepartmentId)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                >
                  <option value="science">Quantum Science Lab</option>
                  <option value="math">Mathematics Matrix</option>
                  <option value="history">Chronos History</option>
                  <option value="literature">Linguistic Academy</option>
                  <option value="arena">Multiplayer Arena</option>
                </select>
              </div>
            </div>

            {/* Live Link Preview Render inside modal */}
            {isFetchingPreview && (
              <div className="flex items-center justify-center gap-2 p-6 bg-slate-950/60 rounded-xl border border-slate-800 text-xs font-mono text-cyan-400">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Extracting OpenGraph Title, Description, and Thumbnail...</span>
              </div>
            )}

            {previewError && (
              <div className="flex items-center gap-2 p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{previewError}</span>
              </div>
            )}

            {livePreviewData && (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-mono uppercase text-cyan-400 font-bold">
                  Generated Live Link Preview Card:
                </span>
                <div className="bg-slate-950 border border-cyan-500/40 rounded-xl overflow-hidden flex flex-col sm:flex-row">
                  <img
                    src={livePreviewData.image}
                    alt={livePreviewData.title}
                    className="w-full sm:w-40 h-32 object-cover shrink-0"
                  />
                  <div className="p-3 flex flex-col justify-between gap-1">
                    <div>
                      <div className="text-[10px] font-mono text-cyan-400">{livePreviewData.domain}</div>
                      <div className="text-xs font-bold text-white line-clamp-1">{livePreviewData.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-2 mt-1">{livePreviewData.description}</div>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">Shared by: {user.callsign} (+150 XP)</div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit / Cancel Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={!livePreviewData}
                onClick={handlePublishResource}
                className={`px-5 py-2 font-bold text-xs rounded-xl transition-all cursor-pointer ${
                  livePreviewData
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 shadow-lg shadow-cyan-500/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Publish Link Preview to Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
