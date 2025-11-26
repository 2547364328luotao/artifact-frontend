import { User, AuthResponse } from '../types';

const CURRENT_USER_KEY = 'pixel_drop_current_session';

// API 基础路径
const API_BASE = '/api/auth';

export const authService = {
  // 登录
  login: async (username: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        // 保存用户信息到本地存储（用于页面刷新后保持登录状态）
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
        return { user: data.user };
      }

      return { user: null, error: data.error || '认证失败：未知错误' };
    } catch (error) {
      console.error('登录请求失败:', error);
      return { user: null, error: '网络错误：无法连接到服务器' };
    }
  },

  // 注册
  register: async (username: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        // 注册成功后自动登录
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
        return { user: data.user };
      }

      return { user: null, error: data.error || '注册失败：未知错误' };
    } catch (error) {
      console.error('注册请求失败:', error);
      return { user: null, error: '网络错误：无法连接到服务器' };
    }
  },

  // 登出
  logout: async () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  // 获取当前用户（从本地存储）
  getCurrentUser: (): User | null => {
    try {
      const data = localStorage.getItem(CURRENT_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
};