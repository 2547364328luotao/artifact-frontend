import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { memeService } from '../services/memeService';
import { Meme, TIER_CONFIG, RARITY_CONFIG, UserTier, MemeRarity } from '../types';

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

interface UserProfileModalProps {
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ onClose }) => {
  const { user, logout } = useAuth();
  const [myMemes, setMyMemes] = useState<Meme[]>([]);
  const [stats, setStats] = useState<UserStats>({ totalMemes: 0, totalLikes: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'memes'>('info');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [memesData, statsData] = await Promise.all([
        memeService.getMyMemes(user.id),
        memeService.getStats(user.id)
      ]);
      setMyMemes(memesData.memes);
      setStats(statsData);
    } catch (error) {
      console.error('加载用户数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (memeId: string) => {
    if (!user) return;
    const result = await memeService.delete(memeId, user.id);
    if (result.success) {
      setMyMemes(prev => prev.filter(m => m.id !== memeId));
      setStats(prev => ({ ...prev, totalMemes: prev.totalMemes - 1 }));
      setDeleteConfirm(null);
    }
  };

  const handleToggleVisibility = async (memeId: string, currentlyPublic: boolean) => {
    if (!user) return;
    try {
      const action = currentlyPublic ? 'ENCRYPT' : 'BROADCAST';
      const result = await memeService.broadcast(memeId, user.id, action);
      if (result.success) {
        setMyMemes(prev => prev.map(m => 
          m.id === memeId ? { ...m, isPublic: result.isPublic } : m
        ));
      }
    } catch (error) {
      console.error('切换可见性失败:', error);
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  if (!user) return null;

  const joinDate = user.joinedAt ? new Date(user.joinedAt).toLocaleDateString('zh-CN') : '未知';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border-4 border-slate-700 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[16px_16px_0px_0px_rgba(0,0,0,0.5)]">
        
        {/* Header */}
        <div className="bg-slate-800 p-3 border-b-4 border-slate-700 flex justify-between items-center shrink-0">
          <span className="text-neon-blue font-sans font-bold tracking-widest text-sm uppercase">
            {'>>'} 用户终端 (USER_TERMINAL)
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-mono-retro text-xl leading-none">X</button>
        </div>

        {/* User Info Header */}
        <div className="p-6 border-b-2 border-slate-800 shrink-0">
          <div className="flex items-center gap-4">
            {/* Avatar with Tier Border */}
            <div className="relative">
              <div 
                className="w-16 h-16 rounded border-2 flex items-center justify-center text-2xl font-bold"
                style={{ 
                  backgroundColor: user.avatarColor || '#34d399',
                  borderColor: stats.tier ? TIER_CONFIG[stats.tier]?.color || '#475569' : '#475569',
                  boxShadow: stats.tier ? `0 0 15px ${TIER_CONFIG[stats.tier]?.glowColor}` : 'none'
                }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
              {/* Level Badge */}
              <div 
                className="absolute -bottom-1 -right-1 px-2 py-0.5 text-[10px] font-bold rounded"
                style={{ 
                  backgroundColor: stats.tier ? TIER_CONFIG[stats.tier]?.color : '#475569',
                  color: '#000'
                }}
              >
                Lv.{stats.level || 0}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-sans font-bold text-xl text-white uppercase tracking-wide">{user.username}</h2>
                {stats.tier && (
                  <span 
                    className="px-2 py-0.5 text-[10px] font-bold uppercase rounded"
                    style={{ 
                      backgroundColor: `${TIER_CONFIG[stats.tier]?.color}20`,
                      color: TIER_CONFIG[stats.tier]?.color,
                      border: `1px solid ${TIER_CONFIG[stats.tier]?.color}`
                    }}
                  >
                    {TIER_CONFIG[stats.tier]?.labelCN || stats.tier}
                  </span>
                )}
              </div>
              <p className="font-mono-retro text-xs text-slate-500 mt-1">ID: {user.id} | 加入时间: {joinDate}</p>
              
              {/* HASH Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono-retro text-[10px] text-slate-400">
                    MEMORY BUFFER (经验)
                  </span>
                  <span className="font-mono-retro text-[10px]" style={{ color: stats.tier ? TIER_CONFIG[stats.tier]?.color : '#00ff00' }}>
                    {stats.levelProgress?.current || 0} / {stats.levelProgress?.required || 50} HASH
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded overflow-hidden border border-slate-700">
                  <div 
                    className="h-full transition-all duration-500"
                    style={{ 
                      width: `${stats.levelProgress?.percentage || 0}%`,
                      background: stats.tier 
                        ? `linear-gradient(90deg, ${TIER_CONFIG[stats.tier]?.color}, ${TIER_CONFIG[stats.tier]?.glowColor})`
                        : 'linear-gradient(90deg, #00ff00, #00ffaa)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 font-sans font-bold text-sm uppercase tracking-widest transition-colors ${
              activeTab === 'info' 
                ? 'bg-slate-800 text-neon-green border-b-2 border-neon-green' 
                : 'text-slate-500 hover:text-white'
            }`}
          >
            账户信息
          </button>
          <button
            onClick={() => setActiveTab('memes')}
            className={`flex-1 py-3 font-sans font-bold text-sm uppercase tracking-widest transition-colors ${
              activeTab === 'memes' 
                ? 'bg-slate-800 text-neon-green border-b-2 border-neon-green' 
                : 'text-slate-500 hover:text-white'
            }`}
          >
            我的造物 ({stats.totalMemes})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' ? (
            <div className="space-y-6">
              {/* Level & Tier Info */}
              <div className="bg-slate-950 border border-slate-800 p-4">
                <h3 className="font-sans font-bold text-sm text-neon-blue uppercase mb-4">{'>'} 等级信息</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div 
                    className="bg-slate-900 border p-4 text-center"
                    style={{ borderColor: stats.tier ? TIER_CONFIG[stats.tier]?.color : '#475569' }}
                  >
                    <div 
                      className="font-pixel text-4xl mb-1"
                      style={{ color: stats.tier ? TIER_CONFIG[stats.tier]?.color : '#00ff00' }}
                    >
                      {stats.level || 0}
                    </div>
                    <div className="font-mono-retro text-xs text-slate-500">当前等级</div>
                  </div>
                  <div 
                    className="bg-slate-900 border p-4 text-center"
                    style={{ borderColor: stats.tier ? TIER_CONFIG[stats.tier]?.color : '#475569' }}
                  >
                    <div 
                      className="font-sans font-bold text-lg mb-1"
                      style={{ color: stats.tier ? TIER_CONFIG[stats.tier]?.color : '#00ff00' }}
                    >
                      {stats.tier ? TIER_CONFIG[stats.tier]?.labelCN : '未知'}
                    </div>
                    <div className="font-mono-retro text-xs text-slate-500">段位</div>
                  </div>
                </div>
                <div className="space-y-2 font-mono-retro text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">总 HASH 值</span>
                    <span className="text-neon-green font-bold">{stats.hashPoints || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">连续登录</span>
                    <span className="text-neon-yellow font-bold">{stats.loginStreak || 0} 天</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">最高掉落</span>
                    <span 
                      className="font-bold"
                      style={{ color: stats.highestDrop ? RARITY_CONFIG[stats.highestDrop]?.color : '#A0A0A0' }}
                    >
                      [{stats.highestDrop || 'N'}] {stats.highestDrop ? RARITY_CONFIG[stats.highestDrop]?.labelCN : '废弃数据'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Loot Stats */}
              <div className="bg-slate-950 border border-slate-800 p-4">
                <h3 className="font-sans font-bold text-sm text-neon-pink uppercase mb-4">{'>'} 掉落统计</h3>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {(['N', 'R', 'SR', 'SSR', 'UR'] as MemeRarity[]).map((rank) => (
                    <div 
                      key={rank}
                      className="bg-slate-900 border p-2 text-center"
                      style={{ borderColor: RARITY_CONFIG[rank].color }}
                    >
                      <div 
                        className="font-pixel text-xl"
                        style={{ color: RARITY_CONFIG[rank].color }}
                      >
                        {stats.rankCounts?.[rank] || 0}
                      </div>
                      <div 
                        className="font-mono-retro text-[9px]"
                        style={{ color: RARITY_CONFIG[rank].color }}
                      >
                        {rank}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900 border border-slate-700 p-4 text-center">
                    <div className="font-pixel text-3xl text-neon-green mb-1">{stats.totalMemes}</div>
                    <div className="font-mono-retro text-xs text-slate-500">总造物数</div>
                  </div>
                  <div className="bg-slate-900 border border-slate-700 p-4 text-center">
                    <div className="font-pixel text-3xl text-neon-pink mb-1">{stats.totalLikes}</div>
                    <div className="font-mono-retro text-xs text-slate-500">获得点赞</div>
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-slate-950 border border-slate-800 p-4">
                <h3 className="font-sans font-bold text-sm text-slate-400 uppercase mb-4">{'>'} 账户详情</h3>
                <div className="space-y-3 font-mono-retro text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">用户代号</span>
                    <span className="text-white">{user.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">用户 ID</span>
                    <span className="text-white">#{user.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">头像颜色</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: user.avatarColor }}></div>
                      <span className="text-white">{user.avatarColor}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">注册日期</span>
                    <span className="text-white">{joinDate}</span>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-red-500/10 border-2 border-red-500 text-red-500 font-sans font-bold uppercase tracking-widest text-sm hover:bg-red-500 hover:text-white transition-colors"
              >
                断开连接 (LOGOUT)
              </button>
            </div>
          ) : (
            <div>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="font-mono-retro text-neon-green animate-pulse">正在加载数据...</div>
                </div>
              ) : myMemes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-800">
                  <div className="text-4xl mb-4">📦</div>
                  <p className="font-mono-retro text-slate-500">{'>'} 暂无上传的造物</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {myMemes.map((meme) => (
                    <div key={meme.id} className="relative group bg-slate-950 border border-slate-800 overflow-hidden">
                      <div className="aspect-square bg-black relative">
                        {/* 使用预览图（如果有），否则使用原图 */}
                        <img
                          src={meme.previewUrl || meme.url}
                          alt={meme.title}
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-50 transition-opacity"
                          style={{
                            filter: meme.previewUrl ? 'contrast(105%) saturate(90%)' : 'none'
                          }}
                        />
                        {/* 状态标签 */}
                        <div className={`absolute top-1 right-1 px-1.5 py-0.5 text-[8px] font-mono-retro font-bold ${
                          meme.isPublic 
                            ? 'bg-neon-green/80 text-black' 
                            : 'bg-slate-700/80 text-slate-300'
                        }`}>
                          {meme.isPublic ? '📡 DECRYPTED' : '🔒 ENCRYPTED'}
                        </div>
                      </div>
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60">
                        {deleteConfirm === meme.id ? (
                          <div className="text-center p-2">
                            <p className="font-mono-retro text-xs text-red-400 mb-2">确认删除？</p>
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleDelete(meme.id)}
                                className="px-3 py-1 bg-red-500 text-white text-xs font-bold"
                              >
                                确认
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-3 py-1 bg-slate-600 text-white text-xs font-bold"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {/* 可见性切换按钮 */}
                            <button
                              onClick={() => handleToggleVisibility(meme.id, !!meme.isPublic)}
                              className={`px-4 py-2 text-xs font-bold uppercase transition-colors ${
                                meme.isPublic
                                  ? 'bg-slate-600/80 text-slate-300 hover:bg-slate-500'
                                  : 'bg-neon-green/80 text-black hover:bg-neon-green'
                              }`}
                            >
                              {meme.isPublic ? '🔒 加密' : '📡 广播'}
                            </button>
                            {/* 删除按钮 */}
                            <button
                              onClick={() => setDeleteConfirm(meme.id)}
                              className="px-4 py-2 bg-red-500/80 text-white text-xs font-bold uppercase hover:bg-red-600 transition-colors"
                            >
                              删除
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Info Bar */}
                      <div className="p-2 border-t border-slate-800">
                        <p className="font-sans font-bold text-xs text-white truncate">{meme.title}</p>
                        <p className="font-mono-retro text-[10px] text-slate-500">+{meme.likes} XP</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
