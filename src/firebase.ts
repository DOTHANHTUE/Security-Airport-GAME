import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { computeOfficerRank } from './data/itemsAndLevels';
import type { LeaderboardEntry, ScreeningRunRecord } from './types/game';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

function sanitizeName(raw: string): string {
  const trimmed = raw.trim().slice(0, 40);
  return trimmed.length > 0 ? trimmed : 'Cán bộ An ninh';
}

export async function fetchGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
  const path = 'leaderboard';
  try {
    const q = query(
      collection(db, path),
      where('bestScore', '>=', 0),
      orderBy('bestScore', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as LeaderboardEntry);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchPersonalRuns(uid: string): Promise<ScreeningRunRecord[]> {
  const path = `users/${uid}/runs`;
  try {
    const q = query(collection(db, path), where('uid', '==', uid), limit(25));
    const snap = await getDocs(q);
    const records: ScreeningRunRecord[] = snap.docs.map((d) => {
      const data = d.data() as Omit<ScreeningRunRecord, 'id'>;
      return {
        ...data,
        id: d.id,
      };
    });
    // Sort descending client-side by createdAt timestamp if available
    records.sort((a, b) => {
      const ta =
        a.createdAt && typeof (a.createdAt as { toMillis?: () => number }).toMillis === 'function'
          ? (a.createdAt as { toMillis: () => number }).toMillis()
          : 0;
      const tb =
        b.createdAt && typeof (b.createdAt as { toMillis?: () => number }).toMillis === 'function'
          ? (b.createdAt as { toMillis: () => number }).toMillis()
          : 0;
      return tb - ta;
    });
    return records;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function syncRunAndLeaderboard(params: {
  user: User;
  officerName: string;
  runScore: number;
  levelReached: number;
  accuracy: number;
  bagsProcessed: number;
  contrabandCaught: number;
  falseAlarms: number;
  missedThreats: number;
  durationSec: number;
  unlockedAchievements: string[];
}): Promise<void> {
  const { user } = params;
  const uid = user.uid;
  const leaderboardPath = `leaderboard/${uid}`;
  const runsPath = `users/${uid}/runs`;

  const clampedScore = Math.max(0, Math.min(10000000, Math.round(params.runScore)));
  const clampedLevel = Math.max(1, Math.min(99, Math.round(params.levelReached)));
  const clampedAccuracy = Math.max(0, Math.min(100, Math.round(params.accuracy)));
  const clampedBags = Math.max(0, Math.min(5000, Math.round(params.bagsProcessed)));
  const clampedCaught = Math.max(0, Math.min(5000, Math.round(params.contrabandCaught)));
  const clampedFalse = Math.max(0, Math.min(5000, Math.round(params.falseAlarms)));
  const clampedMissed = Math.max(0, Math.min(5000, Math.round(params.missedThreats)));
  const clampedDuration = Math.max(0, Math.min(86400, Math.round(params.durationSec)));
  const cleanAchievements = params.unlockedAchievements
    .filter((id) => typeof id === 'string' && id.length > 0)
    .map((id) => id.slice(0, 64))
    .slice(0, 20);
  const rankTitle = computeOfficerRank(clampedScore).slice(0, 40);

  // 1. Append personal run record
  try {
    await addDoc(collection(db, runsPath), {
      uid,
      score: clampedScore,
      levelReached: clampedLevel,
      accuracy: clampedAccuracy,
      bagsProcessed: clampedBags,
      contrabandCaught: clampedCaught,
      falseAlarms: clampedFalse,
      missedThreats: clampedMissed,
      durationSec: clampedDuration,
      rankTitle,
      achievementsEarned: cleanAchievements,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, runsPath);
  }

  // 2. Read existing leaderboard entry (if any) and upsert best stats
  let existing: LeaderboardEntry | null = null;
  try {
    const existingSnap = await getDoc(doc(db, 'leaderboard', uid));
    if (existingSnap.exists()) {
      existing = existingSnap.data() as LeaderboardEntry;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, leaderboardPath);
  }

  const nextBestScore = Math.max(existing?.bestScore ?? 0, clampedScore);
  const nextHighestLevel = Math.max(existing?.highestLevel ?? 1, clampedLevel);
  const nextBestAccuracy = Math.max(existing?.bestAccuracy ?? 0, clampedAccuracy);
  const nextTotalCaught = Math.min(
    1000000,
    (existing?.totalContrabandCaught ?? 0) + clampedCaught
  );
  const nextAchievementsCount = Math.max(
    existing?.achievementsCount ?? 0,
    cleanAchievements.length
  );

  const payload = {
    uid,
    officerName: sanitizeName(params.officerName || user.displayName || 'Cán bộ An ninh'),
    officerRank: computeOfficerRank(nextBestScore).slice(0, 40),
    bestScore: nextBestScore,
    highestLevel: nextHighestLevel,
    bestAccuracy: nextBestAccuracy,
    totalContrabandCaught: nextTotalCaught,
    achievementsCount: Math.min(30, nextAchievementsCount),
    isPublic: true,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'leaderboard', uid), payload);
  } catch (error) {
    handleFirestoreError(
      error,
      existing ? OperationType.UPDATE : OperationType.CREATE,
      leaderboardPath
    );
  }
}

export async function updateLeaderboardCallsign(
  user: User,
  newName: string,
  fallbackCareer: {
    bestScore: number;
    highestLevel: number;
    bestAccuracy: number;
    totalContrabandCaught: number;
    achievementsCount: number;
  }
): Promise<void> {
  const uid = user.uid;
  const leaderboardPath = `leaderboard/${uid}`;
  let existing: LeaderboardEntry | null = null;
  try {
    const snap = await getDoc(doc(db, 'leaderboard', uid));
    if (snap.exists()) existing = snap.data() as LeaderboardEntry;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, leaderboardPath);
  }

  const bestScore = existing?.bestScore ?? Math.max(0, Math.round(fallbackCareer.bestScore));
  const payload = {
    uid,
    officerName: sanitizeName(newName),
    officerRank: computeOfficerRank(bestScore).slice(0, 40),
    bestScore,
    highestLevel: existing?.highestLevel ?? Math.max(1, fallbackCareer.highestLevel),
    bestAccuracy: existing?.bestAccuracy ?? Math.max(0, Math.min(100, fallbackCareer.bestAccuracy)),
    totalContrabandCaught:
      existing?.totalContrabandCaught ?? Math.max(0, fallbackCareer.totalContrabandCaught),
    achievementsCount:
      existing?.achievementsCount ?? Math.max(0, Math.min(30, fallbackCareer.achievementsCount)),
    isPublic: true,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'leaderboard', uid), payload);
  } catch (error) {
    handleFirestoreError(
      error,
      existing ? OperationType.UPDATE : OperationType.CREATE,
      leaderboardPath
    );
  }
}
