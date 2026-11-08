import React from 'react';
import {
  User,
  Shield,
  Award,
  Zap,
  Coins,
  Flame,
  CheckCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { sound } from '../../utils/audio';

interface StudentProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onOpenEconomy: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onOpenEconomy,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Profile Header */}
        <div className="p-6 bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400 shadow-lg shadow-cyan-500/20"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                  {user.role === 'student' ? 'Active Scholar Dossier' : 'Faculty Member'}
                </span>
                <span className="px-2 py-0.5 text-[9px] bg-cyan-500/20 text-cyan-300 rounded font-mono">
                  {user.rank}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white font-display">{user.callsign}</h2>
              <p className="text-xs text-slate-400 font-mono">{user.name} • {user.house}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-mono px-2 py-1 rounded-lg hover:bg-slate-800"
          >
            ✕ Close
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Level & XP Gauge */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-white font-bold">Level {user.level} Scholar</span>
              <span className="text-cyan-400 font-bold">{user.xp} / {user.xpToNextLevel} XP</span>
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                style={{ width: `${(user.xp / user.xpToNextLevel) * 100}%` }}
              />
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 text-center font-mono">
            <div
              onClick={() => {
                onClose();
                onOpenEconomy();
              }}
              className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/30 hover:border-amber-400 cursor-pointer transition-all"
            >
              <span className="text-[10px] text-slate-500 uppercase flex items-center justify-center gap-1">
                <Coins className="w-3 h-3 text-amber-400" />
                <span>Wallet</span>
              </span>
              <div className="text-base font-bold text-amber-400 mt-1">{user.coins} AC</div>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase flex items-center justify-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />
                <span>Streak</span>
              </span>
              <div className="text-base font-bold text-orange-400 mt-1">{user.streakDays} Days</div>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase flex items-center justify-center gap-1">
                <Award className="w-3 h-3 text-cyan-400" />
                <span>Badges</span>
              </span>
              <div className="text-base font-bold text-cyan-400 mt-1">{user.badges.length}</div>
            </div>
          </div>

          {/* Department Mastery Gauges */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col gap-3">
            <span className="text-xs font-mono uppercase text-cyan-400 font-bold">Academic Mastery Breakdown</span>
            <div className="flex flex-col gap-2.5">
              {[
                { name: 'Quantum Sciences', val: user.mastery.science, color: 'bg-cyan-500' },
                { name: 'Mathematical Matrix', val: user.mastery.math, color: 'bg-violet-500' },
                { name: 'Chronos History & Cartography', val: user.mastery.history, color: 'bg-amber-500' },
                { name: 'Linguistic Academy', val: user.mastery.literature, color: 'bg-emerald-500' },
                { name: 'Arena Combat Tactics', val: user.mastery.combat, color: 'bg-rose-500' },
              ].map((m, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-300">{m.name}</span>
                    <span className="text-white font-bold">{m.val}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className={`h-full ${m.color}`} style={{ width: `${m.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unlocked Badges */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-mono uppercase text-slate-400 font-bold">Earned Badges & Distinctions</span>
            <div className="grid grid-cols-2 gap-3">
              {user.badges.map((b) => (
                <div key={b.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{b.name}</div>
                    <div className="text-[10px] text-slate-400 line-clamp-1">{b.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
