export type GameState =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'ROUND_SUMMARY'
  | 'GAME_OVER'
  | 'VICTORY';

export type XRayFilterMode = 'MULTI' | 'ORGANIC' | 'METAL' | 'HIPEN';

export type MaterialClass = 'organic' | 'inorganic' | 'metal' | 'mixed';

export type ThreatCategory =
  | 'blade'
  | 'firearm'
  | 'explosive'
  | 'chemical'
  | 'battery'
  | 'safe';

export type ItemShapeId =
  | 'knife_hunting'
  | 'knife_utility'
  | 'scissors_large'
  | 'handgun'
  | 'ammo_clip'
  | 'taser'
  | 'c4_ied'
  | 'fireworks'
  | 'gas_canister'
  | 'torch_lighter'
  | 'pepper_spray'
  | 'acid_bottle'
  | 'over_battery'
  | 'ceramic_knife'
  | 'disassembled_gun'
  | 'clothes_folded'
  | 'sneakers'
  | 'laptop'
  | 'camera_dslr'
  | 'powerbank_safe'
  | 'headphones'
  | 'book'
  | 'umbrella'
  | 'keys'
  | 'glasses'
  | 'electric_toothbrush'
  | 'hairdryer'
  | 'mini_toiletries'
  | 'thermos_empty'
  | 'tripod_compact';

export interface ItemTemplate {
  id: ItemShapeId;
  name: string;
  category: ThreatCategory;
  isProhibited: boolean;
  material: MaterialClass;
  densityLabel: string;
  reason: string;
  minLevel: number;
  baseWidth: number;
  baseHeight: number;
}

export interface PackedItem {
  uid: string;
  templateId: ItemShapeId;
  name: string;
  category: ThreatCategory;
  isProhibited: boolean;
  material: MaterialClass;
  densityLabel: string;
  reason: string;
  // Normalized coordinates inside the suitcase (-0.42..0.42)
  relX: number;
  relY: number;
  rotation: number;
  scale: number;
  layer: 'bottom' | 'top';
  edgeOn: boolean;
  hiddenByFoil: boolean;
  scanned: boolean;
  taggedAsThreat: boolean;
}

export type LuggageStyle = 'hardcase' | 'duffel' | 'backpack' | 'briefcase';

export interface LuggageCase {
  id: string;
  tagCode: string;
  passengerOrigin: string;
  flightCode: string;
  style: LuggageStyle;
  width: number;
  height: number;
  hasFoilShield: boolean;
  items: PackedItem[];
  hasThreat: boolean;
  threatItems: PackedItem[];
}

export interface LevelConfig {
  level: number;
  terminalName: string;
  flightRoute: string;
  bagCount: number;
  timeLimitSec: number;
  beltSpeed: number;
  threatProbability: number;
  overlapDensity: number;
  foilProbability: number;
  edgeOnProbability: number;
  description: string;
}

export type DecisionAction = 'CLEAR' | 'HOLD';

export interface BagResolutionEvent {
  action: DecisionAction;
  correct: boolean;
  pointsDelta: number;
  speedBonus: number;
  precisionBonus: number;
  usedSecondary: boolean;
  bag: LuggageCase;
  message: string;
}

export interface LevelStats {
  level: number;
  terminalName: string;
  bagsProcessed: number;
  correctDecisions: number;
  contrabandCaught: number;
  falseAlarms: number;
  missedThreats: number;
  secondaryUsedCount: number;
  precisionTags: number;
  timeRemainingSec: number;
  timeBonus: number;
  scoreEarned: number;
  grade: 'S' | 'A' | 'B' | 'C';
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
}

export interface PlayerCareerLocal {
  bestScore: number;
  highestLevel: number;
  bestAccuracy: number;
  totalBagsCleared: number;
  totalContrabandCaught: number;
  unlockedAchievements: string[];
  officerName: string;
}

export interface LeaderboardEntry {
  uid: string;
  officerName: string;
  officerRank: string;
  bestScore: number;
  highestLevel: number;
  bestAccuracy: number;
  totalContrabandCaught: number;
  achievementsCount: number;
  isPublic: boolean;
  updatedAt?: unknown;
}

export interface ScreeningRunRecord {
  id?: string;
  uid: string;
  score: number;
  levelReached: number;
  accuracy: number;
  bagsProcessed: number;
  contrabandCaught: number;
  falseAlarms: number;
  missedThreats: number;
  durationSec: number;
  rankTitle: string;
  achievementsEarned: string[];
  createdAt?: unknown;
}
