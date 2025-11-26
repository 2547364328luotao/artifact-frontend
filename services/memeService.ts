import { Meme, MemeRarity, MemeStats, UserTier, FeedChannel } from '../types';

// API 基础路径
// 如果是开发环境，使用相对路径（走 Vite 代理）
// 如果是生产环境，使用环境变量配置的完整后端地址
const API_DOMAIN = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || '');
const API_BASE = `${API_DOMAIN}/api/memes`;

interface UserStats {
  totalMemes: number;
  totalLikes: number;
  rankCounts?: Record<MemeRarity, number>;
  hashPoints?: number;
  level?: number;
  tier?: UserTier;
  levelProgress?: {
    current: number;
    required: number;
    percentage: number;
  };
  highestDrop?: MemeRarity;
  loginStreak?: number;
  selectedTitle?: string | null;
}

export const memeService = {
  // 获取公共广场数据 (THE NEXUS)
  // channel: LIVE_STREAM | HIGH_VOLTAGE | LEGEND_HALL
  getAll: async (channel: FeedChannel = 'LIVE_STREAM'): Promise<{ memes: Meme[]; channel: FeedChannel }> => {
    try {
      const response = await fetch(`${API_BASE}?channel=${channel}`);
      const data = await response.json();
      if (data.success) {
        return { memes: data.memes, channel: data.channel };
      }
      return { memes: [], channel };
    } catch (error) {
      console.error('获取广场数据失败:', error);
      return { memes: [], channel };
    }
  },

  // 获取用户的表情包（包含私有）
  getMyMemes: async (userId: string): Promise<{ memes: Meme[] }> => {
    try {
      const response = await fetch(`${API_BASE}/my?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        return { memes: data.memes };
      }
      return { memes: [] };
    } catch (error) {
      console.error('获取用户表情包失败:', error);
      return { memes: [] };
    }
  },

  // 上传表情包（默认私有）
  upload: async (meme: {
    userId: string;
    url: string;
    title: string;
    description: string;
    flavor_text?: string;
    tags: string[];
    type: string;
    isPublic?: boolean;
    base64Preview?: string;
    base64Backup?: string;
    storageType?: string;
    // RPG 属性 - 必须使用 AI 分析返回的值
    rank: MemeRarity;
    rarity_color: string;
    stats?: MemeStats;
  }): Promise<{ success: boolean; meme?: Meme; error?: string; hashReward?: number }> => {
    try {
      // Debug: 打印上传数据，确认 rank 值
      console.log('📤 [DEBUG] memeService.upload 发送数据:', {
        rank: meme.rank,
        rarity_color: meme.rarity_color,
        title: meme.title
      });
      
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meme),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('上传表情包失败:', error);
      return { success: false, error: '网络错误' };
    }
  },

  // 广播切换 (BROADCAST / ENCRYPT)
  broadcast: async (memeId: string, userId: string, action: 'BROADCAST' | 'ENCRYPT'): Promise<{ 
    success: boolean; 
    isPublic?: boolean; 
    message?: string 
  }> => {
    try {
      const response = await fetch(`${API_BASE}/${memeId}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('广播切换失败:', error);
      return { success: false };
    }
  },

  // 克隆数据 (CLONE)
  clone: async (memeId: string): Promise<{ success: boolean; cloneCount?: number; message?: string }> => {
    try {
      const response = await fetch(`${API_BASE}/${memeId}/clone`, {
        method: 'POST',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('克隆失败:', error);
      return { success: false };
    }
  },

  // 删除表情包
  delete: async (memeId: string, userId: string): Promise<{ success: boolean }> => {
    try {
      const response = await fetch(`${API_BASE}/${memeId}?userId=${userId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('删除表情包失败:', error);
      return { success: false };
    }
  },

  // 点赞/增幅 (BOOST)
  like: async (memeId: string): Promise<{ success: boolean; likes?: number }> => {
    try {
      const response = await fetch(`${API_BASE}/${memeId}/like`, {
        method: 'POST',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('点赞失败:', error);
      return { success: false };
    }
  },

  // 获取用户统计（包含等级信息）
  getStats: async (userId: string): Promise<UserStats> => {
    try {
      const response = await fetch(`${API_BASE}/stats/${userId}`);
      const data = await response.json();
      if (data.success) {
        return data.stats;
      }
      return { totalMemes: 0, totalLikes: 0 };
    } catch (error) {
      console.error('获取统计失败:', error);
      return { totalMemes: 0, totalLikes: 0 };
    }
  },
};
