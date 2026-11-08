import React, { useState } from 'react';
import {
  Atom,
  Flame,
  Zap,
  RotateCcw,
  Sparkles,
  Send,
  Bot,
  ExternalLink,
  ChevronRight,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { ScienceLab3D } from '../3d/ScienceLab3D';
import { UserProfile } from '../../types';
import { sound } from '../../utils/audio';

interface ScienceDepartmentProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onOpenLinkModal?: (url: string) => void;
  onOpenExam?: () => void;
}

export const ScienceDepartment: React.FC<ScienceDepartmentProps> = ({
  user,
  onUpdateUser,
  onOpenLinkModal,
  onOpenExam,
}) => {
  const [magneticField, setMagneticField] = useState(88);
  const [fuelType, setFuelType] = useState<'Hydrogen' | 'Deuterium' | 'Tritium' | 'Helium-3'>('Deuterium');
  const [isReacting, setIsReacting] = useState(true);
  const [labStability, setLabStability] = useState(94);
  const [activeTab, setActiveTab] = useState<'simulation' | 'ai_mentor' | 'experiments'>('simulation');

  // AI Dr. Vance consultation chat
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; role: 'student' | 'professor' }>>([
    {
      sender: 'Dr. Alistair Vance',
      role: 'professor',
      text: 'Welcome to the Quantum Science Lab, Scholar. We are currently testing plasma confinement thresholds for the magnetic torus. How may I assist your inquiries into quantum mechanics or particle synthesis?',
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAskDrVance = async (e: React.FormEvent) => {
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
          professor: 'Dr. Alistair Vance',
          subject: 'science',
          studentQuestion: q,
          context: `Quantum Lab experiment active. Magnetic Field: ${magneticField}%, Fuel: ${fuelType}, Plasma Stability: ${labStability}%`,
        }),
      });
      const data = await res.json();
      sound.playSuccess();
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'Dr. Alistair Vance',
          role: 'professor',
          text: data.answer || 'The quantum telemetry is recalculating.',
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'Dr. Alistair Vance',
          role: 'professor',
          text: 'Consider the Lorentz force equation F = q(E + v × B). As we intensify magnetic flux density B, charged ions follow helical gyromotion, preventing wall contact.',
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 border border-cyan-500/30 p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-cyan-400">
              <Atom className="w-8 h-8 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">
                  Sector 01 • Empirical Sciences
                </span>
                <span className="px-2 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-300 rounded-full font-mono">
                  Dr. Vance Lead Faculty
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">
                QUANTUM SCIENCE LABORATORY
              </h1>
              <p className="text-sm text-slate-300 max-w-xl">
                Conduct high-energy particle collisions, stabilize thermonuclear magnetic confinement, and synthesize isotopes in a zero-gravity chamber.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenExam}
              className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              Take Board Exam
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 mt-6 border-t border-slate-800/80 pt-4">
          {[
            { id: 'simulation', label: '3D Tokamak Simulator', icon: Sliders },
            { id: 'ai_mentor', label: 'Consult Dr. Vance (AI Professor)', icon: Bot },
            { id: 'experiments', label: 'Laboratory Mystery Cases', icon: Zap },
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
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
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

      {/* Main View */}
      {activeTab === 'simulation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 3D Interactive Viewport (2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <ScienceLab3D
              magneticFieldStrength={magneticField}
              fuelType={fuelType}
              isReacting={isReacting}
              onStabilityChange={setLabStability}
            />

            {/* Reaction Controls Bar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    sound.playLaser();
                    setIsReacting(!isReacting);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                    isReacting
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                      : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                  }`}
                >
                  {isReacting ? 'HALT REACTION' : 'IGNITE CORE'}
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    setMagneticField(90);
                    setFuelType('Deuterium');
                  }}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs cursor-pointer"
                  title="Reset to Equilibrium"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Fuel Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono text-slate-400 mr-1">Fuel:</span>
                {(['Hydrogen', 'Deuterium', 'Tritium', 'Helium-3'] as const).map((fuel) => (
                  <button
                    key={fuel}
                    onClick={() => {
                      sound.playClick();
                      setFuelType(fuel);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-all cursor-pointer ${
                      fuelType === fuel
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {fuel}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Parameters & Telemetry Panel */}
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono uppercase text-cyan-400 font-bold">Confinement Parameters</span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded">PBR Active</span>
              </div>

              {/* Magnetic Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">Magnetic Field B (Tesla)</span>
                  <span className="text-cyan-400 font-bold">{magneticField}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={magneticField}
                  onChange={(e) => setMagneticField(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 font-mono">
                  Ideal equilibrium: 85% - 95% magnetic flux for maximum stability
                </span>
              </div>

              {/* Scientific Equation Callout */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed">
                <div className="text-[10px] text-slate-500 uppercase mb-1">Thermonuclear Yield Law</div>
                <div className="text-cyan-300 font-bold">²H + ³H ➔ ⁴He (3.5 MeV) + n (14.1 MeV)</div>
                <div className="text-[11px] text-slate-400 mt-1">Total Q-value: 17.6 MeV per D-T fusion reaction.</div>
              </div>
            </div>

            {/* Peer-Reviewed Journal Link Preview Shortcut */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase">Associated Research Link</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-300">
                Nature: "Room-Temperature Quantum Coherence in Nanostructures"
              </p>
              {onOpenLinkModal && (
                <button
                  onClick={() => onOpenLinkModal('https://nature.com')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-mono text-left underline cursor-pointer"
                >
                  Open in Link Preview System →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Dr. Vance Tab */}
      {activeTab === 'ai_mentor' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80"
              alt="Dr. Vance"
              className="w-12 h-12 rounded-xl object-cover border border-cyan-500/50"
            />
            <div>
              <h2 className="text-base font-bold text-white">Dr. Alistair Vance</h2>
              <p className="text-xs text-cyan-400 font-mono">Chair of Experimental Systems • Gemini 3.8 Intelligence</p>
            </div>
          </div>

          {/* Conversation history */}
          <div className="flex flex-col gap-3 min-h-[300px] max-h-[460px] overflow-y-auto pr-2">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl text-xs md:text-sm leading-relaxed max-w-2xl ${
                  msg.role === 'professor'
                    ? 'bg-slate-950 border border-cyan-500/30 text-slate-200 self-start'
                    : 'bg-cyan-950/40 border border-cyan-500/50 text-cyan-100 self-end'
                }`}
              >
                <span className="text-[10px] font-mono block text-slate-400 mb-1">{msg.sender}</span>
                <div className="whitespace-pre-line">{msg.text}</div>
              </div>
            ))}
            {isAiLoading && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-400 self-start flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Dr. Vance is analyzing the quantum laws...</span>
              </div>
            )}
          </div>

          {/* Question input */}
          <form onSubmit={handleAskDrVance} className="flex gap-2 border-t border-slate-800 pt-3">
            <input
              type="text"
              placeholder="Ask Dr. Vance about thermodynamics, quantum tunneling, or particle decay..."
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={isAiLoading || !inputQuestion.trim()}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Experiments Tab */}
      {activeTab === 'experiments' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Virtual Titration & Buffer Kinetics',
              desc: 'Balance conjugate acid-base reactions to achieve neutralization pH at 7.00.',
              points: '+250 XP',
            },
            {
              title: 'Relativistic Velocity Dilatation',
              desc: 'Accelerate muons to 0.999c and measure time dilation according to Lorentz factor γ.',
              points: '+300 XP',
            },
            {
              title: 'CRISPR Cas-9 Nucleotide Splicing',
              desc: 'Target viral DNA sequences in biological bacterial genomes with RNA guides.',
              points: '+350 XP',
            },
          ].map((exp, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-4 shadow-xl">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded">
                  {exp.points}
                </span>
                <h3 className="font-bold text-white text-base mt-2 mb-1">{exp.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{exp.desc}</p>
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('simulation');
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <span>Launch Chamber</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
