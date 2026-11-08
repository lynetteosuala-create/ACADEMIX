export type DepartmentId = 'science' | 'math' | 'history' | 'literature' | 'arena';

export type UserRole = 'student' | 'teacher';

export type RankTier = 'Cadet' | 'Scholar' | 'Archon' | 'Grandmaster';

export type AcademyHouse = 'House Quantum' | 'House Turing' | 'House Alexandria' | 'House Babel';

export interface UserProfile {
  id: string;
  name: string;
  callsign: string;
  avatar: string;
  role: UserRole;
  rank: RankTier;
  level: number;
  xp: number;
  xpToNextLevel: number;
  house: AcademyHouse;
  coins: number;
  mastery: {
    science: number; // 0 - 100
    math: number;
    history: number;
    literature: number;
    combat: number;
  };
  badges: Badge[];
  streakDays: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  department: DepartmentId | 'global';
  unlockedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface DepartmentInfo {
  id: DepartmentId;
  name: string;
  tagline: string;
  description: string;
  professorName: string;
  professorTitle: string;
  professorAvatar: string;
  color: string;
  accentBorder: string;
  portalPosition: [number, number, number];
  iconName: string;
}

export interface AcademicMission {
  id: string;
  department: DepartmentId;
  title: string;
  description: string;
  objective: string;
  xpReward: number;
  coinReward: number;
  difficulty: 'Cadet' | 'Scholar' | 'Archon';
  completed: boolean;
  type: 'daily' | 'weekly' | 'special';
  links?: string[];
}

export interface BattleQuestion {
  id: string;
  department: DepartmentId;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  points: number;
  category: string;
  difficulty: RankTier;
}

export interface ExamSession {
  id: string;
  department: DepartmentId;
  title: string;
  totalTimeMinutes: number;
  questions: BattleQuestion[];
  passingScore: number;
}

export interface ExamResult {
  examId: string;
  title: string;
  department: DepartmentId;
  score: number;
  totalQuestions: number;
  correctCount: number;
  percentage: number;
  passed: boolean;
  timestamp: string;
  feedback: string;
  answers: { questionIndex: number; selectedIndex: number; isCorrect: boolean }[];
}

export interface LinkPreviewData {
  url: string;
  domain: string;
  title: string;
  description: string;
  image: string;
  favicon: string;
  siteName: string;
  author?: string;
  sharedBy?: string;
  votes?: number;
  tags?: string[];
  department?: DepartmentId;
}

export interface ChatMessage {
  id: string;
  sender: string;
  role: 'student' | 'teacher' | 'ai' | 'system';
  avatar?: string;
  content: string;
  timestamp: string;
  department?: DepartmentId;
  detectedUrls?: string[];
}
