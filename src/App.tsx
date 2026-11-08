import React, { useState } from 'react';
import {
  Compass,
  Atom,
  Grid3X3,
  Globe,
  BookOpen,
  Swords,
  Link2,
  FileText,
  GraduationCap,
  Sparkles,
  Trophy,
  Coins,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { CampusWorld3D } from './components/3d/CampusWorld3D';
import { ScienceDepartment } from './components/departments/ScienceDepartment';
import { MathDepartment } from './components/departments/MathDepartment';
import { HistoryDepartment } from './components/departments/HistoryDepartment';
import { LanguageDepartment } from './components/departments/LanguageDepartment';
import { MultiplayerArena } from './components/arena/MultiplayerArena';
import { LinkPreviewSystem } from './components/links/LinkPreviewSystem';
import { ExamSimulator } from './components/exams/ExamSimulator';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { Navbar } from './components/layout/Navbar';
import { EconomyMarketplaceModal } from './components/economy/EconomyMarketplaceModal';
import { StudentProfileModal } from './components/profile/StudentProfileModal';
import { DepartmentId, AcademicMission, UserProfile } from './types';
import { INITIAL_MISSIONS, INITIAL_USER } from './utils/mockData';
import { sound } from './utils/audio';

export default function App() {
  const [currentView, setCurrentView] = useState<'campus' | DepartmentId | 'links' | 'exams' | 'teacher'>('campus');
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [missions, setMissions] = useState<AcademicMission[]>(INITIAL_MISSIONS);

  // Modals
  const [isEconomyOpen, setIsEconomyOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Quick Link inspection shortcut from other pages
  const [selectedLinkUrl, setSelectedLinkUrl] = useState<string | null>(null);

  const handleUpdateUser = (updated: Partial<UserProfile>) => {
    setUser((prev) => {
      const nextCoins = updated.coins !== undefined ? updated.coins : prev.coins;
      const nextXp = updated.xp !== undefined ? updated.xp : prev.xp;
      
      // Calculate level-up check
      let nextLvl = prev.level;
      let nextXpThreshold = prev.xpToNextLevel;
      if (nextXp >= nextXpThreshold) {
        nextLvl += 1;
        nextXpThreshold = Math.round(nextXpThreshold * 1.35);
        sound.playSuccess();
      }

      return {
        ...prev,
        ...updated,
        level: nextLvl,
        xpToNextLevel: nextXpThreshold,
      };
    });
  };

  const handleToggleRole = () => {
    setUser((prev) => ({
      ...prev,
      role: prev.role === 'student' ? 'teacher' : 'student',
    }));
  };

  const handleToggleMute = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleSelectDepartmentFromCampus = (deptId: DepartmentId) => {
    sound.playWarp();
    setCurrentView(deptId);
  };

  const handleCompleteMission = (missionId: string) => {
    const match = missions.find((m) => m.id === missionId);
    if (!match || match.completed) return;

    sound.playSuccess();
    setMissions((mList) =>
      mList.map((m) => (m.id === missionId ? { ...m, completed: true } : m))
    );

    handleUpdateUser({
      xp: user.xp + match.xpReward,
      coins: user.coins + match.coinReward,
    });
  };

  const handleDispatchNewMission = (newM: AcademicMission) => {
    setMissions((prev) => [newM, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Futuristic Navigation Bar */}
      <Navbar
        currentView={currentView}
        onNavigate={(v) => {
          setSelectedLinkUrl(null);
          setCurrentView(v);
        }}
        user={user}
        onToggleRole={handleToggleRole}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenEconomy={() => setIsEconomyOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* VIEW 1: 3D Campus World */}
        {currentView === 'campus' && (
          <div className="w-full flex-1 flex flex-col">
            {/* Campus 3D Scene Viewport */}
            <div className="w-full h-[620px] md:h-[720px] relative">
              <CampusWorld3D onSelectDepartment={handleSelectDepartmentFromCampus} />
            </div>

            {/* Below Campus: Active Missions & Department Portals Dashboard */}
            <div className="max-w-7xl mx-auto w-full p-4 md:p-6 flex flex-col gap-6">
              {/* Daily Missions Tray */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h2 className="text-base font-bold text-white font-display">
                      ACTIVE ACADEMIC MISSIONS
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-cyan-400">
                    {missions.filter((m) => m.completed).length} / {missions.length} Fulfilled
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {missions.map((m) => (
                    <div
                      key={m.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                        m.completed
                          ? 'border-emerald-500/30 bg-emerald-950/10'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                          <span className="text-slate-400 uppercase">{m.department} Sector</span>
                          <span className="text-amber-400 font-bold">+{m.coinReward} AC • +{m.xpReward} XP</span>
                        </div>
                        <h3 className="font-bold text-white text-sm">{m.title}</h3>
                        <p className="text-xs text-slate-400 mt-1">{m.description}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-xs font-mono">
                        <span className="text-[11px] text-slate-500">Tier: {m.difficulty}</span>
                        {m.completed ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Claimed</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleCompleteMission(m.id)}
                            className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg transition-colors cursor-pointer"
                          >
                            Verify & Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Department Portals Showcase */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white font-display">
                      EXPLORE ACADEMIC DEPARTMENTS
                    </h2>
                    <p className="text-xs text-slate-400">
                      Enter dedicated 3D interactive laboratories, consult specialized AI professors, and complete subject challenges.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      id: 'science',
                      title: 'Quantum Science Lab',
                      subtitle: 'Particle Accelerator & Fusion',
                      color: 'from-cyan-950/60 border-cyan-500/40 hover:border-cyan-400',
                      icon: Atom,
                      desc: '3D Tokamak fusion confinement, molecular synthesis, and AI Dr. Vance.',
                    },
                    {
                      id: 'math',
                      title: 'Mathematics Matrix',
                      subtitle: '4D Tesseract & Vector Citadel',
                      color: 'from-violet-950/60 border-violet-500/40 hover:border-violet-400',
                      icon: Grid3X3,
                      desc: '4-dimensional hypercube rotation, matrix determinant puzzles, and Prof. Ada.',
                    },
                    {
                      id: 'history',
                      title: 'Chronos Observatory',
                      subtitle: 'Geosphere & Archaeological Scan',
                      color: 'from-amber-950/60 border-amber-500/40 hover:border-amber-400',
                      icon: Globe,
                      desc: 'Interactive 3D historical globe, ancient civilizational relics, and Dr. Sophia.',
                    },
                    {
                      id: 'literature',
                      title: 'Nexus Linguistics',
                      subtitle: 'Semantic Neural Lexicon',
                      color: 'from-emerald-950/60 border-emerald-500/40 hover:border-emerald-400',
                      icon: BookOpen,
                      desc: '3D holographic parse trees, classical rhetorical cipher duels, and Master Roland.',
                    },
                  ].map((dept) => {
                    const Icon = dept.icon;
                    return (
                      <div
                        key={dept.id}
                        onClick={() => {
                          sound.playWarp();
                          setCurrentView(dept.id as DepartmentId);
                        }}
                        className={`p-5 rounded-2xl bg-gradient-to-b ${dept.color} to-slate-900 border transition-all cursor-pointer shadow-xl flex flex-col justify-between gap-4 group active:scale-98`}
                      >
                        <div>
                          <div className="p-3 w-fit rounded-xl bg-slate-950 border border-slate-800 mb-3 group-hover:scale-105 transition-transform">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">{dept.subtitle}</span>
                          <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {dept.title}
                          </h3>
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{dept.desc}</p>
                        </div>

                        <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-400 pt-2 border-t border-slate-800">
                          <span>Enter Simulation</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Science Department */}
        {currentView === 'science' && (
          <ScienceDepartment
            user={user}
            onUpdateUser={handleUpdateUser}
            onOpenLinkModal={() => setCurrentView('links')}
            onOpenExam={() => setCurrentView('exams')}
          />
        )}

        {/* VIEW 3: Math Department */}
        {currentView === 'math' && (
          <MathDepartment
            user={user}
            onUpdateUser={handleUpdateUser}
            onOpenLinkModal={() => setCurrentView('links')}
            onOpenExam={() => setCurrentView('exams')}
          />
        )}

        {/* VIEW 4: History Department */}
        {currentView === 'history' && (
          <HistoryDepartment
            user={user}
            onUpdateUser={handleUpdateUser}
            onOpenLinkModal={() => setCurrentView('links')}
            onOpenExam={() => setCurrentView('exams')}
          />
        )}

        {/* VIEW 5: Literature & Language Department */}
        {currentView === 'literature' && (
          <LanguageDepartment
            user={user}
            onUpdateUser={handleUpdateUser}
            onOpenLinkModal={() => setCurrentView('links')}
            onOpenExam={() => setCurrentView('exams')}
          />
        )}

        {/* VIEW 6: Multiplayer Academic Arena */}
        {currentView === 'arena' && (
          <MultiplayerArena
            user={user}
            onUpdateUser={handleUpdateUser}
            onOpenLinkModal={() => setCurrentView('links')}
          />
        )}

        {/* VIEW 7: Link Preview System & Vault */}
        {currentView === 'links' && (
          <LinkPreviewSystem
            user={user}
            onAddResourcePoints={(xp) => handleUpdateUser({ xp: user.xp + xp, coins: user.coins + 150 })}
          />
        )}

        {/* VIEW 8: Examination Simulator */}
        {currentView === 'exams' && (
          <ExamSimulator
            user={user}
            onExamComplete={(result) => {
              if (result.passed) {
                handleUpdateUser({
                  xp: user.xp + 600,
                  coins: user.coins + 250,
                  rank: user.rank === 'Cadet' ? 'Scholar' : user.rank === 'Scholar' ? 'Archon' : 'Grandmaster',
                });
              }
            }}
          />
        )}

        {/* VIEW 9: Teacher Dashboard */}
        {currentView === 'teacher' && (
          <TeacherDashboard
            user={user}
            onDispatchMission={handleDispatchNewMission}
          />
        )}
      </main>

      {/* Virtual Economy Wallet & Rewards Marketplace Modal */}
      <EconomyMarketplaceModal
        user={user}
        isOpen={isEconomyOpen}
        onClose={() => setIsEconomyOpen(false)}
        onUpdateUser={handleUpdateUser}
      />

      {/* Student Dossier Profile Modal */}
      <StudentProfileModal
        user={user}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenEconomy={() => setIsEconomyOpen(true)}
      />

      {/* Footer Branding */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs font-mono text-slate-500 select-none">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>ACADEMIX • THE ULTIMATE LEARNING ARENA • VERSION 4.2</span>
          <span>POWERED BY GOOGLE AI STUDIO & THREE.JS ENGINE</span>
          <span className="text-amber-400/80">IN-GAME VIRTUAL ECONOMY ACTIVE</span>
        </div>
      </footer>
    </div>
  );
}
