import React, { useState } from 'react';
import {
  Globe,
  Compass,
  MapPin,
  Bot,
  Send,
  Sparkles,
  ExternalLink,
  Search,
  BookOpen,
} from 'lucide-react';
import { HistoryGlobe3D } from '../3d/HistoryGlobe3D';
import { UserProfile } from '../../types';
import { sound } from '../../utils/audio';

interface HistoryDepartmentProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onOpenLinkModal?: (url: string) => void;
  onOpenExam?: () => void;
}

export const HistoryDepartment: React.FC<HistoryDepartmentProps> = ({
  user,
  onUpdateUser,
  onOpenLinkModal,
  onOpenExam,
}) => {
  const [activeTab, setActiveTab] = useState<'globe' | 'investigations' | 'dr_sophia'>('globe');
  const [selectedSiteName, setSelectedSiteName] = useState('Library of Alexandria');

  // AI Dr. Sophia Chronos chat
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; role: 'student' | 'professor' }>>([
    {
      sender: 'Dr. Sophia Chronos',
      role: 'professor',
      text: 'Greetings, Scholar. In the Chronos Observatory, we track the great geographical tides and archaeological turning points that shaped global civilizations. Which epoch or trade nexus shall we explore?',
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAskDrSophia = async (e: React.FormEvent) => {
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
          professor: 'Dr. Sophia Chronos',
          subject: 'history',
          studentQuestion: q,
          context: `Chronos Observatory planetary epoch scan active. Selected Site: ${selectedSiteName}`,
        }),
      });
      const data = await res.json();
      sound.playSuccess();
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'Dr. Sophia Chronos',
          role: 'professor',
          text: data.answer || 'Temporal archives are indexing.',
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'Dr. Sophia Chronos',
          role: 'professor',
          text: 'Geography is the physical stage upon which human history unfolds. The Nile, Tigris, Euphrates, and Indus rivers provided alluvial silt and annual inundation cycles that sustained early agrarian surpluses.',
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950 via-slate-900 to-orange-950 border border-amber-500/30 p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
              <Globe className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
                  Sector 03 • Temporal Archaeology & Cartography
                </span>
                <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 rounded-full font-mono">
                  Dr. Sophia Chronos Lead Faculty
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">
                CHRONOS OBSERVATORY & GEOSPHERE
              </h1>
              <p className="text-sm text-slate-300 max-w-xl">
                Scan global satellite coordinates, reconstruct ancient architectural marvels, and investigate pivotal historical inflection points.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenExam}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Take Board Exam
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 mt-6 border-t border-slate-800/80 pt-4">
          {[
            { id: 'globe', label: '3D Geosphere & Archaeological Scanner', icon: Globe },
            { id: 'investigations', label: 'Historical Investigations', icon: BookOpen },
            { id: 'dr_sophia', label: 'Consult Dr. Sophia (AI)', icon: Bot },
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
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
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

      {activeTab === 'globe' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <HistoryGlobe3D onSelectSite={(s) => setSelectedSiteName(s.name)} />
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <span className="text-xs font-mono text-amber-400 font-bold uppercase">Chronos Field Archive</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Click pins on the 3D planetary geosphere to activate satellite scans of ancient civilizational centers.
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-amber-300">
                Active Coordinate Focus:
                <div className="text-white font-bold mt-1">{selectedSiteName}</div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-amber-400 font-bold uppercase">Associated Resource</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-300">
                Wikipedia Archive: "The Great Library of Alexandria & Ancient Scholarship"
              </p>
              {onOpenLinkModal && (
                <button
                  onClick={() => onOpenLinkModal('https://wikipedia.org')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-mono text-left underline cursor-pointer"
                >
                  Inspect in Link Preview System →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'investigations' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'The Alexandria Papyrus Reconstruction',
              desc: 'Analyze Hellenistic astronomical fragments and determine Eratosthenes’ calculation of the Earth’s circumference.',
              reward: '+300 XP',
            },
            {
              title: 'Silk Road Caravan Economic Flow',
              desc: 'Trace the movement of raw silk, papermaking technologies, and Islamic algebra across Samarkand and Bukhara.',
              reward: '+350 XP',
            },
            {
              title: 'The Roman Aqueduct Hydraulic Engineering',
              desc: 'Calculate the hydraulic gradient and siphon dynamics of the Pont du Gard conduit.',
              reward: '+400 XP',
            },
          ].map((c, i) => (
            <div key={i} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-4 shadow-xl">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded">{c.reward}</span>
                <h3 className="font-bold text-white text-base mt-2 mb-1">{c.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{c.desc}</p>
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('globe');
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Inspect Coordinates on Globe
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'dr_sophia' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <img
              src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80"
              alt="Dr. Sophia"
              className="w-12 h-12 rounded-xl object-cover border border-amber-500/50"
            />
            <div>
              <h2 className="text-base font-bold text-white">Dr. Sophia Chronos</h2>
              <p className="text-xs text-amber-400 font-mono">Master Archivist • Gemini 3.8 Intelligence</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-h-[300px] max-h-[460px] overflow-y-auto pr-2">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl text-xs md:text-sm leading-relaxed max-w-2xl ${
                  msg.role === 'professor'
                    ? 'bg-slate-950 border border-amber-500/30 text-slate-200 self-start'
                    : 'bg-amber-950/40 border border-amber-500/50 text-amber-100 self-end'
                }`}
              >
                <span className="text-[10px] font-mono block text-slate-400 mb-1">{msg.sender}</span>
                <div className="whitespace-pre-line">{msg.text}</div>
              </div>
            ))}
            {isAiLoading && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-amber-400 self-start flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Dr. Sophia is indexing civilizational archives...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleAskDrSophia} className="flex gap-2 border-t border-slate-800 pt-3">
            <input
              type="text"
              placeholder="Ask Dr. Sophia about ancient trade routes, archaeological dating, or historical turning points..."
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={isAiLoading || !inputQuestion.trim()}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
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
