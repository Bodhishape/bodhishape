/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  displayName?: string;
  email: string;
  avatar: string;
  avatarUrl?: string;
  city: string;
  state: string;
  division: "DS" | "DF" | "JS"; // DS = Sênior, DF = Feminina, JS = Juventude Soka
  organization: string;
  district: string;
  region: string;
  subDistrict?: string;
  streak: number;
  lastActive: string;
  roles?: string[];
  trialEnds?: string;
  daimokuBalance?: number;
  horizontalGroup?: string;       // e.g. "Fukuchi", "Taiga"
  localGroup?: string;            // e.g. "Grupo de Dança da DF", "Taiga Recife Norte"
  horizontalGroupOfficial?: boolean; // Is it officially recognized (Sim / Não)
  theme?: string;
  lang?: string;
  socials?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
    x?: string;
    threads?: string;
  };
  
  // Production Physical Evolution Properties
  height?: number;
  initialWeight?: number;
  currentWeight?: number;
  targetWeight?: number;
  weightHistory?: { date: string; weight: number }[];
  bodyMeasurements?: {
    peitoral?: number;
    cintura?: number;
    abdomen?: number;
    quadril?: number;
    bracoD?: number;
    bracoE?: number;
    coxaD?: number;
    coxaE?: number;
    panturrilhaD?: number;
    panturrilhaE?: number;
  };
  progressPhotos?: {
    id: string;
    url: string;
    date: string;
    caption?: string;
  }[];
  block?: string;
  accessibility?: {
    screenReader?: "verbose" | "simplified";
    fontSize?: "small" | "medium" | "large" | "extra-large";
    highContrast?: boolean;
    adaptedModality?: "none" | "physical" | "cognitive" | "both";
  };
  pushEnabled?: boolean;
  pushToken?: string;
  birthdate?: string;
  integrations?: {
    [service: string]: {
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: number;
      connectedAt?: string;
    };
  };
}

export type ExerciseCategory =
  | "Musculação"
  | "Corrida"
  | "Ciclismo"
  | "Esportes"
  | "Artes Marciais"
  | "Dança"
  | "Bem-estar"
  | "Aquáticos"
  | "Outro";

export interface Activity {
  id: string;
  userId: string;
  type: "gongyo_morning" | "gongyo_evening" | "daimoku" | "exercise";
  category?: ExerciseCategory;
  subType?: string;
  minutes?: number;
  points: number;
  notes?: string;
  timestamp: string;
  date?: string;
  startTimestamp?: string;
  endTimestamp?: string;
  duration?: number;
  // Métricas físicas
  distanceKm?: number;
  calories?: number;
  steps?: number;
  heartRate?: number;
  heartRateAvg?: number;
  heartRateMax?: number;
  heartRateMin?: number;
  pace?: number;
  speedAvg?: number;
  weightUsed?: number;
  sets?: number;
  reps?: number;
  // Mídia
  photos?: string[];
  videos?: string[];
  // Localização
  location?: string | any;
  // Origem
  sourceDevice?: string;
  sourceApp?: "Manual" | "Google Fit" | "Apple Health" | "Samsung Health" | "Garmin" | "Strava" | "Fitbit" | "Polar" | "Suunto" | "Coros" | "Amazfit" | "Huawei Health" | "Outro";
  // Integração futura
  gpxUrl?: string;
  tcxUrl?: string;
  verified?: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: string;
  isAI: boolean;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userDivision: "DS" | "DF" | "JS";
  userRegion: string;
  content: string;
  image?: string;
  video?: string;
  category?: string;
  communityId?: string;
  timestamp: string;
  reactions: {
    [reactionKey: string]: string[]; // maps reaction (❤️, 🔥, 💪, 👏, 🌟) to list of userIds
  };
  comments: Comment[];
  loggedActivities?: string[];
  pointsEarned?: number;
  isPresenceOnly?: boolean;
  streak?: number;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  deadline: string;
  progress: number;
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  rules: string;
  creatorId: string;
  enabledActivities: string[];
  membersCount: number;
  cover: string;
  // Challenging parameters added
  startDate?: string;
  endDate?: string;
  prize?: string;
  privacy?: "public" | "private" | "invite";
  invitedUsers?: string[];  // User IDs invited to this challenge
  participants?: string[];   // User IDs participating in this challenge
  gongyoMorningPoints?: number;
  gongyoEveningPoints?: number;
  daimokuPoints?: number;
  exercisePoints?: number;
  customSubgroups?: string[];
  
  // Advanced features fields
  region?: string;
  city?: string;
  state?: string;
  country?: string;
  language?: string;
  category?: string;
  joinCriteria?: "free" | "approval" | "invite";
  inviteCode?: string;
  blockedUsers?: string[];
  pendingRequests?: string[];
  roles?: Record<string, string>; // userId -> roleName (e.g. "Fundador", "Administrador Geral", "Moderador")
  rolePermissions?: Record<string, string[]>;
  notices?: any[];
  events?: any[];
  files?: any[];
  victories?: any[];
  liveStreams?: any[];
}

export interface KofuRecord {
  userId: string;
  campaignId: string;
  status: "realizado" | "em_andamento" | "nao_realizado";
  updatedAt: string;
}

export interface BsRecord {
  userId: string;
  status: "ativo" | "pendente" | "nao_assinante";
  renewalDate: string;
  currentStreakMonths: number;
}

export interface TrialInfo {
  trialActive: boolean;
  daysRemaining: number;
  trialEndDate: string;
}

export interface LeaderboardUser {
  user: User;
  totalPoints: number;
  daimokuMinutes: number;
  exerciseCount: number;
  streakDays: number;
}
