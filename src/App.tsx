import { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  AlertTriangle,
  BookOpen,
  Check,
  Eye,
  Layers,
  LogIn,
  Pause,
  Play,
  RotateCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trophy,
  Volume2,
  VolumeX,
  ZoomIn,
} from 'lucide-react';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ManualModal } from './components/ManualModal';
import { RoundModal } from './components/RoundModal';
import {
  computeOfficerRank,
  generateLuggageBatch,
  getLevelConfig,
} from './data/itemsAndLevels';
import { auth, signInWithGoogle, syncRunAndLeaderboard } from './firebase';
import type {
  DecisionAction,
  GameState,
  LevelStats,
  LuggageCase,
  PackedItem,
  PlayerCareerLocal,
  XRayFilterMode,
} from './types/game';
import { soundEngine } from './utils/sound';
import {
  drawAirportConveyorStage,
  findHoveredItem,
  type BoxRect,
  type Particle,
  type StampEffect,
} from './utils/xrayRenderer';

const BACKDROP_URL = '/src/assets/images/airport_terminal_backdrop_1795429517650.jpg';
const BADGE_URL = '/assets/aistudio/imagesLogo_70f43be5.png';
const CAREER_STORAGE_KEY = 'aeroguard_career_v1';

function loadLocalCareer(): PlayerCareerLocal {
  try {
    const raw = localStorage.getItem(CAREER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PlayerCareerLocal>;
      return {
        bestScore: typeof parsed.bestScore === 'number' ? parsed.bestScore : 0,
        highestLevel: typeof parsed.highestLevel === 'number' ? parsed.highestLevel : 1,
        bestAccuracy: typeof parsed.bestAccuracy === 'number' ? parsed.bestAccuracy : 0,
        totalBagsCleared:
          typeof parsed.totalBagsCleared === 'number' ? parsed.totalBagsCleared : 0,
        totalContrabandCaught:
          typeof parsed.totalContrabandCaught === 'number'
            ? parsed.totalContrabandCaught
            : 0,
        unlockedAchievements: Array.isArray(parsed.unlockedAchievements)
          ? parsed.unlockedAchievements
          : [],
        officerName:
          typeof parsed.officerName === 'string' && parsed.officerName.trim()
            ? parsed.officerName
            : 'Cán bộ An ninh',
      };
    }
  } catch {
    // ignore storage errors
  }
  return {
    bestScore: 0,
    highestLevel: 1,
    bestAccuracy: 0,
    totalBagsCleared: 0,
    totalContrabandCaught: 0,
    unlockedAchievements: [],
    officerName: 'Cán bộ An ninh',
  };
}

function saveLocalCareer(career: PlayerCareerLocal) {
  try {
    localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(career));
  } catch {
    // ignore
  }
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [user, setUser] = useState<User | null>(null);
  const [career, setCareer] = useState<PlayerCareerLocal>(() => loadLocalCareer());
  const [muted, setMuted] = useState<boolean>(() => soundEngine.isMuted());

  // Modals
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showManual, setShowManual] = useState(false);

  // Active gameplay HUD state
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [integrity, setIntegrity] = useState(3);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(95);
  const [bagIndex, setBagIndex] = useState(0);
  const [bagTotal, setBagTotal] = useState(8);
  const [currentBagMeta, setCurrentBagMeta] = useState<{
    tagCode: string;
    origin: string;
    flightCode: string;
    hasFoil: boolean;
  } | null>(null);

  // X-Ray workstation controls
  const [filterMode, setFilterMode] = useState<XRayFilterMode>('MULTI');
  const [isSecondary, setIsSecondary] = useState(false);
  const [sideView, setSideView] = useState(false);
  const [peeledTopLayer, setPeeledTopLayer] = useState(false);
  const [loupeActive, setLoupeActive] = useState(false);
  const [inspectedItem, setInspectedItem] = useState<PackedItem | null>(null);

  // Feedback banner & stats
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'warn' | 'danger' | 'info';
    text: string;
  } | null>(null);
  const [lastLevelStats, setLastLevelStats] = useState<LevelStats | null>(null);
  const [newlyUnlockedIds, setNewlyUnlockedIds] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Overall run accumulators
  const runTotalsRef = useRef({
    bagsProcessed: 0,
    correctDecisions: 0,
    contrabandCaught: 0,
    falseAlarms: 0,
    missedThreats: 0,
    durationSec: 0,
    maxStreak: 0,
    bombCaught: false,
    detectiveTagged: false,
  });

  // Level-specific accumulators
  const levelQueueRef = useRef<LuggageCase[]>([]);
  const levelStatsRef = useRef({
    correctDecisions: 0,
    contrabandCaught: 0,
    falseAlarms: 0,
    missedThreats: 0,
    secondaryUsedCount: 0,
    precisionTags: 0,
    scoreEarned: 0,
  });

  // 60fps Canvas Simulation Ref (never triggers React re-renders per frame)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const simRef = useRef({
    width: 1200,
    height: 520,
    beltOffset: 0,
    bag: null as LuggageCase | null,
    bagX: -260,
    bagTargetX: 600,
    bagYOffset: 0,
    bagExiting: false,
    exitDirection: 1 as 1 | -1,
    bagEnteredAt: 0,
    decisionLocked: false,
    filter: 'MULTI' as XRayFilterMode,
    isSecondary: false,
    sideView: false,
    peeledTopLayer: false,
    loupeActive: false,
    hoveredItemId: null as string | null,
    scanTargetId: null as string | null,
    scanProgress: 0,
    mouseX: -100,
    mouseY: -100,
    stamp: null as StampEffect | null,
    particles: [] as Particle[],
    flashAlpha: 0,
    flashColor: '#ef4444',
    shakeTimer: 0,
    shakeIntensity: 0,
    time: 0,
  });

  // Sync React controls into simRef without restarting the loop
  useEffect(() => {
    simRef.current.filter = filterMode;
  }, [filterMode]);
  useEffect(() => {
    simRef.current.isSecondary = isSecondary;
  }, [isSecondary]);
  useEffect(() => {
    simRef.current.sideView = sideView;
  }, [sideView]);
  useEffect(() => {
    simRef.current.peeledTopLayer = peeledTopLayer;
  }, [peeledTopLayer]);
  useEffect(() => {
    simRef.current.loupeActive = loupeActive;
  }, [loupeActive]);

  // Listen to Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u?.displayName) {
        setCareer((prev) => {
          if (prev.officerName === 'Cán bộ An ninh') {
            const next = { ...prev, officerName: u.displayName!.slice(0, 40) };
            saveLocalCareer(next);
            return next;
          }
          return prev;
        });
      }
    });
    return () => unsub();
  }, []);

  const persistCareerAndUnlock = useCallback(
    (
      finalScore: number,
      levelReached: number,
      accuracy: number,
      newAchievements: string[],
      addedBags: number,
      addedCaught: number
    ) => {
      setCareer((prev) => {
        const mergedAchievements = Array.from(
          new Set([...prev.unlockedAchievements, ...newAchievements])
        );
        const next: PlayerCareerLocal = {
          bestScore: Math.max(prev.bestScore, finalScore),
          highestLevel: Math.max(prev.highestLevel, levelReached),
          bestAccuracy: Math.max(prev.bestAccuracy, accuracy),
          totalBagsCleared: prev.totalBagsCleared + addedBags,
          totalContrabandCaught: prev.totalContrabandCaught + addedCaught,
          unlockedAchievements: mergedAchievements,
          officerName: prev.officerName,
        };
        saveLocalCareer(next);
        return next;
      });
    },
    []
  );

  const syncToCloud = useCallback(
    async (
      targetUser: User,
      runScore: number,
      levelReached: number,
      accuracy: number,
      unlockedList: string[]
    ) => {
      setSyncStatus('saving');
      try {
        await syncRunAndLeaderboard({
          user: targetUser,
          officerName: career.officerName || targetUser.displayName || 'Cán bộ An ninh',
          runScore,
          levelReached,
          accuracy,
          bagsProcessed: runTotalsRef.current.bagsProcessed,
          contrabandCaught: runTotalsRef.current.contrabandCaught,
          falseAlarms: runTotalsRef.current.falseAlarms,
          missedThreats: runTotalsRef.current.missedThreats,
          durationSec: Math.round(runTotalsRef.current.durationSec),
          unlockedAchievements: unlockedList,
        });
        setSyncStatus('saved');
      } catch {
        setSyncStatus('error');
      }
    },
    [career.officerName]
  );

  const loadBagIntoChamber = useCallback((bag: LuggageCase | null) => {
    const sim = simRef.current;
    sim.bag = bag;
    sim.bagX = -260;
    sim.bagTargetX = sim.width / 2;
    sim.bagYOffset = 0;
    sim.bagExiting = false;
    sim.decisionLocked = false;
    sim.bagEnteredAt = performance.now();
    sim.hoveredItemId = null;
    sim.scanTargetId = null;
    sim.scanProgress = 0;

    setIsSecondary(false);
    setSideView(false);
    setPeeledTopLayer(false);
    setInspectedItem(null);

    if (bag) {
      setCurrentBagMeta({
        tagCode: bag.tagCode,
        origin: bag.passengerOrigin,
        flightCode: bag.flightCode,
        hasFoil: bag.hasFoilShield,
      });
    } else {
      setCurrentBagMeta(null);
    }
  }, []);

  const startLevel = useCallback(
    (levelNum: number) => {
      const cfg = getLevelConfig(levelNum);
      const batch = generateLuggageBatch(cfg);
      levelQueueRef.current = batch;
      levelStatsRef.current = {
        correctDecisions: 0,
        contrabandCaught: 0,
        falseAlarms: 0,
        missedThreats: 0,
        secondaryUsedCount: 0,
        precisionTags: 0,
        scoreEarned: 0,
      };
      setCurrentLevel(levelNum);
      setBagIndex(0);
      setBagTotal(batch.length);
      setTimeLeft(cfg.timeLimitSec);
      setFilterMode('MULTI');
      setFeedbackBanner({
        type: 'info',
        text: `Bắt đầu Màn ${levelNum}: ${cfg.terminalName} (${batch.length} hành lý)`,
      });
      setGameState('PLAYING');
      loadBagIntoChamber(batch[0] ?? null);
    },
    [loadBagIntoChamber]
  );

  const startNewCampaign = useCallback(() => {
    runTotalsRef.current = {
      bagsProcessed: 0,
      correctDecisions: 0,
      contrabandCaught: 0,
      falseAlarms: 0,
      missedThreats: 0,
      durationSec: 0,
      maxStreak: 0,
      bombCaught: false,
      detectiveTagged: false,
    };
    setScore(0);
    setIntegrity(3);
    setStreak(0);
    setNewlyUnlockedIds([]);
    setSyncStatus('idle');
    soundEngine.playClearSuccess();
    startLevel(1);
  }, [startLevel]);

  const finishRun = useCallback(
    (finalState: 'GAME_OVER' | 'VICTORY', finalScore: number, levelReached: number) => {
      const totals = runTotalsRef.current;
      const accuracy =
        totals.bagsProcessed > 0
          ? Math.round((totals.correctDecisions / totals.bagsProcessed) * 100)
          : 100;

      const unlockedNow: string[] = [];
      if (totals.maxStreak >= 5) unlockedNow.push('streak_5');
      if (totals.maxStreak >= 12) unlockedNow.push('streak_12');
      if (totals.bombCaught) unlockedNow.push('bomb_defuser');
      if (totals.detectiveTagged) unlockedNow.push('detective');
      if (career.totalBagsCleared + totals.bagsProcessed >= 50) unlockedNow.push('veteran_50');
      if (finalState === 'VICTORY') unlockedNow.push('terminal_master');

      const merged = Array.from(new Set([...career.unlockedAchievements, ...unlockedNow]));
      const newly = unlockedNow.filter((id) => !career.unlockedAchievements.includes(id));
      setNewlyUnlockedIds((prev) => Array.from(new Set([...prev, ...newly])));

      persistCareerAndUnlock(
        finalScore,
        levelReached,
        accuracy,
        unlockedNow,
        totals.bagsProcessed,
        totals.contrabandCaught
      );
      setGameState(finalState);

      if (user) {
        void syncToCloud(user, finalScore, levelReached, accuracy, merged);
      }
    },
    [career.totalBagsCleared, career.unlockedAchievements, persistCareerAndUnlock, syncToCloud, user]
  );

  const completeCurrentLevel = useCallback(
    (remainingSec: number, updatedScore: number) => {
      const cfg = getLevelConfig(currentLevel);
      const ls = levelStatsRef.current;
      const totalInLevel = cfg.bagCount;
      const acc = totalInLevel > 0 ? ls.correctDecisions / totalInLevel : 1;
      const timeBonus = Math.max(0, Math.round(remainingSec) * 15);
      const nextScore = updatedScore + timeBonus;
      setScore(nextScore);

      const grade: 'S' | 'A' | 'B' | 'C' =
        acc === 1 && remainingSec >= 25
          ? 'S'
          : acc >= 0.9
            ? 'A'
            : acc >= 0.75
              ? 'B'
              : 'C';

      const summary: LevelStats = {
        level: currentLevel,
        terminalName: cfg.terminalName,
        bagsProcessed: totalInLevel,
        correctDecisions: ls.correctDecisions,
        contrabandCaught: ls.contrabandCaught,
        falseAlarms: ls.falseAlarms,
        missedThreats: ls.missedThreats,
        secondaryUsedCount: ls.secondaryUsedCount,
        precisionTags: ls.precisionTags,
        timeRemainingSec: Math.round(remainingSec),
        timeBonus,
        scoreEarned: ls.scoreEarned + timeBonus,
        grade,
      };
      setLastLevelStats(summary);

      // Check level achievements
      const levelUnlocks: string[] = [];
      if (currentLevel === 1) levelUnlocks.push('first_shift');
      if (ls.correctDecisions === totalInLevel) levelUnlocks.push('eagle_eye');
      if (remainingSec >= 40) levelUnlocks.push('speed_screener');
      if (currentLevel >= 3 && ls.falseAlarms === 0) levelUnlocks.push('zero_false_alarm');
      if (runTotalsRef.current.detectiveTagged) levelUnlocks.push('detective');
      if (runTotalsRef.current.bombCaught) levelUnlocks.push('bomb_defuser');
      if (runTotalsRef.current.maxStreak >= 5) levelUnlocks.push('streak_5');
      if (runTotalsRef.current.maxStreak >= 12) levelUnlocks.push('streak_12');
      if (currentLevel >= 6) levelUnlocks.push('terminal_master');

      const newly = levelUnlocks.filter((id) => !career.unlockedAchievements.includes(id));
      setNewlyUnlockedIds(newly);
      persistCareerAndUnlock(
        nextScore,
        currentLevel,
        Math.round(acc * 100),
        levelUnlocks,
        0,
        0
      );

      soundEngine.playLevelClear();
      if (currentLevel === 6) {
        finishRun('VICTORY', nextScore, 6);
      } else {
        setGameState('ROUND_SUMMARY');
      }
    },
    [career.unlockedAchievements, currentLevel, finishRun, persistCareerAndUnlock]
  );

  const spawnBurst = (x: number, y: number, color: string, count: number) => {
    const sim = simRef.current;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 70 + Math.random() * 140;
      sim.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.7,
        color,
        size: 2.5 + Math.random() * 2.5,
      });
    }
  };

  const handleDecision = useCallback(
    (action: DecisionAction) => {
      const sim = simRef.current;
      if (gameState !== 'PLAYING' || !sim.bag || sim.decisionLocked) return;

      const bag = sim.bag;
      sim.decisionLocked = true;
      const elapsedSec = (performance.now() - sim.bagEnteredAt) / 1000;
      const speedBonus = Math.max(0, Math.round((8 - elapsedSec) * 18));

      const hasThreat = bag.hasThreat;
      let correct = false;
      let delta = 0;
      let nextIntegrity = integrity;
      let nextStreak = streak;
      let nextTime = timeLeft;

      runTotalsRef.current.bagsProcessed += 1;

      if (action === 'CLEAR') {
        if (!hasThreat) {
          correct = true;
          nextStreak += 1;
          const mult = Math.min(3, 1 + Math.floor(nextStreak / 3) * 0.25);
          delta = Math.round((200 + speedBonus) * mult);
          levelStatsRef.current.correctDecisions += 1;
          runTotalsRef.current.correctDecisions += 1;
          sim.stamp = { text: 'CHO ĐI · HỢP LỆ', color: '#10b981', timer: 0.65, maxTimer: 0.65 };
          soundEngine.playClearSuccess();
          spawnBurst(sim.width / 2, sim.height / 2, '#10b981', 14);
          setFeedbackBanner({
            type: 'success',
            text: `Thông quan chính xác (+${delta} điểm${nextStreak >= 3 ? ` · Chuỗi x${mult.toFixed(2)}` : ''})`,
          });
        } else {
          correct = false;
          nextStreak = 0;
          nextIntegrity = Math.max(0, integrity - 1);
          delta = -300;
          levelStatsRef.current.missedThreats += 1;
          runTotalsRef.current.missedThreats += 1;
          sim.stamp = { text: 'BỎ LỌT VẬT CẤM!', color: '#ef4444', timer: 0.85, maxTimer: 0.85 };
          sim.flashAlpha = 0.35;
          sim.flashColor = '#ef4444';
          sim.shakeTimer = 0.28;
          sim.shakeIntensity = 9;
          soundEngine.playErrorAlarm(true);
          spawnBurst(sim.width / 2, sim.height / 2, '#ef4444', 20);
          const threatNames = bag.threatItems.map((t) => t.name).join(', ');
          setFeedbackBanner({
            type: 'danger',
            text: `Cảnh báo: Bỏ lọt ${threatNames}! (-1 An ninh, -300 điểm)`,
          });
        }
      } else {
        // action === 'HOLD'
        if (hasThreat) {
          correct = true;
          nextStreak += 1;
          const mult = Math.min(3, 1 + Math.floor(nextStreak / 3) * 0.25);
          const taggedCount = bag.threatItems.filter((t) => t.taggedAsThreat).length;
          const precisionBonus = taggedCount > 0 ? 150 : 0;
          if (precisionBonus > 0) {
            levelStatsRef.current.precisionTags += 1;
            runTotalsRef.current.detectiveTagged = true;
          }
          if (
            bag.threatItems.some(
              (t) => t.templateId === 'c4_ied' || t.templateId === 'fireworks'
            )
          ) {
            runTotalsRef.current.bombCaught = true;
          }
          delta = Math.round((350 + speedBonus) * mult) + precisionBonus;
          levelStatsRef.current.correctDecisions += 1;
          levelStatsRef.current.contrabandCaught += 1;
          runTotalsRef.current.correctDecisions += 1;
          runTotalsRef.current.contrabandCaught += 1;
          sim.stamp = { text: 'TẠM GIỮ · CHÍNH XÁC', color: '#f59e0b', timer: 0.65, maxTimer: 0.65 };
          soundEngine.playHoldSuccess();
          spawnBurst(sim.width / 2, sim.height / 2, '#f59e0b', 16);
          const threatNames = bag.threatItems.map((t) => t.name).join(', ');
          setFeedbackBanner({
            type: 'success',
            text: `Thu giữ thành công ${threatNames} (+${delta} điểm${precisionBonus > 0 ? ' · Bao gồm +150 Soi chuyên sâu' : ''})`,
          });
        } else {
          correct = false;
          nextStreak = 0;
          delta = -150;
          nextTime = Math.max(1, timeLeft - 5);
          levelStatsRef.current.falseAlarms += 1;
          runTotalsRef.current.falseAlarms += 1;
          sim.stamp = { text: 'GIỮ NHẦM HÀNH LÝ', color: '#fb7185', timer: 0.75, maxTimer: 0.75 };
          sim.flashAlpha = 0.2;
          sim.flashColor = '#f43f5e';
          sim.shakeTimer = 0.16;
          sim.shakeIntensity = 5;
          soundEngine.playErrorAlarm(false);
          setFeedbackBanner({
            type: 'warn',
            text: 'Giữ nhầm hành lý hợp lệ! (-150 điểm, phạt 5 giây)',
          });
        }
      }

      if (nextStreak > runTotalsRef.current.maxStreak) {
        runTotalsRef.current.maxStreak = nextStreak;
      }

      const nextScore = Math.max(0, score + delta);
      levelStatsRef.current.scoreEarned += delta;
      setScore(nextScore);
      setStreak(nextStreak);
      setIntegrity(nextIntegrity);
      if (nextTime !== timeLeft) setTimeLeft(nextTime);

      // Animate bag exiting
      sim.bagExiting = true;
      sim.exitDirection = action === 'CLEAR' ? 1 : -1;
      sim.bagTargetX = action === 'CLEAR' ? sim.width + 280 : -280;

      // Advance queue after short exit animation
      window.setTimeout(() => {
        if (nextIntegrity <= 0) {
          soundEngine.playErrorAlarm(true);
          finishRun('GAME_OVER', nextScore, currentLevel);
          return;
        }
        const nextIdx = bagIndex + 1;
        if (nextIdx >= levelQueueRef.current.length) {
          completeCurrentLevel(nextTime, nextScore);
        } else {
          setBagIndex(nextIdx);
          loadBagIntoChamber(levelQueueRef.current[nextIdx]);
        }
      }, 420);

      void correct;
    },
    [
      bagIndex,
      completeCurrentLevel,
      currentLevel,
      finishRun,
      gameState,
      integrity,
      loadBagIntoChamber,
      score,
      streak,
      timeLeft,
    ]
  );

  const toggleSecondaryInspection = useCallback(() => {
    if (gameState !== 'PLAYING' || !simRef.current.bag || simRef.current.decisionLocked) return;
    setIsSecondary((prev) => {
      const next = !prev;
      if (next) {
        levelStatsRef.current.secondaryUsedCount += 1;
        soundEngine.playSecondaryOpen();
        setFeedbackBanner({
          type: 'info',
          text: 'Bàn kiểm tra chuyên sâu: Bóc tách lớp [Q], Chiếu góc nghiêng [W] hoặc bấm trực tiếp vào vật phẩm.',
        });
      } else {
        setSideView(false);
        setPeeledTopLayer(false);
      }
      return next;
    });
  }, [gameState]);

  // Shift countdown timer
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const interval = window.setInterval(() => {
      runTotalsRef.current.durationSec += 1;
      setTimeLeft((prev) => {
        if (prev <= 1) {
          soundEngine.playErrorAlarm(true);
          finishRun('GAME_OVER', score, currentLevel);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [currentLevel, finishRun, gameState, score]);

  // Isolated 60fps Canvas Loop + ResizeObserver
  useEffect(() => {
    const container = canvasContainerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || gameState === 'TITLE_MENU') return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(320, Math.floor(rect.width * dpr));
      canvas.height = Math.max(240, Math.floor(rect.height * dpr));
      simRef.current.width = rect.width;
      simRef.current.height = rect.height;
      if (!simRef.current.bagExiting && simRef.current.bag) {
        simRef.current.bagTargetX = rect.width / 2;
      }
    };
    updateSize();

    const ro = new ResizeObserver(updateSize);
    ro.observe(container);

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);
      const sim = simRef.current;

      if (gameState === 'PLAYING') {
        sim.time += dt;
        const cfg = getLevelConfig(currentLevel);

        // Conveyor motion when bag slides in or out
        const dx = sim.bagTargetX - sim.bagX;
        if (Math.abs(dx) > 1.5) {
          const speed = sim.bagExiting ? cfg.beltSpeed * 3.1 : cfg.beltSpeed * 2.2;
          const step = Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
          sim.bagX += step;
          sim.beltOffset += step * 0.75;
        } else {
          sim.bagX = sim.bagTargetX;
          if (!sim.isSecondary && sim.bag) {
            sim.beltOffset += 12 * dt;
          }
        }

        // Secondary drop offset
        const targetY = sim.isSecondary ? 4 : 0;
        sim.bagYOffset += (targetY - sim.bagYOffset) * Math.min(1, dt * 10);

        // Scan laser progression
        if (sim.scanTargetId && sim.scanProgress < 1) {
          sim.scanProgress = Math.min(1, sim.scanProgress + dt * 2.8);
        }

        // Stamp countdown
        if (sim.stamp) {
          sim.stamp.timer -= dt;
          if (sim.stamp.timer <= 0) sim.stamp = null;
        }

        // Flash & camera shake decay
        if (sim.flashAlpha > 0) {
          sim.flashAlpha = Math.max(0, sim.flashAlpha - dt * 1.4);
        }
        let shakeX = 0;
        let shakeY = 0;
        if (sim.shakeTimer > 0) {
          sim.shakeTimer = Math.max(0, sim.shakeTimer - dt);
          const mag = sim.shakeIntensity * (sim.shakeTimer / 0.28);
          shakeX = (Math.random() - 0.5) * mag * 2;
          shakeY = (Math.random() - 0.5) * mag * 2;
        }

        // Particles update
        for (let i = sim.particles.length - 1; i >= 0; i--) {
          const p = sim.particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;
          if (p.life <= 0) {
            sim.particles.splice(i, 1);
          }
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = canvas.width / Math.max(1, sim.width);
          ctx.save();
          ctx.scale(dpr, dpr);
          drawAirportConveyorStage(ctx, sim.width, sim.height, {
            beltOffset: sim.beltOffset,
            bag: sim.bag,
            bagX: sim.bagX,
            bagTargetX: sim.bagTargetX,
            bagYOffset: sim.bagYOffset,
            filter: sim.filter,
            isSecondary: sim.isSecondary,
            sideView: sim.sideView,
            peeledTopLayer: sim.peeledTopLayer,
            hoveredItemId: sim.hoveredItemId,
            scanTargetId: sim.scanTargetId,
            scanProgress: sim.scanProgress,
            mouseX: sim.mouseX,
            mouseY: sim.mouseY,
            loupeActive: sim.loupeActive,
            stamp: sim.stamp,
            particles: sim.particles,
            flashAlpha: sim.flashAlpha,
            flashColor: sim.flashColor,
            shakeX,
            shakeY,
            time: sim.time,
          });
          ctx.restore();
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [currentLevel, gameState]);

  // Keyboard shortcuts & blur safety
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (showLeaderboard || showManual) {
        if (e.key === 'Escape') {
          setShowLeaderboard(false);
          setShowManual(false);
        }
        return;
      }

      if (gameState === 'TITLE_MENU') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startNewCampaign();
        }
        return;
      }

      if (gameState === 'PAUSED') {
        if (e.key === 'Escape' || e.key === ' ') {
          e.preventDefault();
          setGameState('PLAYING');
        }
        return;
      }

      if (gameState !== 'PLAYING') return;

      const k = e.key.toLowerCase();
      if (k === 'a' || k === '1') {
        e.preventDefault();
        handleDecision('CLEAR');
      } else if (k === 's' || k === '2') {
        e.preventDefault();
        toggleSecondaryInspection();
      } else if (k === 'd' || k === '3') {
        e.preventDefault();
        handleDecision('HOLD');
      } else if (k === '4') {
        soundEngine.playFilterClick();
        setFilterMode('MULTI');
      } else if (k === '5') {
        soundEngine.playFilterClick();
        setFilterMode('ORGANIC');
      } else if (k === '6') {
        soundEngine.playFilterClick();
        setFilterMode('METAL');
      } else if (k === '7') {
        soundEngine.playFilterClick();
        setFilterMode('HIPEN');
      } else if (k === 'q' && isSecondary) {
        soundEngine.playFilterClick();
        setPeeledTopLayer((p) => !p);
      } else if (k === 'w' && isSecondary) {
        soundEngine.playFilterClick();
        setSideView((p) => !p);
      } else if (k === 'l') {
        soundEngine.playFilterClick();
        setLoupeActive((p) => !p);
      } else if (k === 'h') {
        setShowManual(true);
      } else if (e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        setGameState('PAUSED');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    gameState,
    handleDecision,
    isSecondary,
    showLeaderboard,
    showManual,
    startNewCampaign,
    toggleSecondaryInspection,
  ]);

  // Canvas pointer hover & click item density inspection
  const computeActiveBoxRect = (): BoxRect | null => {
    const sim = simRef.current;
    if (!sim.bag) return null;
    const chamberH = Math.min(390, sim.height * 0.72);
    const chamberY = (sim.height - chamberH) / 2 - 6;
    const zoomScale = sim.isSecondary ? 1.24 : 1.0;
    const drawW = sim.bag.width * zoomScale;
    const drawH = sim.bag.height * zoomScale;
    return {
      x: sim.bagX - drawW / 2,
      y: chamberY + chamberH / 2 - drawH / 2 + sim.bagYOffset,
      w: drawW,
      h: drawH,
    };
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const sim = simRef.current;
    if (!canvas || !sim.bag) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    sim.mouseX = x;
    sim.mouseY = y;

    const box = computeActiveBoxRect();
    if (!box) return;
    const hit = findHoveredItem(
      sim.bag,
      x,
      y,
      box,
      sim.sideView,
      sim.peeledTopLayer
    );
    sim.hoveredItemId = hit ? hit.uid : null;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const sim = simRef.current;
    if (!canvas || !sim.bag || sim.decisionLocked) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const box = computeActiveBoxRect();
    if (!box) return;

    const hit = findHoveredItem(
      sim.bag,
      x,
      y,
      box,
      sim.sideView,
      sim.peeledTopLayer
    );
    if (hit) {
      hit.scanned = true;
      sim.scanTargetId = hit.uid;
      sim.scanProgress = 0.05;
      if (sim.isSecondary && hit.isProhibited) {
        hit.taggedAsThreat = true;
      }
      soundEngine.playScanPing(hit.isProhibited);
      setInspectedItem({ ...hit });
    }
  };

  const handleSignInAndSyncFromEnd = async () => {
    try {
      const signedUser = await signInWithGoogle();
      const totals = runTotalsRef.current;
      const acc =
        totals.bagsProcessed > 0
          ? Math.round((totals.correctDecisions / totals.bagsProcessed) * 100)
          : 100;
      await syncToCloud(
        signedUser,
        score,
        currentLevel,
        acc,
        career.unlockedAchievements
      );
    } catch {
      setSyncStatus('error');
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const overallAccuracy =
    runTotalsRef.current.bagsProcessed > 0
      ? Math.round(
          (runTotalsRef.current.correctDecisions / runTotalsRef.current.bagsProcessed) * 100
        )
      : 100;

  return (
    <div className="h-dvh w-screen overflow-hidden bg-slate-950 text-slate-100 select-none flex flex-col">
      {/* === TITLE SCREEN === */}
      {gameState === 'TITLE_MENU' && (
        <div className="relative h-full w-full flex flex-col justify-between overflow-hidden">
          {/* Atmospheric International Airport Key-Art Backdrop */}
          <img
            src={BACKDROP_URL}
            alt="Sảnh soi chiếu an ninh sân bay quốc tế"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/78 to-slate-950/35" />

          {/* Minimal Top Corner Utility Bar (No website navbar) */}
          <div className="relative z-10 flex items-center justify-between px-6 sm:px-10 pt-6">
            <div className="flex items-center gap-3">
              <img
                src={BADGE_URL}
                alt="Phù hiệu Quản lý Xuất Nhập Cảnh - Công an Cửa khẩu Nội Bài"
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-contain bg-white/95 p-0.5 border border-amber-400/50 shrink-0"
              />
              <div className="text-xs text-slate-300">
                <div className="font-semibold text-slate-100">{career.officerName}</div>
                <div className="text-slate-400 font-mono-tabular">
                  Kỷ lục: {career.bestScore.toLocaleString('vi-VN')} · {computeOfficerRank(career.bestScore)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMuted(soundEngine.toggleMute())}
                className="p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              {!user && (
                <button
                  type="button"
                  onClick={() => void signInWithGoogle()}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-amber-400" />
                  <span>Đăng nhập Google</span>
                </button>
              )}
            </div>
          </div>

          {/* Left-aligned Title Lockup over 35-40% Calm Negative Space */}
          <div className="relative z-10 px-6 sm:px-12 max-w-2xl space-y-6 my-auto">
            {/* Bespoke Inline SVG Title Lockup */}
            <div className="space-y-3">
              <svg
                viewBox="0 0 580 74"
                className="w-full max-w-xl h-auto"
                role="img"
                aria-label="Công An Cửa Khẩu Nội Bài - An Ninh Soi Chiếu"
              >
                <defs>
                  <linearGradient id="agGold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <path
                  d="M28 6 L50 14 L50 36 C50 50 40 60 28 66 C16 60 6 50 6 36 L6 14 Z"
                  fill="none"
                  stroke="url(#agGold)"
                  strokeWidth="3"
                />
                <path
                  d="M15 35 L41 35 M20 26 L36 26 M22 44 L34 44"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <text
                  x="66"
                  y="38"
                  fill="#f8fafc"
                  fontFamily="Outfit, sans-serif"
                  fontWeight="800"
                  fontSize="31"
                  letterSpacing="-0.3"
                >
                  CÔNG AN CỬA KHẨU NỘI BÀI
                </text>
                <text
                  x="68"
                  y="60"
                  fill="#fbbf24"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                  fontWeight="600"
                  fontSize="14"
                  letterSpacing="2"
                >
                  AN NINH SOI CHIẾU SÂN BAY QUỐC TẾ
                </text>
              </svg>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                Đóng vai chiến sỹ Công an cửa khẩu, vận hành máy soi X-ray tại nhà ga quốc tế Nội Bài. Phân tích mật độ vật chất, kiểm tra chuyên sâu hành lý khả nghi và ngăn chặn vật phẩm nguy hiểm, đảm bảo một chuyến bay an toàn!
              </p>
            </div>

            {/* Primary Start CTA + Secondary Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={startNewCampaign}
                className="flex items-center gap-2.5 px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-base rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-lg shadow-amber-500/15"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Bắt đầu Ca Trực</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLeaderboard(true)}
                className="flex items-center gap-2 px-4 py-3.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-100 font-semibold text-sm rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Bảng Xếp Hạng Toàn Cầu</span>
              </button>

              <button
                type="button"
                onClick={() => setShowManual(true)}
                className="flex items-center gap-2 px-4 py-3.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-sky-400" />
                <span>Sổ Tay Quy Định</span>
              </button>
            </div>
          </div>

          {/* Single Flat Control-Hint Line */}
          <div className="relative z-10 px-6 sm:px-12 pb-5">
            <p className="text-xs text-slate-400 font-mono-tabular">
              Enter: Bắt đầu · Phím A / 1: Cho đi · Phím S / 2: Nghi ngờ kiểm tra kỹ · Phím D / 3: Giữ lại · Phím 4–7: Bộ lọc X-Ray
            </p>
          </div>
        </div>
      )}

      {/* === ACTIVE GAMEPLAY CONSOLE === */}
      {gameState !== 'TITLE_MENU' && (
        <>
          {/* Compact Top Perimeter HUD (Low-occlusion, tabular-nums, zero pills) */}
          <header className="h-14 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
            {/* Left: Terminal & Bag Info */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-display font-bold text-sm sm:text-base text-amber-400 whitespace-nowrap">
                  Màn {currentLevel}
                </span>
                <span className="text-slate-600 hidden sm:inline">·</span>
                <span className="text-xs sm:text-sm font-medium text-slate-200 truncate hidden md:inline">
                  {getLevelConfig(currentLevel).terminalName}
                </span>
              </div>
              <div className="text-xs font-mono-tabular text-slate-400 whitespace-nowrap">
                Kiện {Math.min(bagIndex + 1, bagTotal)}/{bagTotal}
                {currentBagMeta && (
                  <span className="hidden lg:inline text-slate-500">
                    {' '}
                    · {currentBagMeta.tagCode} · {currentBagMeta.flightCode}
                  </span>
                )}
              </div>
            </div>

            {/* Center: Timer & Security Integrity */}
            <div className="flex items-center gap-5 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 hidden sm:inline">Thời gian</span>
                <span
                  className={`font-mono-tabular text-base font-bold ${
                    timeLeft <= 12
                      ? 'text-rose-400'
                      : timeLeft <= 25
                        ? 'text-amber-400'
                        : 'text-slate-100'
                  }`}
                >
                  {formatTimer(timeLeft)}
                </span>
              </div>

              <div className="flex items-center gap-1.5" aria-label={`An ninh ${integrity}/3`}>
                {[0, 1, 2].map((idx) => (
                  <Shield
                    key={idx}
                    className={`w-4 h-4 ${
                      idx < integrity
                        ? 'text-emerald-400 fill-emerald-400/20'
                        : 'text-slate-700'
                    }`}
                  />
                ))}
                <span className="text-xs font-mono-tabular text-slate-300 ml-0.5">
                  {integrity}/3
                </span>
              </div>
            </div>

            {/* Right: Score, Streak, Accuracy & Utility Buttons */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="hidden sm:flex items-center gap-3 text-xs font-mono-tabular">
                <span className="text-amber-400 font-bold text-sm">
                  {score.toLocaleString('vi-VN')} đ
                </span>
                {streak >= 2 && (
                  <span className="text-sky-400 font-semibold">Chuỗi {streak}</span>
                )}
                <span className="text-slate-400 hidden md:inline">{overallAccuracy}%</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowManual(true)}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Sổ tay quy định [H]"
                  aria-label="Mở sổ tay quy định"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setMuted(soundEngine.toggleMute())}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Bật/tắt âm thanh"
                  aria-label="Bật hoặc tắt âm thanh"
                >
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setGameState(gameState === 'PAUSED' ? 'PLAYING' : 'PAUSED')}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Tạm dừng [Esc]"
                  aria-label="Tạm dừng trò chơi"
                >
                  <Pause className="w-4 h-4" />
                </button>
              </div>
            </div>
          </header>

          {/* Isolated 60fps Canvas Playfield (>=85% unobstructed area) */}
          <div
            ref={canvasContainerRef}
            className="relative flex-1 w-full overflow-hidden bg-slate-950"
          >
            <canvas
              ref={canvasRef}
              onPointerMove={handleCanvasPointerMove}
              onClick={handleCanvasClick}
              className="block w-full h-full cursor-crosshair"
            />

            {/* Minimal non-blocking top-left luggage origin & feedback line */}
            <div className="pointer-events-none absolute top-3 left-4 right-4 flex items-center justify-between gap-4">
              {currentBagMeta && (
                <div className="text-xs font-mono-tabular text-slate-300 bg-slate-950/75 border border-slate-800/80 px-3 py-1.5 rounded-md">
                  Khởi hành: {currentBagMeta.origin} · Mã {currentBagMeta.tagCode}
                  {currentBagMeta.hasFoil && (
                    <span className="text-amber-400 ml-2">· Phát hiện lớp bọc cản tia</span>
                  )}
                </div>
              )}

              {feedbackBanner && (
                <div
                  className={`text-xs font-medium px-3 py-1.5 rounded-md border ml-auto ${
                    feedbackBanner.type === 'success'
                      ? 'bg-emerald-950/90 border-emerald-700/70 text-emerald-200'
                      : feedbackBanner.type === 'danger'
                        ? 'bg-rose-950/90 border-rose-700/70 text-rose-200'
                        : feedbackBanner.type === 'warn'
                          ? 'bg-amber-950/90 border-amber-700/70 text-amber-200'
                          : 'bg-slate-900/90 border-slate-700 text-slate-200'
                  }`}
                >
                  {feedbackBanner.text}
                </div>
              )}
            </div>

            {/* Density Scanner Readout (shown when player clicks an item inside suitcase) */}
            {inspectedItem && (
              <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 max-w-xl w-[92%] bg-slate-950/92 border border-slate-700 rounded-lg px-4 py-2.5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    {inspectedItem.isProhibited ? (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    <span
                      className={
                        inspectedItem.isProhibited ? 'text-rose-300' : 'text-emerald-300'
                      }
                    >
                      Đầu dò: {inspectedItem.name}
                    </span>
                    <span className="text-slate-400 font-normal">
                      · {inspectedItem.isProhibited ? 'VẬT PHẨM CẤM' : 'HỢP LỆ'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5 truncate">
                    {inspectedItem.densityLabel} — {inspectedItem.reason}
                  </div>
                </div>
                {isSecondary && inspectedItem.isProhibited && (
                  <span className="text-xs font-mono-tabular text-amber-400 shrink-0">
                    +150 Đã gắn thẻ
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Bottom Operator Console Dock */}
          <footer className="bg-slate-900 border-t border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Left: X-Ray Imaging Filters & Loupe + Secondary Sub-tools */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
                {(
                  [
                    { id: 'MULTI', label: 'Đa màu [4]' },
                    { id: 'ORGANIC', label: 'Hữu cơ [5]' },
                    { id: 'METAL', label: 'Kim loại [6]' },
                    { id: 'HIPEN', label: 'Xuyên thấu [7]' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playFilterClick();
                      setFilterMode(f.id);
                    }}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      filterMode === f.id
                        ? 'bg-sky-500 text-slate-950'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playFilterClick();
                  setLoupeActive((p) => !p);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  loupeActive
                    ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Kính lúp [L]</span>
              </button>

              {isSecondary && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playFilterClick();
                      setPeeledTopLayer((p) => !p);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      peeledTopLayer
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-950 border-amber-500/50 text-amber-300 hover:bg-amber-500/15'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Bóc lớp [Q]</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playFilterClick();
                      setSideView((p) => !p);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      sideView
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-950 border-amber-500/50 text-amber-300 hover:bg-amber-500/15'
                    }`}
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Góc nghiêng [W]</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right: Three Core Security Officer Actions */}
            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={() => handleDecision('CLEAR')}
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Cho đi [A]</span>
              </button>

              <button
                type="button"
                onClick={toggleSecondaryInspection}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 font-bold text-sm rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isSecondary
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/50'
                }`}
              >
                {isSecondary ? <Eye className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                <span>{isSecondary ? 'Đang soi kỹ [S]' : 'Nghi ngờ · Kiểm tra kỹ [S]'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDecision('HOLD')}
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Giữ lại [D]</span>
              </button>
            </div>
          </footer>
        </>
      )}

      {/* === MODALS === */}
      <RoundModal
        gameState={gameState}
        levelStats={lastLevelStats}
        totalScore={score}
        currentLevel={currentLevel}
        overallAccuracy={overallAccuracy}
        totalBagsProcessed={runTotalsRef.current.bagsProcessed}
        totalContrabandCaught={runTotalsRef.current.contrabandCaught}
        newlyUnlockedIds={newlyUnlockedIds}
        user={user}
        syncStatus={syncStatus}
        onResume={() => setGameState('PLAYING')}
        onNextLevel={() => startLevel(currentLevel + 1)}
        onRestart={startNewCampaign}
        onReturnTitle={() => setGameState('TITLE_MENU')}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onSignInAndSync={() => void handleSignInAndSyncFromEnd()}
      />

      {showManual && <ManualModal onClose={() => setShowManual(false)} />}

      {showLeaderboard && (
        <LeaderboardModal
          user={user}
          career={career}
          onUpdateOfficerName={(name) => {
            setCareer((prev) => {
              const next = { ...prev, officerName: name };
              saveLocalCareer(next);
              return next;
            });
          }}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </div>
  );
}
