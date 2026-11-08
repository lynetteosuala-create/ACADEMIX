import React, { useState } from 'react';
import {
  GraduationCap,
  Users,
  Plus,
  Sliders,
  CheckCircle,
  FileQuestion,
  BarChart3,
  Sparkles,
  Send,
  Shield,
  Zap,
} from 'lucide-react';
import { DepartmentId, RankTier, UserProfile } from '../../types';
import { sound } from '../../utils/audio';

interface TeacherDashboardProps {
  user: UserProfile;
  onDispatchMission?: (mission: any) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  user,
  onDispatchMission,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'create_exam' | 'dispatch_mission' | 'ai_tuning'>('overview');
  
  // Create exam item form state
  const [examDept, setExamDept] = useState<DepartmentId>('science');
  const [examQuestion, setExamQuestion] = useState('');
  const [examOptions, setExamOptions] = useState(['', '', '', '']);
  const [correctIdx, setCorrectIdx] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [examCreatedSuccess, setExamCreatedSuccess] = useState(false);

  // AI Difficulty parameters
  const [aiDifficultyBias, setAiDifficultyBias] = useState(75); // 0 - 100
  const [strictnessLevel, setStrictnessLevel] = useState<'Standard' | 'Rigorous' | 'Archon'>('Rigorous');

  // New Mission form
  const [missionTitle, setMissionTitle] = useState('');
  const [missionObjective, setMissionObjective] = useState('');
  const [missionXp, setMissionXp] = useState(350);
  const [missionCoins, setMissionCoins] = useState(150);
  const [missionSuccess, setMissionSuccess] = useState(false);

  const handleCreateExamQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examQuestion.trim() || examOptions.some((o) => !o.trim())) return;

    sound.playSuccess();
    setExamCreatedSuccess(true);
    setTimeout(() => {
      setExamCreatedSuccess(false);
      setExamQuestion('');
      setExamOptions(['', '', '', '']);
      setExplanation('');
    }, 2500);
  };

  const handleDispatchMissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!missionTitle.trim()) return;

    sound.playSuccess();
    setMissionSuccess(true);
    if (onDispatchMission) {
      onDispatchMission({
        id: `m-teacher-${Date.now()}`,
        department: examDept,
        title: missionTitle,
        description: 'Assigned directly by Academy Faculty via Mission Control.',
        objective: missionObjective,
        xpReward: missionXp,
        coinReward: missionCoins,
        difficulty: 'Scholar',
        completed: false,
        type: 'special',
      });
    }
    setTimeout(() => {
      setMissionSuccess(false);
      setMissionTitle('');
      setMissionObjective('');
    }, 2500);
  };

  return (
    <div className="w-full flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-indigo-400">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold">
                  Academy Faculty & Senate Portal
                </span>
                <span className="px-2 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-300 rounded-full font-mono">
                  Instructor Level Clearances Active
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">
                TEACHER DASHBOARD & MISSION CONTROL
              </h1>
              <p className="text-sm text-slate-300 max-w-xl">
                Manage academic curriculum examinations, adjust real-time AI difficulty calibration, dispatch new scholar missions, and audit student cohort progress.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 mt-6 border-t border-slate-800/80 pt-4 overflow-x-auto">
          {[
            { id: 'overview', label: 'Cohort Telemetry & Analytics', icon: BarChart3 },
            { id: 'create_exam', label: 'Curriculum Exam Authoring', icon: FileQuestion },
            { id: 'dispatch_mission', label: 'Dispatch Academy Mission', icon: Send },
            { id: 'ai_tuning', label: 'AI Difficulty Calibration', icon: Sliders },
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
                className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-500 text-slate-950 font-bold shadow-lg shadow-indigo-500/20'
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

      {/* Cohort Overview */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-center">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[10px] text-slate-500 uppercase">Enrolled Scholars</span>
              <div className="text-2xl font-black text-white mt-1">1,555</div>
              <span className="text-[10px] text-emerald-400 mt-1 block">↑ 12% This Quarter</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[10px] text-slate-500 uppercase">Average Exam Pass Rate</span>
              <div className="text-2xl font-black text-cyan-400 mt-1">84.2%</div>
              <span className="text-[10px] text-slate-400 mt-1 block">Passing threshold: 75%</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[10px] text-slate-500 uppercase">Arena Duels Completed</span>
              <div className="text-2xl font-black text-rose-400 mt-1">14,280</div>
              <span className="text-[10px] text-rose-400 mt-1 block">Live real-time matchmaking</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[10px] text-slate-500 uppercase">Active Missions Dispatched</span>
              <div className="text-2xl font-black text-amber-400 mt-1">42</div>
              <span className="text-[10px] text-amber-400 mt-1 block">Across 4 Departments</span>
            </div>
          </div>

          {/* Department Mastery Distribution */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
            <h2 className="text-sm font-bold text-white font-mono uppercase">Cohort Mastery Distribution by Subject</h2>
            <div className="flex flex-col gap-3">
              {[
                { name: 'Quantum Science Laboratory', value: 82, color: 'bg-cyan-500' },
                { name: 'Mathematical Matrix & Citadel', value: 76, color: 'bg-violet-500' },
                { name: 'Chronos History & Cartography', value: 88, color: 'bg-amber-500' },
                { name: 'Nexus Linguistic Academy', value: 79, color: 'bg-emerald-500' },
              ].map((sub, idx) => (
                <div key={idx} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">{sub.name}</span>
                    <span className="text-white font-bold">{sub.value}% Mastery</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className={`h-full ${sub.color} rounded-full`} style={{ width: `${sub.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Exam Question */}
      {activeTab === 'create_exam' && (
        <form onSubmit={handleCreateExamQuestion} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4 max-w-3xl">
          <h2 className="text-base font-bold text-white font-display">Create Proctored Board Exam Item</h2>

          {examCreatedSuccess && (
            <div className="p-3 bg-emerald-950 border border-emerald-500/40 rounded-xl text-xs font-mono text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Exam item successfully authored and saved to ACADEMIX examination bank!</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <label className="text-xs font-mono text-slate-400">Department:</label>
            <select
              value={examDept}
              onChange={(e) => setExamDept(e.target.value as DepartmentId)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
            >
              <option value="science">Quantum Science</option>
              <option value="math">Mathematics Matrix</option>
              <option value="history">Chronos History</option>
              <option value="literature">Nexus Linguistics</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-slate-300">Question Statement:</label>
            <textarea
              rows={3}
              placeholder="E.g., What thermodynamic principle explains entropy maximization in isolated states?"
              value={examQuestion}
              onChange={(e) => setExamQuestion(e.target.value)}
              className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs md:text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {examOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <input
                  type="radio"
                  name="correctRadio"
                  checked={correctIdx === i}
                  onChange={() => setCorrectIdx(i)}
                  className="accent-indigo-500"
                />
                <input
                  type="text"
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  value={opt}
                  onChange={(e) => {
                    const copy = [...examOptions];
                    copy[i] = e.target.value;
                    setExamOptions(copy);
                  }}
                  className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-slate-300">Detailed Explanation for Students:</label>
            <input
              type="text"
              placeholder="Rationale revealed upon examination completion..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
            >
              Add Item to Board Exam
            </button>
          </div>
        </form>
      )}

      {/* Dispatch Mission */}
      {activeTab === 'dispatch_mission' && (
        <form onSubmit={handleDispatchMissionSubmit} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4 max-w-3xl">
          <h2 className="text-base font-bold text-white font-display">Dispatch Academic Mission to Scholars</h2>

          {missionSuccess && (
            <div className="p-3 bg-emerald-950 border border-emerald-500/40 rounded-xl text-xs font-mono text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Mission successfully broadcast to all student terminals!</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-slate-300">Mission Title:</label>
            <input
              type="text"
              placeholder="E.g., Quantum Entanglement Teleportation Protocol"
              value={missionTitle}
              onChange={(e) => setMissionTitle(e.target.value)}
              className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-slate-300">Objective Criteria:</label>
            <input
              type="text"
              placeholder="E.g., Achieve 98% magnetic confinement in the Science Lab"
              value={missionObjective}
              onChange={(e) => setMissionObjective(e.target.value)}
              className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-slate-300">XP Reward:</label>
              <input
                type="number"
                value={missionXp}
                onChange={(e) => setMissionXp(parseInt(e.target.value))}
                className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-slate-300">Academix Coins (AC):</label>
              <input
                type="number"
                value={missionCoins}
                onChange={(e) => setMissionCoins(parseInt(e.target.value))}
                className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              Broadcast Mission to Students
            </button>
          </div>
        </form>
      )}

      {/* AI Difficulty Tuning */}
      {activeTab === 'ai_tuning' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6 max-w-3xl">
          <div>
            <h2 className="text-base font-bold text-white font-display">AI Teacher & Dynamic Battle Question Tuning</h2>
            <p className="text-xs text-slate-400 mt-1">
              Calibrate the difficulty escalation rate of Gemini 3.8 Flash model question generation across all subjects.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">Cognitive Difficulty Bias:</span>
              <span className="text-indigo-400 font-bold">{aiDifficultyBias}% (Advanced Tier)</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={aiDifficultyBias}
              onChange={(e) => setAiDifficultyBias(parseInt(e.target.value))}
              className="w-full accent-indigo-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 font-mono">
              Higher values introduce graduate-level multi-step physics and abstract algebra questions.
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs font-bold text-white block">Auto-Adjustment on Answer Streaks</span>
              <span className="text-[11px] text-slate-400">Increase enemy bot precision when student hits 3x streak</span>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">ENABLED</span>
          </div>
        </div>
      )}
    </div>
  );
};
