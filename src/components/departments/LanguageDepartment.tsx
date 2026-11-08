import React, { useState } from 'react';
import {
  BookOpen,
  Bot,
  Send,
  Sparkles,
  Zap,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { LanguageAcademy3D } from '../3d/LanguageAcademy3D';
import { UserProfile } from '../../types';
import { sound } from '../../utils/audio';

interface LanguageDepartmentProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onOpenLinkModal?: (url: string) => void;
  onOpenExam?: () => void;
}

export const LanguageDepartment: React.FC<LanguageDepartmentProps> = ({
  user,
  onUpdateUser,
  onOpenLinkModal,
  onOpenExam,
}) => {
  const [activeTab, setActiveTab] = useState<'lexicon_3d' | 'rhetoric_duel' | 'master_roland'>('lexicon_3d');

  // Rhetorical Duel Challenge
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<string | null>(null);

  // AI Master Roland chat
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; role: 'student' | 'professor' }>>([
    {
      sender: 'Master Roland Vance',
      role: 'professor',
      text: 'Welcome, Scholar, to the Nexus Linguistic Academy. Language is the ultimate architecture of cognition and rhetoric. How may I assist your inquiries into syntax trees, etymological roots, or classical prose?',
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const checkRhetoricAnswer = (answer: string) => {
    setSelectedMatch(answer);
    if (answer === 'Chiasmus') {
      sound.playSuccess();
      setMatchResult('Splendidly discerned! "Ask not what your country can do for you — ask what you can do for your country" is a textbook Chiasmus (ABBA syntactic reversal). +150 XP!');
      onUpdateUser({
        xp: user.xp + 150,
        mastery: { ...user.mastery, literature: Math.min(100, user.mastery.literature + 3) },
      });
    } else {
      sound.playError();
      setMatchResult('Incorrect trope. Notice the mirrored inverted grammatical structure.');
    }
  };

  const handleAskRoland = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isAiLoading) return;

    const q = inputQuestion.trim();
    setInputQuestion('');
    sound.playTerminalBeep();

    setChatMessages((prev) => [...prev, { sender: user.callsign, role: 'student', text: q }]);
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/gemini/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professor: 'Master Roland Vance',
          subject: 'literature',
          studentQuestion: q,
          context: `Linguistic Academy Semantic Graph Active.`,
        }),
      });
      const data = await res.json();
      sound.playSuccess();
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'Master Roland Vance',
          role: 'professor',
          text: data.answer || 'Lexical archives are parsing.',
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'Master Roland Vance',
          role: 'professor',
          text: 'Etymology uncovers the archaeological strata buried within our vocabulary. For instance, "calculate" derives from the Latin calculus (pebble), referencing ancient counting boards.',
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/30 p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
                  Sector 04 • Rhetoric, Semantics & Prose
                </span>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 rounded-full font-mono">
                  Master Roland Lead Faculty
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">
                NEXUS LINGUISTIC ACADEMY
              </h1>
              <p className="text-sm text-slate-300 max-w-xl">
                Deconstruct syntax trees, master classical rhetorical stratagems, and engage in high-speed vocabulary cipher decryptions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenExam}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              Take Board Exam
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 mt-6 border-t border-slate-800/80 pt-4">
          {[
            { id: 'lexicon_3d', label: '3D Neural Lexicon Graph', icon: BookOpen },
            { id: 'rhetoric_duel', label: 'Rhetoric Decipher Challenge', icon: Zap },
            { id: 'master_roland', label: 'Consult Master Roland (AI)', icon: Bot },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'lexicon_3d' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <LanguageAcademy3D />
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase">Syntactic Topology</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                The 3D neural graph models lexical nodes in semantic vector space. Click nodes inside the 3D chamber to examine etymological lineage.
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-emerald-300">
                Cognitive Parse Status:
                <div className="text-white font-bold mt-1">Chomsky X-bar Theory Constituents Mapped</div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-emerald-400 font-bold uppercase">Associated Resource</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-300">
                Stanford Encyclopedia of Philosophy: "Semantics & Formal Pragmatics"
              </p>
              {onOpenLinkModal && (
                <button
                  onClick={() => onOpenLinkModal('https://wikipedia.org')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-mono text-left underline cursor-pointer"
                >
                  Inspect in Link Preview System →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rhetoric_duel' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 max-w-2xl mx-auto shadow-2xl flex flex-col gap-6 items-center text-center">
          <div>
            <h2 className="text-xl font-bold text-white font-display">Classical Rhetorical Cipher Match</h2>
            <p className="text-xs text-slate-400 mt-1">Identify the rhetorical device utilized in the following famous passage:</p>
          </div>

          <blockquote className="p-6 bg-slate-950 border border-emerald-500/30 rounded-2xl text-base text-emerald-200 italic font-serif leading-relaxed max-w-xl">
            "Ask not what your country can do for you — ask what you can do for your country."
          </blockquote>

          <div className="grid grid-cols-2 gap-3 w-full max-w-md">
            {['Chiasmus', 'Synecdoche', 'Anaphora', 'Litotes'].map((opt) => (
              <button
                key={opt}
                onClick={() => checkRhetoricAnswer(opt)}
                className={`py-3 px-4 rounded-xl text-xs font-bold font-mono transition-all border cursor-pointer ${
                  selectedMatch === opt
                    ? 'border-emerald-400 bg-emerald-500/20 text-white'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-300'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {matchResult && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300">
              {matchResult}
            </div>
          )}
        </div>
      )}

      {activeTab === 'master_roland' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <img
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80"
              alt="Master Roland"
              className="w-12 h-12 rounded-xl object-cover border border-emerald-500/50"
            />
            <div>
              <h2 className="text-base font-bold text-white">Master Roland Vance</h2>
              <p className="text-xs text-emerald-400 font-mono">Grand Rhetorician • Gemini 3.8 Intelligence</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-h-[300px] max-h-[460px] overflow-y-auto pr-2">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl text-xs md:text-sm leading-relaxed max-w-2xl ${
                  msg.role === 'professor'
                    ? 'bg-slate-950 border border-emerald-500/30 text-slate-200 self-start'
                    : 'bg-emerald-950/40 border border-emerald-500/50 text-emerald-100 self-end'
                }`}
              >
                <span className="text-[10px] font-mono block text-slate-400 mb-1">{msg.sender}</span>
                <div className="whitespace-pre-line">{msg.text}</div>
              </div>
            ))}
            {isAiLoading && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 self-start flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Master Roland is parsing the rhetoric...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleAskRoland} className="flex gap-2 border-t border-slate-800 pt-3">
            <input
              type="text"
              placeholder="Ask Master Roland about poetic meters, rhetorical figures, or grammar structures..."
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={isAiLoading || !inputQuestion.trim()}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
