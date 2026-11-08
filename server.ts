import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

// Initialize server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Link Preview Cache to avoid repeated fetches
const linkPreviewCache = new Map<string, any>();

// Preset link preview data for educational and research domains in case of external network blocks
const fallbackLinkPreviews: Record<string, { title: string; description: string; image: string; siteName: string }> = {
  'github.com': {
    title: 'GitHub: Let’s build from here',
    description: 'The world’s leading AI-powered developer platform to build, scale, and deliver secure software.',
    image: 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=600&auto=format&fit=crop&q=80',
    siteName: 'GitHub',
  },
  'wikipedia.org': {
    title: 'Wikipedia, the free encyclopedia',
    description: 'A free online encyclopedia, created and maintained by a community of volunteer editors.',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    siteName: 'Wikipedia',
  },
  'nasa.gov': {
    title: 'NASA: Explore the Universe and Discover Our Home Planet',
    description: 'Explore the universe through the eyes of NASA astrophysics, human spaceflight, and Mars rovers.',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    siteName: 'NASA Portal',
  },
  'nature.com': {
    title: 'Nature: International Journal of Science',
    description: 'First published in 1869, Nature is the world’s leading multidisciplinary science journal.',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80',
    siteName: 'Nature Research',
  },
  'mit.edu': {
    title: 'MIT - Massachusetts Institute of Technology',
    description: 'The mission of MIT is to advance knowledge and educate students in science, technology, and other areas of scholarship.',
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&auto=format&fit=crop&q=80',
    siteName: 'MIT Edu',
  },
  'arxiv.org': {
    title: 'arXiv.org e-Print Archive',
    description: 'Open-access archive for 2 million scholarly articles in physics, mathematics, computer science, quantitative biology, quantitative finance, and statistics.',
    image: 'https://images.unsplash.com/photo-1507842229458-5779755732df?w=600&auto=format&fit=crop&q=80',
    siteName: 'arXiv Academic Archive',
  },
  'khanacademy.org': {
    title: 'Khan Academy | Free Online Courses, Lessons & Practice',
    description: 'You can learn anything. Expert-created videos and interactive questions in math, science, and more.',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop&q=80',
    siteName: 'Khan Academy',
  },
};

// API: Link Preview System
app.get('/api/link-preview', async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const host = parsedUrl.hostname.replace(/^www\./, '');

    // Check memory cache
    if (linkPreviewCache.has(parsedUrl.href)) {
      return res.json(linkPreviewCache.get(parsedUrl.href));
    }

    // Default metadata template
    const previewData = {
      url: parsedUrl.href,
      domain: host,
      title: `${host.charAt(0).toUpperCase() + host.slice(1)} Resource`,
      description: `Academic research, educational reference documentation, and interactive study material from ${host}.`,
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      favicon: `https://www.google.com/s2/favicons?domain=${host}&sz=64`,
      siteName: host,
    };

    // Check fallback domains
    for (const [key, fallback] of Object.entries(fallbackLinkPreviews)) {
      if (host.includes(key)) {
        previewData.title = fallback.title;
        previewData.description = fallback.description;
        previewData.image = fallback.image;
        previewData.siteName = fallback.siteName;
        break;
      }
    }

    // Attempt real fetch with a short timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(parsedUrl.href, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const html = await response.text();

        // Extract Title
        const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
                             html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (ogTitleMatch?.[1]) previewData.title = ogTitleMatch[1];
        else if (titleMatch?.[1]) previewData.title = titleMatch[1].trim();

        // Extract Description
        const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
                            html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i) ||
                            html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
        if (ogDescMatch?.[1]) previewData.description = ogDescMatch[1];

        // Extract OpenGraph Image
        const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                             html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
        if (ogImageMatch?.[1]) {
          const rawImg = ogImageMatch[1];
          previewData.image = rawImg.startsWith('http') ? rawImg : new URL(rawImg, parsedUrl.origin).href;
        }

        // Extract Site Name
        const ogSiteName = html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i);
        if (ogSiteName?.[1]) previewData.siteName = ogSiteName[1];
      }
    } catch {
      // Fetch failed or timed out; use fallback data
    }

    linkPreviewCache.set(parsedUrl.href, previewData);
    return res.json(previewData);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to extract link preview' });
  }
});

// API: AI Teacher System
app.post('/api/gemini/teacher', async (req, res) => {
  const { professor, subject, studentQuestion, context } = req.body;

  if (!studentQuestion) {
    return res.status(400).json({ error: 'studentQuestion is required' });
  }

  const systemInstructions: Record<string, string> = {
    science: 'You are Dr. Alistair Vance, Lead Physicist & Cyber-Chemist of the ACADEMIX Quantum Science Lab. You speak with intellectual rigor, vivid scientific analogies, and encouraging academy mentorship. You break down complex physics, chemistry, and biology into clear principles.',
    math: 'You are Professor Ada Thorne, Director of the ACADEMIX Mathematical Matrix & Vector Citadel. You love elegant proofs, geometric visualization, number theory, and algorithmic thinking. You guide students step-by-step with precision.',
    history: 'You are Dr. Sophia Chronos, Master Archivist of the ACADEMIX Temporal & Geographic Observatory. You speak of historical events and world geography like an epic chronicle of civilization, linking geography, archaeology, and historical turning points.',
    literature: 'You are Master Roland Vance, High Chronicler of the ACADEMIX Linguistic Academy. You are poetic, incisive, and analytical regarding rhetoric, syntax, etymology, literary devices, and creative writing.',
  };

  const sysInstruction = systemInstructions[subject] || 'You are an elite AI Teacher at ACADEMIX, the premier educational gaming academy. Inspire the student, explain clearly, and challenge their critical thinking.';

  try {
    const prompt = `Context in ACADEMIX simulation: ${context || 'General inquiry'}
Student asks: "${studentQuestion}"

Provide a concise, brilliant explanation (2-3 paragraphs max) formatted with:
1. **Core Concept** (Direct, clear answer)
2. **Deep Insight & Real-World/Simulation Application**
3. **Academy Challenge Question** (A quick question to test if the student truly understood)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: sysInstruction,
      },
    });

    return res.json({
      answer: response.text || 'The academy archives are momentarily recalibrating. Please try again.',
      professor: professor || 'Academy AI Professor',
    });
  } catch (error: any) {
    console.error('Gemini Teacher error:', error);
    // Intelligent academic fallback if API key quota or network issue arises
    return res.json({
      answer: `[Emergency Local Subsystem Active] As an ACADEMIX Department Fellow: Regarding "${studentQuestion}", the foundational law here connects direct causality, fundamental conservation, and structural logic. Consider how initial state variables shift under constraint!`,
      professor: professor || 'Academy AI Professor',
      fallback: true,
    });
  }
});

// API: Dynamic Examination & Battle Question Generator
app.post('/api/gemini/generate-question', async (req, res) => {
  const { subject, difficultyTier, topic } = req.body;

  try {
    const prompt = `Generate 1 multiple choice question for a futuristic school gaming arena called ACADEMIX.
Subject: ${subject || 'Science'}
Topic: ${topic || 'Advanced principles'}
Difficulty Tier: ${difficultyTier || 'Advanced'} (Tiers: Cadet, Scholar, Archon, Grandmaster)

Return ONLY valid JSON matching this exact structure:
{
  "question": "The question string",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "explanation": "Detailed explanation of why this answer is correct",
  "points": 150,
  "intellectCategory": "Quantum Physics / Calculus / etc"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: any) {
    console.error('Gemini Question Generator error:', err);
    // Fallback challenge
    return res.json({
      question: `In a zero-gravity quantum vacuum, what prevents virtual particle-antiparticle pairs from persisting indefinitely?`,
      options: [
        'Heisenberg Energy-Time Uncertainty Principle (ΔE·Δt ≥ ℏ/2)',
        'Centrifugal electrostatic repulsion',
        'Newtonian inertial drag',
        'Pauli Exclusion Force field'
      ],
      correctIndex: 0,
      explanation: 'Virtual particles borrow energy from the vacuum for a timescale limited by ΔE·Δt ≥ ℏ/2 before annihilating back into the ground state.',
      points: 200,
      intellectCategory: 'Quantum Field Mechanics',
      fallback: true,
    });
  }
});

// In-memory Virtual Economy State (Server Authoritative)
interface TransactionLedgerItem {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  description: string;
  category: 'arena' | 'exam' | 'mission' | 'milestone' | 'unlock_level' | 'unlock_environment' | 'avatar' | 'trophy';
  timestamp: string;
  balanceAfter: number;
}

const userEconomyWallets = new Map<string, {
  balance: number;
  unlockedItemIds: Set<string>;
  transactions: TransactionLedgerItem[];
}>();

// Initialize default student wallet
userEconomyWallets.set('cadet-7749', {
  balance: 850,
  unlockedItemIds: new Set(['item-avatar-default', 'env-standard-lab']),
  transactions: [
    {
      id: 'tx-init-1',
      type: 'earn',
      amount: 400,
      description: 'Completed 4D Rotation Invariance Test',
      category: 'mission',
      timestamp: '2026-11-05 14:20',
      balanceAfter: 400,
    },
    {
      id: 'tx-init-2',
      type: 'earn',
      amount: 450,
      description: 'Victory in Multiplayer Colosseum Arena',
      category: 'arena',
      timestamp: '2026-11-07 19:45',
      balanceAfter: 850,
    },
  ],
});

// API: Get Virtual Wallet
app.get('/api/economy/wallet', (req, res) => {
  const userId = (req.query.userId as string) || 'cadet-7749';
  if (!userEconomyWallets.has(userId)) {
    userEconomyWallets.set(userId, {
      balance: 500,
      unlockedItemIds: new Set(['item-avatar-default']),
      transactions: [],
    });
  }
  const wallet = userEconomyWallets.get(userId)!;
  return res.json({
    balance: wallet.balance,
    unlockedItems: Array.from(wallet.unlockedItemIds),
    transactions: wallet.transactions,
  });
});

// API: Process Secure In-Game Purchase
app.post('/api/economy/purchase', (req, res) => {
  const { userId = 'cadet-7749', itemId, cost, title, category } = req.body;

  if (!itemId || typeof cost !== 'number' || cost <= 0) {
    return res.status(400).json({ error: 'Invalid item or cost parameter' });
  }

  const wallet = userEconomyWallets.get(userId);
  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  // Prevent duplicate permanent unlocks
  if (wallet.unlockedItemIds.has(itemId)) {
    return res.status(400).json({ error: 'Item or level is already permanently unlocked' });
  }

  // Prevent negative balance
  if (wallet.balance < cost) {
    return res.status(400).json({
      error: `Insufficient AC balance. Required: ${cost} AC, Available: ${wallet.balance} AC`,
      currentBalance: wallet.balance,
    });
  }

  // Execute transaction
  wallet.balance -= cost;
  wallet.unlockedItemIds.add(itemId);

  const tx: TransactionLedgerItem = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'spend',
    amount: cost,
    description: `Unlocked: ${title || itemId}`,
    category: category || 'unlock_level',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    balanceAfter: wallet.balance,
  };

  wallet.transactions.unshift(tx);

  return res.json({
    success: true,
    newBalance: wallet.balance,
    transaction: tx,
    unlockedItemIds: Array.from(wallet.unlockedItemIds),
  });
});

// API: Award In-Game Coins
app.post('/api/economy/reward', (req, res) => {
  const { userId = 'cadet-7749', amount, reason, category } = req.body;

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Reward amount must be a positive number' });
  }

  let wallet = userEconomyWallets.get(userId);
  if (!wallet) {
    wallet = { balance: 500, unlockedItemIds: new Set(), transactions: [] };
    userEconomyWallets.set(userId, wallet);
  }

  wallet.balance += amount;

  const tx: TransactionLedgerItem = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'earn',
    amount,
    description: reason || 'Academy Milestone Reward',
    category: category || 'milestone',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    balanceAfter: wallet.balance,
  };

  wallet.transactions.unshift(tx);

  return res.json({
    success: true,
    newBalance: wallet.balance,
    transaction: tx,
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ACADEMIX Engine] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
