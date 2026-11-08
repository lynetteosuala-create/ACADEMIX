import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Swords,
  Trophy,
  Zap,
  Shield,
  Timer,
  Users,
  Flame,
  Award,
  ChevronRight,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { BattleQuestion, RankTier, UserProfile } from '../../types';
import { sound } from '../../utils/audio';
import { BATTLE_QUESTIONS } from '../../utils/mockData';

type BattleMode = 'quiz_duel' | 'problem_race' | 'survival_gauntlet';

interface OpponentBot {
  name: string;
  callsign: string;
  level: number;
  rank: RankTier;
  house: string;
  avatar: string;
  accuracy: number; // 0.0 - 1.0
  avgAnswerTimeSec: number;
}

const OPPONENT_ROSTER: OpponentBot[] = [
  {
    name: 'Valkyrie_Nova',
    callsign: 'TITAN_MIND',
    level: 38,
    rank: 'Grandmaster',
    house: 'House Quantum',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    accuracy: 0.92,
    avgAnswerTimeSec: 4.5,
  },
  {
    name: 'Kenji_Cipher',
    callsign: 'MATRIX_ARCHITECT',
    level: 35,
    rank: 'Archon',
    house: 'House Turing',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    accuracy: 0.86,
    avgAnswerTimeSec: 5.2,
  },
  {
    name: 'Elena_Rostova',
    callsign: 'TEMPORAL_ECHO',
    level: 33,
    rank: 'Scholar',
    house: 'House Alexandria',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    accuracy: 0.79,
    avgAnswerTimeSec: 6.0,
  },
  {
    name: 'Marcus_Aurelius_X',
    callsign: 'LEXICAL_STORM',
    level: 30,
    rank: 'Scholar',
    house: 'House Babel',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    accuracy: 0.74,
    avgAnswerTimeSec: 6.8,
  },
];

interface MultiplayerArenaProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onOpenLinkModal?: (url: string) => void;
}

export const MultiplayerArena: React.FC<MultiplayerArenaProps> = ({
  user,
  onUpdateUser,
  onOpenLinkModal,
}) => {
  const [activeTab, setActiveTab] = useState<'arena' | 'modes' | 'leaderboard' | 'history'>('arena');
  const [battleState, setBattleState] = useState<'lobby' | 'matchmaking' | 'combat' | 'game_over'>('lobby');
  const [selectedMode, setSelectedMode] = useState<BattleMode>('quiz_duel');
  const [selectedOpponent, setSelectedOpponent] = useState<OpponentBot>(OPPONENT_ROSTER[0]);
  
  // Combat gameplay state
  const [questions, setQuestions] = useState<BattleQuestion[]>(BATTLE_QUESTIONS);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const [opponentHp, setOpponentHp] = useState(100);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highestStreak, setHighestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [isFetchingAiQuestion, setIsFetchingAiQuestion] = useState(false);

  // Matchmaking simulation
  const [matchmakingCountdown, setMatchmakingCountdown] = useState(3);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const botAnswerTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Matchmaking effect
  useEffect(() => {
    if (battleState === 'matchmaking') {
      sound.playTerminalBeep();
      const countInterval = setInterval(() => {
        setMatchmakingCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countInterval);
            // Select random opponent
            const randOpp = OPPONENT_ROSTER[Math.floor(Math.random() * OPPONENT_ROSTER.length)];
            setSelectedOpponent(randOpp);
            startCombatSession();
            return 0;
          }
          sound.playTerminalBeep();
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countInterval);
    }
  }, [battleState]);

  // Turn timer during combat
  useEffect(() => {
    if (battleState === 'combat' && !isAnswerRevealed) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Trigger bot opponent answer logic
      const botDelay = Math.max(2500, selectedOpponent.avgAnswerTimeSec * 1000 * (0.8 + Math.random() * 0.4));
      botAnswerTimerRef.current = setTimeout(() => {
        handleBotAnswer();
      }, botDelay);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (botAnswerTimerRef.current) clearTimeout(botAnswerTimerRef.current);
      };
    }
  }, [battleState, currentQIndex, isAnswerRevealed]);

  const startMatchmaking = (mode: BattleMode) => {
    setSelectedMode(mode);
    setMatchmakingCountdown(3);
    setBattleState('matchmaking');
    sound.playWarp();
  };

  const startCombatSession = () => {
    setPlayerHp(100);
    setOpponentHp(100);
    setPlayerScore(0);
    setOpponentScore(0);
    setStreak(0);
    setHighestStreak(0);
    setCurrentQIndex(0);
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setTimeLeft(15);
    setCombatLog([
      `Match Initialized: [${user.callsign}] vs [${selectedOpponent.callsign}]`,
      `Protocol: ${selectedMode === 'quiz_duel' ? 'Speed Quiz Duel' : selectedMode === 'problem_race' ? 'Problem-Solving Relay' : 'Survival Sudden Death'}`,
      `System: All combat telemetry engaged. Prepare for Stage 1!`,
    ]);
    setBattleState('combat');
    sound.playLaser();
  };

  const handleBotAnswer = () => {
    if (isAnswerRevealed || battleState !== 'combat') return;
    const currentQ = questions[currentQIndex % questions.length];
    const isBotCorrect = Math.random() < selectedOpponent.accuracy;

    if (isBotCorrect) {
      const damage = 20;
      setPlayerHp((prev) => {
        const next = Math.max(0, prev - damage);
        if (next === 0) finishMatch(false);
        return next;
      });
      setOpponentScore((prev) => prev + currentQ.points);
      addCombatLog(`💥 ${selectedOpponent.callsign} landed a strike for ${damage} DMG!`);
      sound.playLaser();
    } else {
      addCombatLog(`🛡️ ${selectedOpponent.callsign} miscalculated the formula!`);
    }
  };

  const handleTimeExpired = () => {
    setIsAnswerRevealed(true);
    sound.playError();
    setStreak(0);
    setPlayerHp((prev) => {
      const next = Math.max(0, prev - 15);
      if (next === 0) finishMatch(false);
      return next;
    });
    addCombatLog(`⚠️ Time expired! System penalty: -15 HP.`);
    scheduleNextQuestion();
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerRevealed || battleState !== 'combat') return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (botAnswerTimerRef.current) clearTimeout(botAnswerTimerRef.current);

    setSelectedOption(idx);
    setIsAnswerRevealed(true);

    const currentQ = questions[currentQIndex % questions.length];
    const isCorrect = idx === currentQ.correctIndex;

    if (isCorrect) {
      sound.playSuccess();
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > highestStreak) setHighestStreak(newStreak);

      const multiplier = newStreak >= 3 ? 2.0 : newStreak >= 2 ? 1.5 : 1.0;
      const damage = Math.round(25 * multiplier);
      const pointsEarned = Math.round(currentQ.points * multiplier);

      setPlayerScore((prev) => prev + pointsEarned);
      setOpponentHp((prev) => {
        const next = Math.max(0, prev - damage);
        if (next === 0) finishMatch(true);
        return next;
      });

      addCombatLog(`🎯 [${user.callsign}] HIT! Correct calculation (${multiplier}x streak)! Opponent took ${damage} DMG!`);
    } else {
      sound.playError();
      setStreak(0);
      setPlayerHp((prev) => {
        const next = Math.max(0, prev - 20);
        if (next === 0) finishMatch(false);
        return next;
      });
      addCombatLog(`❌ [${user.callsign}] MISSED! Logic error. Incurred 20 DMG.`);
    }

    scheduleNextQuestion();
  };

  const scheduleNextQuestion = () => {
    setTimeout(() => {
      if (playerHp <= 0 || opponentHp <= 0) return;
      if (currentQIndex + 1 >= 5) {
        // Match completed after 5 rounds
        finishMatch(playerScore >= opponentScore);
      } else {
        setCurrentQIndex((prev) => prev + 1);
        setSelectedOption(null);
        setIsAnswerRevealed(false);
        setTimeLeft(15);
      }
    }, 2400);
  };

  const finishMatch = (playerWon: boolean) => {
    setBattleState('game_over');
    if (playerWon) {
      sound.playSuccess();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
      const xpGain = 450;
      const coinGain = 180;
      onUpdateUser({
        xp: user.xp + xpGain,
        coins: user.coins + coinGain,
        mastery: { ...user.mastery, combat: Math.min(100, user.mastery.combat + 4) },
      });
      addCombatLog(`🏆 VICTORY: [${user.callsign}] dominated the arena! +${xpGain} XP, +${coinGain} Coins.`);
    } else {
      sound.playError();
      const xpGain = 120;
      onUpdateUser({
        xp: user.xp + xpGain,
      });
      addCombatLog(`💀 DEFEAT: [${selectedOpponent.callsign}] claimed the round. Retrain at the department simulators.`);
    }
  };

  const addCombatLog = (msg: string) => {
    setCombatLog((prev) => [msg, ...prev.slice(0, 6)]);
  };

  // Generate dynamic AI challenge via server-side Gemini
  const fetchNewAiChallenge = async () => {
    setIsFetchingAiQuestion(true);
    try {
      const res = await fetch('/api/gemini/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Multi-Disciplinary Science & Mathematics',
          difficultyTier: user.rank,
          topic: 'High-Speed Academic Arena Combat',
        }),
      });
      const data = await res.json();
      if (data && data.question && data.options) {
        const dynamicQ: BattleQuestion = {
          id: `ai-gen-${Date.now()}`,
          department: 'arena',
          question: data.question,
          options: data.options,
          correctIndex: data.correctIndex || 0,
          explanation: data.explanation || 'Verified by ACADEMIX Gemini AI Core.',
          points: data.points || 200,
          category: data.intellectCategory || 'Quantum Arena',
          difficulty: user.rank,
        };
        setQuestions((prev) => [dynamicQ, ...prev]);
        addCombatLog(`🤖 Gemini AI synthesized a dynamic Grandmaster question!`);
        sound.playTerminalBeep();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingAiQuestion(false);
    }
  };

  const currentQ = questions[currentQIndex % questions.length];

  return (
    <div className="w-full flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Top Header / Arena Status Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 border border-rose-500/30 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400">
              <Swords className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-rose-400 font-bold">
                  Live Synchronized Network
                </span>
                <span className="px-2 py-0.5 text-[10px] bg-rose-500/20 text-rose-300 rounded-full font-mono">
                  Ranked Season 4
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">
                THE COLOSSEUM • ACADEMIC ARENA
              </h1>
              <p className="text-sm text-slate-300 max-w-xl">
                Engage in real-time academic duels, solve high-stakes scientific & computational puzzles against rivals, and climb the global leaderboards.
              </p>
            </div>
          </div>

          {/* Arena Stats Pill */}
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-mono text-slate-400">Combat Rating</span>
              <span className="text-sm font-bold text-rose-400 font-mono">1,840 MMR</span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-mono text-slate-400">Arena Tier</span>
              <span className="text-sm font-bold text-amber-400">{user.rank}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-t border-slate-800/80 pt-4 overflow-x-auto">
          {[
            { id: 'arena', label: 'Battle Floor', icon: Swords },
            { id: 'modes', label: 'Game Modes', icon: Zap },
            { id: 'leaderboard', label: 'Global Rankings', icon: Trophy },
            { id: 'history', label: 'Combat Protocol Logs', icon: Users },
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
                    ? 'bg-rose-500 text-slate-950 font-bold shadow-lg shadow-rose-500/20'
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

      {/* Main Tab Content */}
      {activeTab === 'arena' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Battle Panel (2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {battleState === 'lobby' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <h2 className="text-lg font-bold text-white font-display">Select Combat Engagement</h2>
                  </div>
                  <span className="text-xs font-mono text-cyan-400">4,280 Scholars In Orbit</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      id: 'quiz_duel',
                      title: 'Speed Quiz Duel',
                      desc: 'Rapid 1v1 turn combat. High-speed accuracy drains enemy shield.',
                      time: '15s / Question',
                      reward: '+350 XP',
                      badgeColor: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
                    },
                    {
                      id: 'problem_race',
                      title: 'Problem-Solving Relay',
                      desc: 'Multi-stage calculations across calculus, physics, and cryptography.',
                      time: '20s / Stage',
                      reward: '+450 XP',
                      badgeColor: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
                    },
                    {
                      id: 'survival_gauntlet',
                      title: 'Sudden Death Gauntlet',
                      desc: 'Zero tolerance for error. Single mistake triggers instant core wipe.',
                      time: '12s / Question',
                      reward: '+600 XP',
                      badgeColor: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
                    },
                  ].map((mode) => (
                    <div
                      key={mode.id}
                      onClick={() => setSelectedMode(mode.id as BattleMode)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        selectedMode === mode.id
                          ? 'border-rose-500 bg-rose-950/20 shadow-lg'
                          : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className={`inline-block px-2 py-0.5 text-[10px] font-mono rounded mb-2 border ${mode.badgeColor}`}>
                          {mode.reward}
                        </div>
                        <h3 className="font-bold text-white text-sm mb-1">{mode.title}</h3>
                        <p className="text-xs text-slate-400">{mode.desc}</p>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800">
                        <span>{mode.time}</span>
                        {selectedMode === mode.id && <span className="text-rose-400 font-bold">READY</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Match Launch Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} alt="User Avatar" className="w-10 h-10 rounded-full border border-rose-500/50" />
                    <div>
                      <div className="text-xs font-mono text-slate-400">Readying Player</div>
                      <div className="text-sm font-bold text-white">{user.callsign} ({user.rank})</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={fetchNewAiChallenge}
                      disabled={isFetchingAiQuestion}
                      className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Generate dynamic question via Gemini AI"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isFetchingAiQuestion ? 'Synthesizing...' : 'AI Question'}</span>
                    </button>
                    <button
                      onClick={() => startMatchmaking(selectedMode)}
                      className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Swords className="w-4 h-4" />
                      <span>INITIATE MATCHMAKING</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Matchmaking Overlay */}
            {battleState === 'matchmaking' && (
              <div className="bg-slate-900/95 border border-rose-500/40 rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-6 min-h-[420px] shadow-2xl">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center font-display font-extrabold text-3xl text-white">
                    {matchmakingCountdown}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-display">SEARCHING THE ARENA NETWORK</h3>
                  <p className="text-xs font-mono text-slate-400 mt-1">
                    Matching algorithms checking global MMR, ping parity, and academic rank...
                  </p>
                </div>
                <div className="flex items-center gap-4 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs font-mono text-rose-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Locating verified Scholar opponent in {selectedMode.toUpperCase()}</span>
                </div>
              </div>
            )}

            {/* Active Combat HUD */}
            {battleState === 'combat' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
                {/* Health & Score Display */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800">
                  {/* Player 1 (User) */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={user.avatar} alt="Avatar" className="w-7 h-7 rounded-full border border-cyan-400" />
                        <span className="text-xs font-bold text-white font-mono">{user.callsign}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-cyan-400">{playerHp} HP</span>
                    </div>
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 rounded-full"
                        style={{ width: `${playerHp}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Score: {playerScore} pts</span>
                      {streak > 1 && <span className="text-amber-400 font-bold">{streak}x Streak!</span>}
                    </div>
                  </div>

                  {/* Player 2 (Opponent) */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-rose-400">{opponentHp} HP</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">{selectedOpponent.callsign}</span>
                        <img src={selectedOpponent.avatar} alt="Avatar" className="w-7 h-7 rounded-full border border-rose-400" />
                      </div>
                    </div>
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-300 rounded-full"
                        style={{ width: `${opponentHp}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="text-slate-500">{selectedOpponent.house}</span>
                      <span>Score: {opponentScore} pts</span>
                    </div>
                  </div>
                </div>

                {/* Round Spec & Timer */}
                <div className="flex items-center justify-between bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">Round {currentQIndex + 1} of 5:</span>
                    <span className="text-xs font-bold text-cyan-400">{currentQ.category}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <Timer className={`w-4 h-4 ${timeLeft <= 5 ? 'text-red-400 animate-bounce' : 'text-slate-400'}`} />
                    <span className={`text-sm font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>
                      {timeLeft}s
                    </span>
                  </div>
                </div>

                {/* Current Question Display */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80">
                  <div className="text-sm md:text-base font-semibold text-slate-100 leading-relaxed">
                    {currentQ.question}
                  </div>
                </div>

                {/* Multiple Choice Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentQ.options.map((option, idx) => {
                    let optionStyle = 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-200';
                    if (isAnswerRevealed) {
                      if (idx === currentQ.correctIndex) {
                        optionStyle = 'border-emerald-500 bg-emerald-950/40 text-emerald-200 font-bold';
                      } else if (idx === selectedOption) {
                        optionStyle = 'border-rose-500 bg-rose-950/40 text-rose-200';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isAnswerRevealed}
                        onClick={() => handleSelectOption(idx)}
                        className={`p-3.5 rounded-xl border text-left text-xs md:text-sm transition-all flex items-start gap-3 cursor-pointer ${optionStyle} ${
                          !isAnswerRevealed ? 'active:scale-98' : ''
                        }`}
                      >
                        <span className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center font-mono text-xs font-bold text-slate-400 shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1">{option}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Reveal */}
                {isAnswerRevealed && (
                  <div className="p-4 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-xs text-slate-300">
                    <div className="font-bold text-cyan-400 font-mono mb-1">TACTICAL BREAKDOWN:</div>
                    <div>{currentQ.explanation}</div>
                  </div>
                )}
              </div>
            )}

            {/* Game Over Modal / Summary */}
            {battleState === 'game_over' && (
              <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-8 flex flex-col items-center text-center gap-6 shadow-2xl">
                <div className={`p-4 rounded-2xl ${playerScore >= opponentScore ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                  <Trophy className="w-12 h-12" />
                </div>

                <div>
                  <h2 className="text-2xl font-extrabold text-white font-display">
                    {playerScore >= opponentScore ? 'ACADEMIC VICTORY' : 'DEFEAT IN THE ARENA'}
                  </h2>
                  <p className="text-xs font-mono text-slate-400 mt-1">
                    {playerScore >= opponentScore
                      ? 'You successfully out-calculated your opponent and secured academy rating points!'
                      : 'Opponent gained superior precision. Review scientific formulas and re-enter.'}
                  </p>
                </div>

                {/* Score Recap Card */}
                <div className="grid grid-cols-3 gap-4 w-full max-w-md bg-slate-950 p-4 rounded-xl border border-slate-800 text-center font-mono">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Your Score</div>
                    <div className="text-lg font-bold text-cyan-400">{playerScore}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Enemy Score</div>
                    <div className="text-lg font-bold text-rose-400">{opponentScore}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Max Streak</div>
                    <div className="text-lg font-bold text-amber-400">{highestStreak}x</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setBattleState('lobby')}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Return to Lobby
                  </button>
                  <button
                    onClick={() => startMatchmaking(selectedMode)}
                    className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-rose-500/30 cursor-pointer"
                  >
                    Play Again
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Combat Telemetry & Opponent Dossier */}
          <div className="flex flex-col gap-6">
            {/* Live Combat Log Console */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-white font-mono uppercase">Arena Ticker</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="flex flex-col gap-2 min-h-[160px] font-mono text-[11px] text-slate-300">
                {combatLog.length === 0 ? (
                  <div className="text-slate-500 italic">No combat events recorded yet.</div>
                ) : (
                  combatLog.map((log, i) => (
                    <div key={i} className="p-2 rounded bg-slate-950/60 border border-slate-800/80 leading-relaxed">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Current Opponent Dossier */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-400">Opponent Dossier</span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded">
                  {selectedOpponent.rank}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={selectedOpponent.avatar}
                  alt={selectedOpponent.name}
                  className="w-12 h-12 rounded-xl object-cover border border-rose-500/40"
                />
                <div>
                  <div className="text-sm font-bold text-white">{selectedOpponent.name}</div>
                  <div className="text-xs font-mono text-cyan-400">{selectedOpponent.callsign}</div>
                  <div className="text-[11px] text-slate-400">{selectedOpponent.house} • Level {selectedOpponent.level}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div>
                  <div className="text-[10px] text-slate-500">Historical Accuracy</div>
                  <div className="font-bold text-emerald-400">{Math.round(selectedOpponent.accuracy * 100)}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Avg Solve Speed</div>
                  <div className="font-bold text-cyan-400">{selectedOpponent.avgAnswerTimeSec}s</div>
                </div>
              </div>
            </div>

            {/* Link Preview Quick Callout in Arena */}
            <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono text-indigo-300">
                <span className="font-bold">Arena Study Citation</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs text-slate-300">
                Need to sharpen your answers? Check out the peer-reviewed quantum research archives in the Link Preview System.
              </p>
              {onOpenLinkModal && (
                <button
                  onClick={() => onOpenLinkModal('https://nature.com')}
                  className="mt-1 text-xs text-cyan-400 hover:text-cyan-300 font-mono text-left underline cursor-pointer"
                >
                  Inspect Nature Journal Quantum Citation →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modes Tab */}
      {activeTab === 'modes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Speed Quiz Duel',
              rules: 'Timed 1v1 battle across 5 questions. Fast response times give up to 2.0x damage multipliers.',
              badge: 'Most Popular',
              color: 'border-rose-500/40 from-rose-950/30',
              icon: Zap,
              onClick: () => {
                setActiveTab('arena');
                setSelectedMode('quiz_duel');
              },
            },
            {
              title: 'Problem-Solving Relay Race',
              rules: 'Solve chained multi-part questions where your answer to Part 1 feeds into Part 2.',
              badge: 'Engineering Focus',
              color: 'border-violet-500/40 from-violet-950/30',
              icon: RefreshCw,
              onClick: () => {
                setActiveTab('arena');
                setSelectedMode('problem_race');
              },
            },
            {
              title: 'Survival Sudden Death',
              rules: 'Unforgiving gauntlet where one wrong answer knocks you out of the tournament bracket.',
              badge: 'High Stakes',
              color: 'border-amber-500/40 from-amber-950/30',
              icon: Shield,
              onClick: () => {
                setActiveTab('arena');
                setSelectedMode('survival_gauntlet');
              },
            },
          ].map((m, idx) => {
            const Icon = m.icon;
            return (
              <div
                key={idx}
                className={`p-6 rounded-2xl bg-gradient-to-b ${m.color} to-slate-900 border flex flex-col justify-between gap-4 shadow-xl`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded">
                      {m.badge}
                    </span>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-display mb-2">{m.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{m.rules}</p>
                </div>
                <button
                  onClick={m.onClick}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Select & Enter Arena</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white font-display">Colosseum Honor Roll</h2>
              <p className="text-xs text-slate-400">Global competitive rankings updated after every tournament</p>
            </div>
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 px-2">Rank</th>
                  <th className="pb-3 px-2">Scholar</th>
                  <th className="pb-3 px-2">House</th>
                  <th className="pb-3 px-2 text-right">Combat XP</th>
                  <th className="pb-3 px-2 text-right">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {[
                  { rank: 1, name: 'Valkyrie_Nova', callsign: 'TITAN_MIND', house: 'House Quantum', xp: '18,450', winRate: '94%' },
                  { rank: 2, name: 'Kenji_Cipher', callsign: 'MATRIX_ARCHITECT', house: 'House Turing', xp: '17,290', winRate: '91%' },
                  { rank: 3, name: 'Elena_Rostova', callsign: 'TEMPORAL_ECHO', house: 'House Alexandria', xp: '16,120', winRate: '88%' },
                  { rank: 4, name: 'Marcus_Aurelius_X', callsign: 'LEXICAL_STORM', house: 'House Babel', xp: '15,340', winRate: '85%' },
                  { rank: 5, name: user.name, callsign: user.callsign, house: user.house, xp: `${user.xp}`, winRate: '82%', isCurrent: true },
                ].map((row, i) => (
                  <tr
                    key={i}
                    className={`hover:bg-slate-800/40 transition-colors ${row.isCurrent ? 'bg-cyan-950/20 text-cyan-200 font-bold' : 'text-slate-300'}`}
                  >
                    <td className="py-3 px-2">#{row.rank}</td>
                    <td className="py-3 px-2 font-sans font-bold">{row.callsign} <span className="text-slate-500 font-normal">({row.name})</span></td>
                    <td className="py-3 px-2 text-slate-400">{row.house}</td>
                    <td className="py-3 px-2 text-right text-rose-400">{row.xp}</td>
                    <td className="py-3 px-2 text-right text-emerald-400">{row.winRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History / Logs Tab */}
      {activeTab === 'history' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <h2 className="text-lg font-bold text-white font-display">Recent Duel Protocol Transcripts</h2>
          <div className="flex flex-col gap-3 font-mono text-xs">
            {[
              { id: 'REC-901', vs: 'Valkyrie_Nova', result: 'Victory', score: '580 - 450', time: '14 mins ago' },
              { id: 'REC-900', vs: 'Kenji_Cipher', result: 'Victory', score: '620 - 590', time: '1 hour ago' },
              { id: 'REC-899', vs: 'Elena_Rostova', result: 'Defeat', score: '380 - 480', time: '3 hours ago' },
            ].map((match, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block">{match.id} • {match.time}</span>
                  <span className="font-bold text-white">vs. {match.vs}</span>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${match.result === 'Victory' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {match.result}
                  </span>
                  <span className="text-[11px] text-slate-400 block">{match.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
