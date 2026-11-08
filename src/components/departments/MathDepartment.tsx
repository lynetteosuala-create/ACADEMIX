import React, { useState } from 'react';
import {
  Grid3X3,
  Bot,
  Sliders,
  Send,
  Sparkles,
  Trophy,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { MathMatrix3D } from '../3d/MathMatrix3D';
import { UserProfile } from '../../types';
import { sound } from '../../utils/audio';

interface MathDepartmentProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onOpenLinkModal?: (url: string) => void;
  onOpenExam?: () => void;
}

export const MathDepartment: React.FC<MathDepartmentProps> = ({
  user,
  onUpdateUser,
  onOpenLinkModal,
  onOpenExam,
}) => {
  const [activeTab, setActiveTab] = useState<'tesseract' | 'matrix_puzzle' | 'prof_ada'>('tesseract');
  const [angleXW, setAngleXW] = useState(0.6);
  const [angleYW, setAngleYW] = useState(0.4);
  const [showEigenvectors, setShowEigenvectors] = useState(true);

  // Speed-calc Matrix Grid Puzzle
  const [matrixGrid, setMatrixGrid] = useState([
    [4, 2],
    [1, 3],
  ]);
  const [determinantGuess, setDeterminantGuess] = useState('');
  const [puzzleFeedback, setPuzzleFeedback] = useState<string | null>(null);

  // AI Prof. Ada chat
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; role: 'student' | 'professor' }>>([
    {
      sender: 'Prof. Ada Thorne',
      role: 'professor',
      text: 'Greetings, Scholar. In the Matrix Citadel, higher dimensions fold into elegant algebraic symmetries. How may I guide your journey through eigenvalues, topological manifolds, or differential forms today?',
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const checkDeterminant = (e: React.FormEvent) => {
    e.preventDefault();
    const correctDet = matrixGrid[0][0] * matrixGrid[1][1] - matrixGrid[0][1] * matrixGrid[1][0];
    if (parseInt(determinantGuess) === correctDet) {
      sound.playSuccess();
      setPuzzleFeedback(`Correct! det(A) = (${matrixGrid[0][0]}·${matrixGrid[1][1]}) - (${matrixGrid[0][1]}·${matrixGrid[1][0]}) = ${correctDet}. +150 XP!`);
      onUpdateUser({
        xp: user.xp + 150,
        mastery: { ...user.mastery, math: Math.min(100, user.mastery.math + 3) },
      });
      generateNewMatrix();
    } else {
      sound.playError();
      setPuzzleFeedback(`Incorrect calculation. Formula is det(A) = ad - bc.`);
    }
  };

  const generateNewMatrix = () => {
    const a = Math.floor(Math.random() * 8) + 1;
    const b = Math.floor(Math.random() * 6);
    const c = Math.floor(Math.random() * 6);
    const d = Math.floor(Math.random() * 8) + 1;
    setMatrixGrid([[a, b], [c, d]]);
    setDeterminantGuess('');
  };

  const handleAskProfAda = async (e: React.FormEvent) => {
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
          professor: 'Prof. Ada Thorne',
          subject: 'math',
          studentQuestion: q,
          context: `Mathematics Matrix Citadel. Tesseract 4D angles active.`,
        }),
      });
      const data = await res.json();
      sound.playSuccess();
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'Prof. Ada Thorne',
          role: 'professor',
          text: data.answer || 'Matrix projections are stabilizing.',
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'Prof. Ada Thorne',
          role: 'professor',
          text: 'Notice how the determinant measures the signed hyper-volume distortion of the linear transformation. When det(A) ≠ 0, the mapping is an isomorphism.',
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 border border-violet-500/30 p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-500/20 border border-violet-500/40 rounded-xl text-violet-400">
              <Grid3X3 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-violet-400 font-bold">
                  Sector 02 • High-Dimensional Mathematics
                </span>
                <span className="px-2 py-0.5 text-[10px] bg-violet-500/20 text-violet-300 rounded-full font-mono">
                  Prof. Ada Thorne Lead Faculty
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">
                MATHEMATICAL MATRIX & CITADEL
              </h1>
              <p className="text-sm text-slate-300 max-w-xl">
                Inspect 4D hypercubes, solve rapid linear algebraic transformations, and explore differential manifolds.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenExam}
              className="px-4 py-2.5 bg-violet-500 hover:bg-violet-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-violet-500/20 cursor-pointer"
            >
              Take Board Exam
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-6 border-t border-slate-800/80 pt-4">
          {[
            { id: 'tesseract', label: '3D 4D-Tesseract Hypercube', icon: Sliders },
            { id: 'matrix_puzzle', label: 'Matrix Determinant Arena', icon: Trophy },
            { id: 'prof_ada', label: 'Consult Prof. Ada (AI)', icon: Bot },
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
                    ? 'bg-violet-500 text-slate-950 font-bold shadow-lg shadow-violet-500/20'
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

      {activeTab === 'tesseract' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <MathMatrix3D
              angleXW={angleXW}
              angleYW={angleYW}
              showEigenvectors={showEigenvectors}
            />

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-slate-400">Projection: Stereographic S³ ➔ ℝ³</span>
                <button
                  onClick={() => setShowEigenvectors(!showEigenvectors)}
                  className={`px-3 py-1 rounded-lg border ${
                    showEigenvectors ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {showEigenvectors ? 'Eigenvectors: ON' : 'Eigenvectors: OFF'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Rotation Speed:</span>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={angleXW}
                  onChange={(e) => setAngleXW(parseFloat(e.target.value))}
                  className="accent-violet-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <div className="text-xs font-mono text-violet-400 font-bold uppercase">Mathematical Properties</div>
              <div className="text-xs text-slate-300 leading-relaxed">
                The tesseract (8-cell) is the four-dimensional analogue of the cube. It consists of 16 vertices, 32 edges, 24 square faces, and 8 cubic cells.
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-violet-300">
                Euler-Poincaré Characteristic:
                <div className="text-white font-bold mt-1">V - E + F - C = 16 - 32 + 24 - 8 = 0</div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-violet-400 font-bold uppercase">Department Resource</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-300">
                MIT OpenCourseWare: Differential Forms & 4D Topological Manifolds
              </p>
              {onOpenLinkModal && (
                <button
                  onClick={() => onOpenLinkModal('https://mit.edu')}
                  className="text-xs text-violet-400 hover:text-violet-300 font-mono text-left underline cursor-pointer"
                >
                  Inspect in Link Preview System →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'matrix_puzzle' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 max-w-2xl mx-auto shadow-2xl flex flex-col gap-6 items-center text-center">
          <div>
            <h2 className="text-xl font-bold text-white font-display">Fast-Matrix Determinant Puzzle</h2>
            <p className="text-xs text-slate-400 mt-1">Compute the determinant of the 2x2 matrix before the clock strikes</p>
          </div>

          {/* Matrix Display */}
          <div className="flex items-center justify-center gap-4 text-2xl font-mono font-bold text-white bg-slate-950 p-6 rounded-2xl border border-violet-500/40">
            <span className="text-3xl text-violet-400">[</span>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>{matrixGrid[0][0]}</div>
              <div>{matrixGrid[0][1]}</div>
              <div>{matrixGrid[1][0]}</div>
              <div>{matrixGrid[1][1]}</div>
            </div>
            <span className="text-3xl text-violet-400">]</span>
          </div>

          <form onSubmit={checkDeterminant} className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
            <input
              type="number"
              placeholder="Enter det(A)..."
              value={determinantGuess}
              onChange={(e) => setDeterminantGuess(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 font-mono text-center"
            />
            <button
              type="submit"
              className="px-6 py-2.5 bg-violet-500 hover:bg-violet-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-violet-500/20"
            >
              Verify Determinant
            </button>
          </form>

          {puzzleFeedback && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300">
              {puzzleFeedback}
            </div>
          )}
        </div>
      )}

      {activeTab === 'prof_ada' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80"
              alt="Prof. Ada"
              className="w-12 h-12 rounded-xl object-cover border border-violet-500/50"
            />
            <div>
              <h2 className="text-base font-bold text-white">Prof. Ada Thorne</h2>
              <p className="text-xs text-violet-400 font-mono">Head of Computational Topology • Gemini 3.8 Intelligence</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-h-[300px] max-h-[460px] overflow-y-auto pr-2">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl text-xs md:text-sm leading-relaxed max-w-2xl ${
                  msg.role === 'professor'
                    ? 'bg-slate-950 border border-violet-500/30 text-slate-200 self-start'
                    : 'bg-violet-950/40 border border-violet-500/50 text-violet-100 self-end'
                }`}
              >
                <span className="text-[10px] font-mono block text-slate-400 mb-1">{msg.sender}</span>
                <div className="whitespace-pre-line">{msg.text}</div>
              </div>
            ))}
            {isAiLoading && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-violet-400 self-start flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Prof. Ada is calculating topological proofs...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleAskProfAda} className="flex gap-2 border-t border-slate-800 pt-3">
            <input
              type="text"
              placeholder="Ask Prof. Ada about linear algebra, calculus, topology, or proof methods..."
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              disabled={isAiLoading || !inputQuestion.trim()}
              className="px-5 py-2.5 bg-violet-500 hover:bg-violet-400 disabled:opacity-30 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
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
