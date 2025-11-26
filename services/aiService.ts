// AI 服务 - 调用后端 AI API
import { AiAnalysisResult, MemeRarity, MemeStats, RARITY_CONFIG } from '../types';

export interface ApiKeyInfo {
  id: number;
  platform: string;
  name: string;
  is_active: boolean;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
}

export interface AIPlatform {
  id: string;
  name: string;
  models: { id: string; name: string; label: string }[];
}

// API 基础路径
// 如果是开发环境，使用相对路径（走 Vite 代理）
// 如果是生产环境，使用环境变量配置的完整后端地址
const API_DOMAIN = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || '');
const API_BASE = `${API_DOMAIN}/api/ai`;

export const aiService = {
  // 分析图片生成 RPG 鉴定结果
  analyzeImage: async (
    imageBase64: string,
    mimeType: string,
    platform: string = 'siliconflow'
  ): Promise<AiAnalysisResult | null> => {
    try {
      const response = await fetch(`${API_BASE}/analyze-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          platform
        })
      });

      const data = await response.json();
      
      if (data.success && data.analysis) {
        // 确保返回的是新的 RPG 格式
        const analysis = data.analysis;
        
        // 如果是新格式（有 item_data）
        if (analysis.item_data) {
          // 确保颜色正确
          const rank = analysis.item_data.rank as MemeRarity;
          analysis.item_data.rarity_color = RARITY_CONFIG[rank]?.color || '#A0A0A0';
          return analysis;
        }
        
        // 如果是旧格式（有 title/description），转换为新格式
        if (analysis.title) {
          // 优先使用 API 返回的 rank，否则默认为 R
          const rank = (analysis.rank || 'R') as MemeRarity;
          const rarityColor = analysis.rarityColor || RARITY_CONFIG[rank]?.color || RARITY_CONFIG['R'].color;
          
          return {
            status: 'SCAN_COMPLETE',
            item_data: {
              name: analysis.title,
              rank: rank,
              rarity_color: rarityColor,
              stats: analysis.stats || {
                psy_damage: Math.floor(Math.random() * 30) + 40,
                texture_integrity: Math.floor(Math.random() * 30) + 40,
                viral_potential: Math.floor(Math.random() * 30) + 40
              },
              tags: analysis.tags || ['未分类'],
              flavor_text: analysis.description || '此造物缺少详细描述。'
            }
          };
        }
        
        return analysis;
      }
      
      console.error('AI 分析失败:', data.error);
      return null;
    } catch (error) {
      console.error('AI 服务错误:', error);
      return null;
    }
  },

  // 获取所有 API Keys
  getApiKeys: async (): Promise<ApiKeyInfo[]> => {
    try {
      const response = await fetch(`${API_BASE}/keys`);
      const data = await response.json();
      return data.success ? data.keys : [];
    } catch (error) {
      console.error('获取 API Keys 失败:', error);
      return [];
    }
  },

  // 添加新的 API Key
  addApiKey: async (
    platform: string,
    apiKey: string,
    name?: string
  ): Promise<{ success: boolean; keyId?: number; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, apiKey, name })
      });
      return await response.json();
    } catch (error) {
      console.error('添加 API Key 失败:', error);
      return { success: false, error: '网络错误' };
    }
  },

  // 删除 API Key
  deleteApiKey: async (keyId: number): Promise<{ success: boolean }> => {
    try {
      const response = await fetch(`${API_BASE}/keys/${keyId}`, {
        method: 'DELETE'
      });
      return await response.json();
    } catch (error) {
      console.error('删除 API Key 失败:', error);
      return { success: false };
    }
  },

  // 切换 API Key 状态
  toggleApiKey: async (keyId: number): Promise<{ success: boolean; isActive?: boolean }> => {
    try {
      const response = await fetch(`${API_BASE}/keys/${keyId}/toggle`, {
        method: 'PATCH'
      });
      return await response.json();
    } catch (error) {
      console.error('切换 API Key 状态失败:', error);
      return { success: false };
    }
  },

  // 获取支持的平台列表
  getPlatforms: async (): Promise<AIPlatform[]> => {
    try {
      const response = await fetch(`${API_BASE}/platforms`);
      const data = await response.json();
      return data.success ? data.platforms : [];
    } catch (error) {
      console.error('获取平台列表失败:', error);
      return [];
    }
  },

  // 通用文本生成
  generate: async (
    prompt: string,
    platform: string = 'siliconflow',
    systemPrompt?: string
  ): Promise<string | null> => {
    try {
      const response = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, platform, systemPrompt })
      });

      const data = await response.json();
      return data.success ? data.content : null;
    } catch (error) {
      console.error('AI 生成失败:', error);
      return null;
    }
  }
};
