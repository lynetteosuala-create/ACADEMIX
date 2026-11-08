import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Coins,
  ShoppingBag,
  Wallet,
  History,
  Lock,
  Unlock,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Award,
  Crown,
  Layers,
  Flame,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { sound } from '../../utils/audio';

export interface MarketItem {
  id: string;
  title: string;
  description: string;
  cost: number;
  category: 'level' | 'environment' | 'avatar' | 'trophy';
  image: string;
  badge: string;
  perks: string[];
}

export const MARKET_ITEMS: MarketItem[] = [
  // Levels
  {
    id: 'lvl-quantum-overdrive',
    title: 'Level 15: Quantum Plasma Overdrive',
    description: 'Permanently unlocks high-order tokamak stability challenges and advanced antimatter fusion mechanics.',
    cost: 500,
    category: 'level',
    image: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600&auto=format&fit=crop&q=80',
    badge: 'Core Curriculum',
    perks: ['+25% Mission XP Multiplier', 'Access to Antimatter Inversion Reactor', 'Senior Scholar Department Badge'],
  },
  {
    id: 'lvl-non-euclidean',
    title: 'Level 20: Non-Euclidean Manifold Topology',
    description: 'Unlock 5-dimensional stereographic projections, Ricci flow calculations, and advanced matrix cryptography.',
    cost: 850,
    category: 'level',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    badge: 'Advanced Matrix',
    perks: ['5D Tesseract Visualizer Mode', 'Automated Eigenvalue Proof Solver', 'Archon Status Eligibility'],
  },
  // Special Environments
  {
    id: 'env-antimatter-void',
    title: 'Deep Space Antimatter Chamber',
    description: 'A special zero-gravity observatory floating in lunar orbit, optimized for particle astrophysics.',
    cost: 650,
    category: 'environment',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    badge: '3D Simulation Environment',
    perks: ['Zero-G Orbital Visual Backdrop', 'Solar Flare Radiation Simulation', 'Cosmic Ray Telescope Access'],
  },
  {
    id: 'env-chronos-core',
    title: 'Chronos Temporal Vault Core',
    description: 'A private subterranean chamber in the Chronos Observatory with high-density archaeological holo-displays.',
    cost: 700,
    category: 'environment',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    badge: '3D Archive Chamber',
    perks: ['Full Epigraphic Papyrus Archive', 'Satellite Topographic Scan Beam', 'Historical AI Re-enactment Sandbox'],
  },
  // Avatar Customization
  {
    id: 'avatar-cyber-visor',
    title: 'Holographic Quantum Visor',
    description: 'Sleek neon-cyan ocular telemetry visor displayed on your student profile and arena matches.',
    cost: 300,
    category: 'avatar',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    badge: 'Cosmetic Relic',
    perks: ['Custom Arena Intro Animation', 'Cyan Profile Border Glow', 'HUD Telemetry Cosmetic'],
  },
  {
    id: 'avatar-archon-cloak',
    title: 'Archon Nebula Particle Cloak',
    description: 'Flowing cosmic particle aura that trails behind your cursor and profile avatar in campus spaces.',
    cost: 550,
    category: 'avatar',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    badge: 'Cosmetic Relic',
    perks: ['Golden Particle Trail Aura', 'Exclusive Archon Title Tag', 'Prestige Colosseum Banner'],
  },
  // Virtual Trophies
  {
    id: 'trophy-newton-apple',
    title: 'Newton’s Golden Apple of Gravitation',
    description: 'Virtual trophy commemorating classical mechanics mastery. Displayed in your personal trophy case.',
    cost: 400,
    category: 'trophy',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    badge: 'Academy Relic',
    perks: ['Showcase on Public Profile', '+50 Permanent Max XP Pool', 'House Glory Contribution'],
  },
  {
    id: 'trophy-turing-enigma',
    title: 'Turing Enigma Cryptographic Rotor',
    description: 'Virtual trophy commemorating the decipherment of mathematical encryption lattices.',
    cost: 600,
    category: 'trophy',
    image: 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=600&auto=format&fit=crop&q=80',
    badge: 'Academy Relic',
    perks: ['Showcase on Public Profile', 'Turing House Special Citation', 'Algorithmic Speed Boost'],
  },
];

interface EconomyMarketplaceModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
}

export const EconomyMarketplaceModal: React.FC<EconomyMarketplaceModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState<'market' | 'wallet' | 'transactions'>('market');
  const [marketFilter, setMarketFilter] = useState<'all' | 'level' | 'environment' | 'avatar' | 'trophy'>('all');
  const [unlockedItemIds, setUnlockedItemIds] = useState<Set<string>>(new Set(['item-avatar-default']));
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [recentPurchase, setRecentPurchase] = useState<MarketItem | null>(null);

  // Sync wallet from server
  const fetchWallet = async () => {
    try {
      const res = await fetch(`/api/economy/wallet?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setUnlockedItemIds(new Set(data.unlockedItems || []));
        setTransactions(data.transactions || []);
        if (data.balance !== undefined && data.balance !== user.coins) {
          onUpdateUser({ coins: data.balance });
        }
      }
    } catch (e) {
      console.error('Wallet fetch error:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWallet();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePurchase = async (item: MarketItem) => {
    if (user.coins < item.cost) {
      sound.playError();
      setPurchaseError(`Insufficient Academix Coins. You have ${user.coins} AC, but this requires ${item.cost} AC.`);
      setTimeout(() => setPurchaseError(null), 3500);
      return;
    }

    if (unlockedItemIds.has(item.id)) {
      return;
    }

    setIsPurchasing(item.id);
    setPurchaseError(null);

    try {
      const res = await fetch('/api/economy/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          itemId: item.id,
          cost: item.cost,
          title: item.title,
          category: item.category,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sound.playSuccess();
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}

        setUnlockedItemIds(new Set(data.unlockedItemIds));
        setTransactions((prev) => [data.transaction, ...prev]);
        onUpdateUser({ coins: data.newBalance });
        setRecentPurchase(item);
      } else {
        sound.playError();
        setPurchaseError(data.error || 'Transaction rejected by academy bank arbiter.');
      }
    } catch {
      sound.playError();
      setPurchaseError('Network communication error during transaction validation.');
    } finally {
      setIsPurchasing(null);
    }
  };

  const filteredItems = MARKET_ITEMS.filter((item) => {
    if (marketFilter === 'all') return true;
    return item.category === marketFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header / Balance Bar */}
        <div className="p-6 bg-gradient-to-r from-amber-950/70 via-slate-900 to-indigo-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-500/60 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
              <Coins className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                  Virtual Currency System
                </span>
                <span className="px-2 py-0.5 text-[9px] bg-amber-500/20 text-amber-300 rounded font-mono">
                  100% In-Game Currency • No Real Money
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white font-display">
                ACADEMIX VIRTUAL REWARDS & WALLET
              </h1>
            </div>
          </div>

          {/* Student Balance Gauge */}
          <div className="flex items-center gap-4 bg-slate-950/90 border border-amber-500/40 px-5 py-2.5 rounded-2xl shadow-xl">
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Personal Wallet Balance</span>
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-xl md:text-2xl font-black text-amber-400 font-mono">
                  {user.coins.toLocaleString()}
                </span>
                <span className="text-xs font-mono font-bold text-amber-500">AC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            {[
              { id: 'market', label: 'Rewards Marketplace', icon: ShoppingBag },
              { id: 'wallet', label: 'Student Wallet & Unlocks', icon: Wallet },
              { id: 'transactions', label: 'Transaction Ledger', icon: History },
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
                  className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    isActive
                      ? 'border-amber-400 text-amber-400 bg-amber-500/10'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={onClose}
            className="text-xs font-mono text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕ Close
          </button>
        </div>

        {/* Error Banner */}
        {purchaseError && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-950/60 border border-rose-500/50 rounded-xl flex items-center gap-3 text-xs text-rose-300 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{purchaseError}</span>
          </div>
        )}

        {/* Confirmation Modal when Purchase Succeeds */}
        {recentPurchase && (
          <div className="mx-6 mt-4 p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl flex items-center justify-between gap-4 text-xs text-emerald-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-white block">Unlocked Successfully: {recentPurchase.title}</span>
                <span className="text-[11px] text-emerald-300 font-mono">
                  Deducted {recentPurchase.cost} AC. Remaining balance: {user.coins} AC. Permanently bound to your dossier.
                </span>
              </div>
            </div>
            <button
              onClick={() => setRecentPurchase(null)}
              className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[11px] font-mono cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: Rewards Marketplace */}
          {activeTab === 'market' && (
            <div className="flex flex-col gap-6">
              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {[
                    { id: 'all', label: 'All Rewards' },
                    { id: 'level', label: 'Curriculum Levels' },
                    { id: 'environment', label: '3D Environments' },
                    { id: 'avatar', label: 'Avatar Customization' },
                    { id: 'trophy', label: 'Trophies & Relics' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        sound.playClick();
                        setMarketFilter(f.id as any);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                        marketFilter === f.id
                          ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Server-Authoritative Ledger Active</span>
                </div>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => {
                  const isUnlocked = unlockedItemIds.has(item.id);
                  const canAfford = user.coins >= item.cost;
                  const isLoading = isPurchasing === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between shadow-xl ${
                        isUnlocked
                          ? 'border-emerald-500/40 bg-slate-950/70'
                          : 'border-slate-800 bg-slate-900/90 hover:border-amber-500/40'
                      }`}
                    >
                      {/* Image header */}
                      <div className="relative h-40 w-full overflow-hidden bg-slate-950">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                        {/* Category Badge */}
                        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-slate-950/90 border border-slate-700 text-[10px] font-mono text-amber-300 uppercase">
                          {item.badge}
                        </div>

                        {/* Cost / Unlocked Status Badge */}
                        <div className="absolute top-3 right-3">
                          {isUnlocked ? (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs font-mono font-bold">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>UNLOCKED</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold">
                              <Coins className="w-3.5 h-3.5 text-amber-400" />
                              <span>{item.cost} AC</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-white line-clamp-1">{item.title}</h3>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>

                          {/* Perks List */}
                          <div className="mt-3 flex flex-col gap-1">
                            {item.perks.map((perk, pIdx) => (
                              <div key={pIdx} className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300">
                                <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                                <span>{perk}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Unlock Button */}
                        <div className="pt-3 border-t border-slate-800">
                          {isUnlocked ? (
                            <button
                              disabled
                              className="w-full py-2.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-default"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>PERMANENTLY ACTIVE</span>
                            </button>
                          ) : (
                            <button
                              disabled={!canAfford || isLoading}
                              onClick={() => handlePurchase(item)}
                              className={`w-full py-2.5 rounded-xl font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                canAfford
                                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-98'
                                  : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              {isLoading ? (
                                <span>VALIDATING ARBITER...</span>
                              ) : (
                                <>
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>{canAfford ? `UNLOCK FOR ${item.cost} AC` : 'INSUFFICIENT COINS'}</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Personal Student Wallet & Unlocked Inventory */}
          {activeTab === 'wallet' && (
            <div className="flex flex-col gap-6">
              {/* Wallet Summary Card */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 border border-amber-500/40 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-400">
                    <Wallet className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-amber-400 uppercase font-bold">Student Dossier Wallet</span>
                    <h2 className="text-xl font-bold text-white">{user.callsign} ({user.name})</h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      House: {user.house} • Rank: {user.rank} • Level {user.level}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-center font-mono">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 min-w-[120px]">
                    <span className="text-[10px] text-slate-500 uppercase">Available AC</span>
                    <div className="text-2xl font-black text-amber-400 mt-1">{user.coins.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 min-w-[120px]">
                    <span className="text-[10px] text-slate-500 uppercase">Permanent Unlocks</span>
                    <div className="text-2xl font-black text-emerald-400 mt-1">{unlockedItemIds.size}</div>
                  </div>
                </div>
              </div>

              {/* How to Earn More Coins Guide */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
                <span className="text-xs font-mono uppercase text-cyan-400 font-bold">Ways to Earn Academix Coins</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-amber-400 font-bold mb-1">+180 AC</div>
                    <div className="text-white">Multiplayer Arena Duels</div>
                    <div className="text-[11px] text-slate-500">Won competitive arena matches</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-amber-400 font-bold mb-1">+120 AC</div>
                    <div className="text-white">Academic Daily Missions</div>
                    <div className="text-[11px] text-slate-500">Completing department tasks</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-amber-400 font-bold mb-1">+250 AC</div>
                    <div className="text-white">Passing Proctored Exams</div>
                    <div className="text-[11px] text-slate-500">Department board certifications</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-amber-400 font-bold mb-1">+150 AC</div>
                    <div className="text-white">Citing Academic Links</div>
                    <div className="text-[11px] text-slate-500">Adding resources to link vault</div>
                  </div>
                </div>
              </div>

              {/* Unlocked Inventory List */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">Permanently Unlocked Inventory</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Array.from(unlockedItemIds).map((id) => {
                    const matchedItem = MARKET_ITEMS.find((m) => m.id === id);
                    if (!matchedItem) {
                      return (
                        <div key={id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                          <span>Standard Academy Scholar Kit ({id})</span>
                          <span className="text-emerald-400">ACTIVE</span>
                        </div>
                      );
                    }

                    return (
                      <div key={id} className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center gap-3">
                        <img src={matchedItem.image} alt={matchedItem.title} className="w-12 h-12 rounded-lg object-cover" />
                        <div className="flex-1">
                          <span className="text-[10px] font-mono text-emerald-400 uppercase">{matchedItem.badge}</span>
                          <div className="text-xs font-bold text-white">{matchedItem.title}</div>
                        </div>
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Transaction Ledger */}
          {activeTab === 'transactions' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase">Audited In-Game Transaction Ledger</h3>
                  <p className="text-xs text-slate-400">Chronological history of all earned rewards and marketplace unlock expenditures</p>
                </div>
                <span className="text-xs font-mono text-amber-400">{transactions.length} Records</span>
              </div>

              <div className="flex flex-col gap-2">
                {transactions.length === 0 ? (
                  <div className="p-8 text-center text-xs font-mono text-slate-500">
                    No ledger transactions logged yet. Complete missions or arena battles to begin earning Academix Coins!
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${tx.type === 'earn' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {tx.type === 'earn' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <span className="font-bold text-white block">{tx.description}</span>
                          <span className="text-[10px] text-slate-500">{tx.timestamp} • Protocol ID: {tx.id}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-sm font-bold block ${tx.type === 'earn' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tx.type === 'earn' ? `+${tx.amount} AC` : `-${tx.amount} AC`}
                        </span>
                        <span className="text-[10px] text-slate-500">Balance: {tx.balanceAfter} AC</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>ACADEMIX VIRTUAL ECONOMY PROTOCOL • NO REAL CURRENCY</span>
          <span>PERMANENT BLOCKCHAIN-STYLE LOCAL AUDITING</span>
        </div>
      </div>
    </div>
  );
};
