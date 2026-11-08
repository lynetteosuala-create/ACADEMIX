import React from 'react';
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
  Volume2,
  VolumeX,
  Coins,
  User,
  Shield,
  Layers,
} from 'lucide-react';
import { DepartmentId, UserProfile, UserRole } from '../../types';
import { sound } from '../../utils/audio';

interface NavbarProps {
  currentView: 'campus' | DepartmentId | 'links' | 'exams' | 'teacher';
  onNavigate: (view: 'campus' | DepartmentId | 'links' | 'exams' | 'teacher') => void;
  user: UserProfile;
  onToggleRole: () => void;
  onOpenProfile: () => void;
  onOpenEconomy: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  user,
  onToggleRole,
  onOpenProfile,
  onOpenEconomy,
  isMuted,
  onToggleMute,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md select-none">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Brand Logo & Tagline */}
        <div
          onClick={() => {
            sound.playWarp();
            onNavigate('campus');
          }}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Compass className="w-5 h-5 text-cyan-400 group-hover:rotate-45 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wider text-white font-display">
                ACADEMIX
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30 uppercase">
                ARENA
              </span>
            </div>
            <p className="hidden md:block text-[10px] font-mono text-slate-400 -mt-0.5">
              Think Beyond Limits. Learn Beyond Classrooms.
            </p>
          </div>
        </div>

        {/* Primary Navigation Pills */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              sound.playClick();
              onNavigate('campus');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
              currentView === 'campus'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Campus 3D</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onNavigate('science');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
              currentView === 'science'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <Atom className="w-3.5 h-3.5" />
            <span>Science</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onNavigate('math');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
              currentView === 'math'
                ? 'bg-violet-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-violet-300'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Math</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onNavigate('history');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
              currentView === 'history'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>History</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onNavigate('literature');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
              currentView === 'literature'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Linguistics</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onNavigate('arena');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
              currentView === 'arena'
                ? 'bg-rose-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Arena</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onNavigate('links');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
              currentView === 'links'
                ? 'bg-blue-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-blue-300'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Link Vault</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onNavigate('exams');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
              currentView === 'exams'
                ? 'bg-indigo-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-indigo-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Exams</span>
          </button>

          {user.role === 'teacher' && (
            <button
              onClick={() => {
                sound.playClick();
                onNavigate('teacher');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
                currentView === 'teacher'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                  : 'text-amber-400 hover:bg-slate-800'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Faculty</span>
            </button>
          )}
        </nav>

        {/* Right Actions: Sound, Wallet, Role Toggle, Profile */}
        <div className="flex items-center gap-2.5">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              onToggleMute();
              sound.playClick();
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Virtual Wallet Button (AC Coins) */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenEconomy();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
            title="Open Academix Coins Wallet & Marketplace"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{user.coins.toLocaleString()} AC</span>
          </button>

          {/* Role Switcher (Student / Teacher Mode) */}
          <button
            onClick={() => {
              sound.playTerminalBeep();
              onToggleRole();
            }}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all cursor-pointer ${
              user.role === 'teacher'
                ? 'bg-amber-950/60 border-amber-500/60 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
            title="Toggle between Student Mode and Academy Faculty Mode"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{user.role === 'teacher' ? 'Faculty Mode' : 'Student Mode'}</span>
          </button>

          {/* Student Profile Pill */}
          <div
            onClick={() => {
              sound.playClick();
              onOpenProfile();
            }}
            className="flex items-center gap-2 p-1 pl-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 rounded-xl cursor-pointer transition-all"
          >
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[11px] font-bold text-white font-mono leading-none">{user.callsign}</span>
              <span className="text-[9px] text-cyan-400 font-mono leading-none mt-1">Lvl {user.level}</span>
            </div>
            <img
              src={user.avatar}
              alt={user.callsign}
              className="w-7 h-7 rounded-lg object-cover border border-cyan-400/50"
            />
          </div>
        </div>
      </div>

      {/* Mobile Scrollable Sub-bar */}
      <div className="lg:hidden flex items-center gap-1 px-4 py-1.5 overflow-x-auto border-t border-slate-800/60 bg-slate-950/80">
        {[
          { id: 'campus', label: 'Campus' },
          { id: 'science', label: 'Science' },
          { id: 'math', label: 'Math' },
          { id: 'history', label: 'History' },
          { id: 'literature', label: 'Linguistics' },
          { id: 'arena', label: 'Arena' },
          { id: 'links', label: 'Link Vault' },
          { id: 'exams', label: 'Exams' },
          ...(user.role === 'teacher' ? [{ id: 'teacher', label: 'Faculty' }] : []),
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              sound.playClick();
              onNavigate(tab.id as any);
            }}
            className={`px-3 py-1 text-xs font-mono rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              currentView === tab.id
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white bg-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
};
