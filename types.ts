// ============================================
// 稀有度系统定义 (Rarity System)
// ============================================

export type MemeRarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR';

export interface RarityConfig {
  label: string;           // 显示标签
  labelCN: string;         // 中文标签
  color: string;           // CSS Hex 颜色
  glowColor: string;       // 发光效果颜色
  bgGradient: string;      // 背景渐变
}

export const RARITY_CONFIG: Record<MemeRarity, RarityConfig> = {
  'N': {
    label: 'Common',
    labelCN: '废弃数据',
    color: '#A0A0A0',
    glowColor: 'rgba(160, 160, 160, 0.3)',
    bgGradient: 'from-gray-600 to-gray-800'
  },
  'R': {
    label: 'Uncommon',
    labelCN: '标准物资',
    color: '#00FF00',
    glowColor: 'rgba(0, 255, 0, 0.3)',
    bgGradient: 'from-green-500 to-green-700'
  },
  'SR': {
    label: 'Rare',
    labelCN: '稀有存储',
    color: '#00FFFF',
    glowColor: 'rgba(0, 255, 255, 0.3)',
    bgGradient: 'from-cyan-400 to-cyan-600'
  },
  'SSR': {
    label: 'Epic',
    labelCN: '史诗遗物',
    color: '#BD00FF',
    glowColor: 'rgba(189, 0, 255, 0.4)',
    bgGradient: 'from-purple-500 to-purple-700'
  },
  'UR': {
    label: 'Legendary',
    labelCN: '传说奇点',
    color: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.5)',
    bgGradient: 'from-yellow-400 to-amber-600'
  }
};

// ============================================
// RPG 属性系统 (Stats System)
// ============================================

export interface MemeStats {
  psy_damage: number;        // 精神污染值 (0-100)
  texture_integrity: number; // 分辨率完整度 (0-100)
  viral_potential: number;   // 病毒传播潜能 (0-100)
}

// ============================================
// Meme 主接口 (Main Interface)
// ============================================

// 资产加密状态 (Asset Encryption State)
export type AssetState = 'ENCRYPTED' | 'DECRYPTED';

// 广场频道 (Feed Channels)
export type FeedChannel = 'LIVE_STREAM' | 'HIGH_VOLTAGE' | 'LEGEND_HALL';

export const FEED_CHANNEL_CONFIG: Record<FeedChannel, { label: string; labelCN: string; description: string; icon: string }> = {
  'LIVE_STREAM': {
    label: 'Live Stream',
    labelCN: '实时流',
    description: '所有最新解密的物品流',
    icon: '📡'
  },
  'HIGH_VOLTAGE': {
    label: 'High Voltage',
    labelCN: '高压区',
    description: '近期互动率最高的物品',
    icon: '⚡'
  },
  'LEGEND_HALL': {
    label: 'Legend Hall',
    labelCN: '传说大厅',
    description: 'SSR 和 UR 级物品的永久荣誉殿堂',
    icon: '🏛️'
  }
};

export interface Meme {
  id: string;
  url: string;                // 高清源 (R2 URL 或 Base64)
  previewUrl?: string;        // 低清预览 (Lo-Fi Ghost Cache)
  title: string;             // AI生成的RPG物品名称
  description: string;       // 保留用于兼容，新数据使用 flavor_text
  flavor_text?: string;      // AI生成的风味描述
  tags: string[];
  uploadedAt: Date;
  likes: number;
  type: 'image' | 'gif' | 'webm';
  author: string;
  authorId?: string;
  
  // RPG 鉴定属性
  rank?: MemeRarity;         // 稀有度等级
  rarity_color?: string;     // 稀有度颜色 Hex
  stats?: MemeStats;         // RPG属性
  
  // Nexus Protocol (公共广场系统)
  isPublic?: boolean;        // 是否已解密/公开
  cloneCount?: number;       // 被克隆次数
  broadcastAt?: Date;        // 首次广播时间
}

// ============================================
// AI 分析结果 (Analysis Result)
// ============================================

export interface AiAnalysisResult {
  status: 'SCAN_COMPLETE' | 'SCAN_FAILED';
  item_data: {
    name: string;            // RPG风格物品名
    rank: MemeRarity;        // 稀有度
    rarity_color: string;    // 对应颜色
    stats: MemeStats;        // RPG属性
    tags: string[];          // 标签
    flavor_text: string;     // 风味描述
  };
  
  // 兼容旧格式的便捷访问器
  title?: string;
  description?: string;
  tags?: string[];
}

export interface User {
  id: string;
  username: string;
  password: string; // In a real app, this would be a hash
  avatarColor: string;
  joinedAt: string;
  // 等级系统
  hashPoints?: number;
  level?: number;
  tier?: UserTier;
  highestDrop?: MemeRarity;
  loginStreak?: number;
  selectedTitle?: string | null;
}

export interface AuthResponse {
  user: User | null;
  error?: string;
}

// ============================================
// 用户等级系统 (User Level System)
// ============================================

export type UserTier = 'GLITCH' | 'RUNNER' | 'OPERATOR' | 'ARCHITECT' | 'DEITY';

export interface TierConfig {
  tier: UserTier;
  minLevel: number;
  maxLevel: number;
  label: string;           // 英文称号
  labelCN: string;         // 中文称号
  color: string;           // 主色调
  glowColor: string;       // 发光效果
  borderStyle: string;     // 边框样式类
  titles: string[];        // 可选称号列表
  description: string;     // 设定描述
}

// 等级阶层配置
export const TIER_CONFIG: Record<UserTier, TierConfig> = {
  'GLITCH': {
    tier: 'GLITCH',
    minLevel: 0,
    maxLevel: 9,
    label: 'Glitch',
    labelCN: '故障体',
    color: '#6B7280',
    glowColor: 'rgba(107, 114, 128, 0.3)',
    borderStyle: 'border-gray-500 animate-pulse',
    titles: ['Guest_User', 'Script_Kiddie', 'Noise_Maker', '游荡者'],
    description: '刚接入系统的匿名用户，不稳定的数据流'
  },
  'RUNNER': {
    tier: 'RUNNER',
    minLevel: 10,
    maxLevel: 29,
    label: 'Runner',
    labelCN: '行者',
    color: '#22C55E',
    glowColor: 'rgba(34, 197, 94, 0.3)',
    borderStyle: 'border-green-500',
    titles: ['Data_Mule', 'Pixel_Miner', 'Cache_Hunter', '数据骡子'],
    description: '开始稳定贡献数据的活跃用户，系统的正式组件'
  },
  'OPERATOR': {
    tier: 'OPERATOR',
    minLevel: 30,
    maxLevel: 59,
    label: 'Operator',
    labelCN: '操作员',
    color: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    borderStyle: 'border-cyan-400',
    titles: ['Net_Stalker', 'Relic_Keeper', 'Protocol_Expert', '遗物看守'],
    description: '拥有高质量库存的资深玩家'
  },
  'ARCHITECT': {
    tier: 'ARCHITECT',
    minLevel: 60,
    maxLevel: 89,
    label: 'Architect',
    labelCN: '架构师',
    color: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    borderStyle: 'border-purple-500',
    titles: ['System_Architect', 'Neon_Prophet', 'Memetic_Overlord', '霓虹先知'],
    description: '社区的大佬，仓库里装满了 SSR'
  },
  'DEITY': {
    tier: 'DEITY',
    minLevel: 90,
    maxLevel: 100,
    label: 'Deity',
    labelCN: '奇点',
    color: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.6)',
    borderStyle: 'border-yellow-400',
    titles: ['The_Singularity', 'Admin_Root', 'Zero_Cool', '神'],
    description: '传说中的存在，达到了底层代码级别'
  }
};

// HASH 奖励配置
export const HASH_REWARDS = {
  UPLOAD_BASE: 10,        // 基础上传奖励
  RANK_N: 1,              // N 品质（鼓励分）
  RANK_R: 30,             // R 品质
  RANK_SR: 50,            // SR 品质
  RANK_SSR: 100,          // SSR 品质 (暴击!)
  RANK_UR: 500,           // UR 品质 (传说大奖!)
  LIKE_RECEIVED: 2,       // 被点赞
  LOGIN_STREAK_BASE: 5,   // 连续登录基础
  LOGIN_STREAK_MAX: 7     // 连续登录最大天数
};

// 每级所需 HASH（递增公式）
export function getHashForLevel(level: number): number {
  if (level <= 0) return 0;
  // 前10级快速，之后递增
  if (level <= 10) return level * 50;
  if (level <= 30) return 500 + (level - 10) * 100;
  if (level <= 60) return 2500 + (level - 30) * 200;
  if (level <= 90) return 8500 + (level - 60) * 400;
  return 20500 + (level - 90) * 800;
}

// 根据总 HASH 计算等级
export function calculateLevel(totalHash: number): number {
  let level = 0;
  let accumulatedHash = 0;
  
  while (level < 100) {
    const nextLevelHash = getHashForLevel(level + 1);
    if (accumulatedHash + nextLevelHash > totalHash) break;
    accumulatedHash += nextLevelHash;
    level++;
  }
  
  return level;
}

// 获取用户所属阶层
export function getUserTier(level: number): TierConfig {
  if (level >= 90) return TIER_CONFIG.DEITY;
  if (level >= 60) return TIER_CONFIG.ARCHITECT;
  if (level >= 30) return TIER_CONFIG.OPERATOR;
  if (level >= 10) return TIER_CONFIG.RUNNER;
  return TIER_CONFIG.GLITCH;
}

// 用户统计数据接口
export interface UserStats {
  totalMemes: number;
  totalLikes: number;
  hashPoints: number;
  level: number;
  tier: UserTier;
  highestDrop: MemeRarity | null;
  loginStreak: number;
  lastLoginDate: string | null;
  // 进度信息
  currentLevelHash: number;
  nextLevelHash: number;
  progressPercent: number;
}