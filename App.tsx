import React, { useState, useEffect } from 'react';
import RetroBackground from './components/RetroBackground';
import MemeCard from './components/MemeCard';
import MemeCardSkeleton from './components/MemeCardSkeleton';
import UploadModal from './components/UploadModal';
import AuthModal from './components/AuthModal';
import UserProfileModal from './components/UserProfileModal';
import { Meme, FeedChannel, FEED_CHANNEL_CONFIG } from './types';
import { useAuth } from './contexts/AuthContext';
import { memeService } from './services/memeService';

// Initial Mock Data with User Provided GIFs - Localized
const INITIAL_MEMES: Meme[] = [
  {
    id: '1',
    url: 'https://fl.20050508.xyz/image/in_BAJCEC_by_NaiDrawBotAgADlhkAAo8X6Fc.gif',
    title: '连击中断 (COMBO BREAKER)',
    description: '当单元测试全部通过，但集成测试瞬间爆炸时触发。',
    tags: ['暴击', '伤害', 'BOSS战'],
    uploadedAt: new Date(),
    likes: 899,
    type: 'gif',
    author: 'CodeWizard'
  },
  {
    id: '2',
    url: 'https://fl.20050508.xyz/image/in_BAJCEC_by_NaiDrawBotAgADoxUAAp9zsVU.gif',
    title: 'NPC 混乱状态',
    description: '发现遗留代码文档。可读性：0。',
    tags: ['任务', '解谜', '传说'],
    uploadedAt: new Date(),
    likes: 404,
    type: 'gif',
    author: 'BugHunter'
  },
  {
    id: '3',
    url: 'https://fl.20050508.xyz/image/in_BAJCEC_by_NaiDrawBotAgADOBkAAshvsVU.gif',
    title: '史莱姆伙伴',
    description: '装备物品。在长时间编码过程中提供 +10 士气。',
    tags: ['同伴', '稀有', '增益'],
    uploadedAt: new Date(),
    likes: 1337,
    type: 'gif',
    author: 'PixelArtist'
  },
  {
    id: '4',
    url: 'https://media.giphy.com/media/l0HlHJGHe3yAMhdQY/giphy.gif',
    title: '部署协议启动',
    description: '正在初始化序列。成功概率：极低。',
    tags: ['事件', '风险', '混乱'],
    uploadedAt: new Date(),
    likes: 128,
    type: 'gif',
    author: 'SysAdmin'
  }
];

const App: React.FC = () => {
  const { user, logout } = useAuth();
  const [memes, setMemes] = useState<Meme[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // 仅用于首次加载骨架屏
  const [currentChannel, setCurrentChannel] = useState<FeedChannel>('LIVE_STREAM');

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 从后端加载表情包 - 立即返回数据，不阻塞渲染
  useEffect(() => {
    loadMemes(currentChannel);
  }, [currentChannel]);

  const loadMemes = async (channel: FeedChannel) => {
    try {
      const data = await memeService.getAll(channel);
      // 如果数据库为空，使用默认数据
      if (data.memes.length === 0 && channel === 'LIVE_STREAM') {
        // 保留本地缓存的数据作为备用
        const saved = localStorage.getItem('pixel_drop_memes_v1');
        if (saved) {
          setMemes(JSON.parse(saved, (key, value) => {
            if (key === 'uploadedAt') return new Date(value);
            return value;
          }));
        }
      } else {
        setMemes(data.memes);
      }
    } catch (error) {
      console.error('加载表情包失败:', error);
    } finally {
      setIsInitialLoading(false); // API 返回后立即关闭骨架屏
    }
  };

  const handleUpload = (newMeme: Meme) => {
    setMemes([newMeme, ...memes]);
  };

  const handleLike = async (id: string) => {
    // 先乐观更新 UI
    setMemes(currentMemes => 
      currentMemes.map(meme => 
        meme.id === id ? { ...meme, likes: meme.likes + 1 } : meme
      )
    );
    // 后端同步
    await memeService.like(id);
  };

  const handleCraftClick = () => {
    if (user) {
      setIsUploadOpen(true);
    } else {
      setIsAuthOpen(true);
    }
  };

  const filteredMemes = memes.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="relative min-h-screen pb-20 font-sans text-slate-200">
      <RetroBackground />
      
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-pixel-dark/90 backdrop-blur-md border-b-2 border-slate-800 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer group select-none">
              <div className="relative w-8 h-8 md:w-10 md:h-10 transform group-hover:rotate-12 transition-transform duration-300">
                 <div className="absolute inset-0 bg-neon-pink rounded-none translate-x-1 translate-y-1"></div>
                 <div className="relative w-full h-full bg-white border-2 border-black flex items-center justify-center">
                    <span className="text-lg md:text-xl text-black font-bold">A</span>
                 </div>
              </div>
              <div className="flex flex-col">
                <span className="font-pixel text-white text-[10px] md:text-xs sm:text-sm tracking-tighter">ARTIFACT<span className="text-neon-green">.EXE</span></span>
                <span className="font-mono-retro text-slate-500 text-[8px] md:text-[10px] tracking-widest uppercase hidden sm:inline">Inv. System v2.0</span>
              </div>
            </div>

            {/* Desktop Search */}
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <div className="relative group">
                 <div className="absolute inset-0 bg-neon-blue/20 rounded-none transform skew-x-12 opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                 <input 
                  type="text" 
                  placeholder="搜索物品..." 
                  className="relative w-full bg-slate-900 border-2 border-slate-700 rounded-none py-2 pl-4 pr-10 text-neon-green font-mono-retro text-lg focus:outline-none focus:border-neon-pink focus:bg-black transition-all placeholder-slate-600"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                 />
                 <span className="absolute right-3 top-2.5 text-slate-500 font-pixel text-[10px] animate-pulse">_</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {user ? (
                 <div className="hidden md:flex items-center gap-3 border-r-2 border-slate-700 pr-3 mr-1">
                    <button 
                      onClick={() => setIsProfileOpen(true)}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <div className="text-right">
                          <div className="font-sans font-bold text-xs text-neon-blue uppercase">{user.username}</div>
                          <div className="font-mono-retro text-[10px] text-slate-500">LV.1 ADMIN</div>
                      </div>
                      <div className="w-8 h-8 rounded bg-slate-700 border border-slate-500" style={{ backgroundColor: user.avatarColor || '#334155' }}></div>
                    </button>
                    <button onClick={logout} className="text-slate-500 hover:text-red-400 text-xs font-mono-retro hover:underline">[登出]</button>
                 </div>
              ) : (
                <button 
                    onClick={() => setIsAuthOpen(true)}
                    className="hidden md:block font-sans font-bold text-xs text-slate-400 hover:text-neon-green mr-2 tracking-widest"
                >
                    // 登录系统
                </button>
              )}

              <button 
                onClick={handleCraftClick}
                className="relative group bg-slate-800 border-2 border-slate-600 hover:border-neon-green hover:bg-slate-900 text-white font-pixel text-[8px] md:text-[10px] py-2 px-3 md:py-3 md:px-6 transition-all active:translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:shadow-[2px_2px_0px_0px_rgba(52,211,153,1)] md:hover:shadow-[4px_4px_0px_0px_rgba(52,211,153,1)]"
              >
                <span className="flex items-center gap-2">
                  <span>+</span> <span className="hidden sm:inline">铸造物品</span><span className="sm:hidden">铸造</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
        
        {/* Mobile Search */}
        <div className="md:hidden mb-8 relative">
             <input 
              type="text" 
              placeholder="搜索数据库..." 
              className="w-full bg-slate-900/80 border-2 border-slate-700 p-3 text-neon-green font-mono-retro focus:outline-none focus:border-neon-pink focus:bg-black transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
             />
             <div className="absolute right-3 top-3 text-slate-600">🔍</div>
        </div>

        {/* Hero Banner Area */}
        <div className="mb-8 md:mb-12 relative border-l-4 border-neon-pink pl-4 md:pl-6 py-2 flex justify-between items-end">
            <div>
                <h1 className="font-pixel text-xl md:text-4xl text-white mb-2 tracking-wide leading-tight">
                THE <span className="text-neon-pink">NEXUS</span>
                </h1>
                <p className="font-mono-retro text-base md:text-xl text-slate-400 max-w-2xl leading-relaxed">
                {'>'} 正在访问公共网格...<br/>
                {'>'} 已解密 <span className="text-neon-green">{filteredMemes.length}</span> 个造物。<br/>
                <span className="hidden sm:inline">{'>'} 使用 <span className="bg-slate-800 text-white px-1 font-bold">铸造物品</span> 来分析新资产。</span>
                </p>
            </div>
            
            {/* Mobile User Status */}
            {user && (
                <div className="md:hidden flex items-center gap-2">
                     <div className="w-6 h-6 rounded border border-slate-500" style={{ backgroundColor: user.avatarColor }}></div>
                     <span className="font-sans font-bold text-xs text-neon-blue">{user.username}</span>
                </div>
            )}
        </div>

        {/* Channel Tabs - THE NEXUS */}
        <div className="mb-6 md:mb-8 flex flex-wrap gap-2 md:gap-3">
          {(Object.keys(FEED_CHANNEL_CONFIG) as FeedChannel[]).map((channel) => {
            const config = FEED_CHANNEL_CONFIG[channel];
            const isActive = currentChannel === channel;
            return (
              <button
                key={channel}
                onClick={() => setCurrentChannel(channel)}
                className={`
                  px-3 py-2 md:px-4 md:py-2 font-mono-retro text-xs md:text-sm uppercase tracking-wider
                  border-2 transition-all
                  ${isActive 
                    ? 'bg-neon-green/20 border-neon-green text-neon-green shadow-[0_0_10px_rgba(52,211,153,0.3)]' 
                    : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                  }
                `}
              >
                <span className="mr-1">{config.icon}</span>
                <span className="hidden sm:inline">{config.labelCN}</span>
                <span className="sm:hidden">{config.icon}</span>
              </button>
            );
          })}
          
          {/* Channel Description */}
          <div className="hidden md:flex items-center ml-auto font-mono-retro text-xs text-slate-500">
            <span className="text-neon-green mr-2">{'>'}</span>
            {FEED_CHANNEL_CONFIG[currentChannel].description}
          </div>
        </div>

        {/* Gallery Grid - Responsive Gaps and Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {/* 仅在首次加载且无数据时显示骨架屏 */}
          {isInitialLoading && memes.length === 0 ? (
            <>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <MemeCardSkeleton key={`skeleton-${i}`} />
              ))}
            </>
          ) : (
            /* 立即渲染所有卡片 - 每个卡片独立管理自己的图片加载状态 */
            filteredMemes.map((meme) => (
              <MemeCard key={meme.id} meme={meme} onLike={handleLike} currentUserId={user?.id} />
            ))
          )}
        </div>

        {!isInitialLoading && filteredMemes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-800 bg-slate-900/30">
            <div className="font-pixel text-2xl md:text-4xl mb-4 text-slate-700">空插槽 (EMPTY_SLOT)</div>
            <p className="font-mono-retro text-slate-500 text-lg md:text-xl text-center px-4">{'>'} 未找到匹配的物品。</p>
          </div>
        )}
      </main>

      {isUploadOpen && (
        <UploadModal 
          onClose={() => setIsUploadOpen(false)} 
          onUpload={handleUpload} 
        />
      )}

      {isAuthOpen && (
        <AuthModal onClose={() => setIsAuthOpen(false)} />
      )}

      {isProfileOpen && (
        <UserProfileModal onClose={() => setIsProfileOpen(false)} />
      )}
    </div>
  );
};

export default App;