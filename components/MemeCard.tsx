import React, { useState, useRef, useEffect } from 'react';
import { Meme, MemeRarity, RARITY_CONFIG } from '../types';
import { memeService } from '../services/memeService';

interface MemeCardProps {
  meme: Meme;
  onLike: (id: string) => void;
  currentUserId?: string; // 当前登录用户ID，用于判断是否显示克隆按钮
}

// 属性进度条组件
const StatBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="w-20 text-slate-400 font-mono-retro uppercase tracking-wider">{label}</span>
    <div className="flex-1 h-2 bg-slate-800 border border-slate-700 relative overflow-hidden">
      <div 
        className="h-full transition-all duration-1000 ease-out"
        style={{ 
          width: `${value}%`, 
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}40`
        }}
      />
      {/* 扫描线效果 */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
    </div>
    <span className="w-8 text-right font-mono-retro" style={{ color }}>{value}</span>
  </div>
);

// 稀有度徽章组件
const RarityBadge: React.FC<{ rank: MemeRarity }> = ({ rank }) => {
  const config = RARITY_CONFIG[rank];
  
  return (
    <div 
      className="px-2 py-1 text-xs font-bold font-mono-retro uppercase tracking-widest border"
      style={{ 
        color: config.color,
        borderColor: config.color,
        backgroundColor: `${config.color}15`,
        textShadow: `0 0 8px ${config.color}`,
        boxShadow: `0 0 12px ${config.glowColor}`
      }}
    >
      {rank} · {config.labelCN}
    </div>
  );
};

const MemeCard: React.FC<MemeCardProps> = ({ meme, onLike, currentUserId }) => {
  const [copied, setCopied] = useState(false);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);  // 高清图加载状态
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [cloneCount, setCloneCount] = useState(meme.cloneCount || 0);
  const [isCloning, setIsCloning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const isVideo = meme.type === 'webm' || meme.url.endsWith('.webm') || meme.url.endsWith('.mp4');
  
  // 获取稀有度配置，默认为 R
  const rank = meme.rank || 'R';
  const rarityConfig = RARITY_CONFIG[rank];

  // 双层数据协议：优先使用预览图，然后加载高清
  const previewSrc = meme.previewUrl || meme.url;
  const highResSrc = meme.url;

  // 异步预加载图片 - 双层数据协议
  useEffect(() => {
    if (isVideo) return;

    setIsMediaLoaded(false);
    setIsHighResLoaded(false);
    
    // 阶段1: 加载预览图（快速）
    const previewImg = new Image();
    previewImg.src = previewSrc;
    
    previewImg.onload = () => {
      setIsMediaLoaded(true);
      setTimeout(() => setShowStats(true), 300);
      
      // 阶段2: 后台加载高清图
      if (previewSrc !== highResSrc) {
        const highResImg = new Image();
        highResImg.src = highResSrc;
        highResImg.onload = () => {
          setIsHighResLoaded(true);
          console.log(`✓ 高清图已解密: ${meme.title}`);
        };
      } else {
        // 没有预览图，直接使用原图
        setIsHighResLoaded(true);
      }
    };
    
    previewImg.onerror = () => {
      console.error(`Failed to load preview: ${previewSrc}`);
      setIsMediaLoaded(true);
    };

    return () => {
      previewImg.onload = null;
      previewImg.onerror = null;
    };
  }, [meme.url, meme.previewUrl, isVideo, previewSrc, highResSrc]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(meme.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
        const response = await fetch(meme.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const ext = meme.url.split('.').pop() || 'gif';
        link.download = `artifact_${rank}_${meme.id}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Download failed", err);
        window.open(meme.url, '_blank');
    }
  };

  const handleMouseEnter = () => {
    if (isVideo && videoRef.current) {
        videoRef.current.play().catch(e => console.log("Autoplay prevented", e));
        setIsPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    if (isVideo && videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
    }
  };

  const toggleOverlay = () => {
    setIsOverlayVisible(!isOverlayVisible);
  };

  // 克隆处理
  const handleClone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCloning) return;
    setIsCloning(true);
    try {
      const result = await memeService.clone(meme.id);
      if (result.success && result.cloneCount !== undefined) {
        setCloneCount(result.cloneCount);
      }
    } catch (error) {
      console.error('克隆失败:', error);
    } finally {
      setIsCloning(false);
    }
  };

  // 判断是否可以显示克隆按钮（公共资产 & 非自己的资产）
  const canClone = meme.isPublic && currentUserId && meme.authorId !== currentUserId;

  // 使用 flavor_text 或回退到 description
  const flavorText = meme.flavor_text || meme.description;

  return (
    <div 
        className="group relative bg-slate-900 overflow-hidden transition-all duration-300 hover:-translate-y-2 h-full flex flex-col"
        style={{
          border: `2px solid ${rarityConfig.color}40`,
          boxShadow: `0 4px 20px ${rarityConfig.glowColor}, inset 0 1px 0 ${rarityConfig.color}20`
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
    >
      {/* RPG 卡片头部 - 稀有度指示器 */}
      <div 
        className="p-3 flex justify-between items-center border-b shrink-0 transition-colors"
        style={{ 
          backgroundColor: `${rarityConfig.color}08`,
          borderColor: `${rarityConfig.color}30`
        }}
      >
        <div className="flex gap-2 items-center">
          {/* 稀有度指示灯 */}
          <div 
            className="w-2 h-2 rounded-sm animate-pulse"
            style={{ 
              backgroundColor: rarityConfig.color,
              boxShadow: `0 0 8px ${rarityConfig.color}`
            }}
          />
          <span className="font-mono-retro text-xs text-slate-500 uppercase tracking-wider">
            Hex: 0x{meme.id.slice(-4).padStart(4, '0').toUpperCase()}
          </span>
        </div>
        <RarityBadge rank={rank} />
      </div>

      {/* 图片/视频容器 */}
      <div 
        className="relative w-full h-40 sm:h-56 md:h-64 bg-black flex items-center justify-center overflow-hidden border-b shrink-0 cursor-pointer"
        style={{ borderColor: `${rarityConfig.color}30` }}
        onClick={toggleOverlay}
      >
        {/* 骨架加载占位符 */}
        {!isMediaLoaded && (
            <div className="absolute inset-0 bg-slate-900 z-10 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 animate-pulse"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                <div className="relative text-slate-700">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 opacity-30">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                </div>
            </div>
        )}

        {/* 实际媒体内容 - 双层数据协议渐进式加载 */}
        {isVideo ? (
          <video
            ref={videoRef}
            src={meme.url}
            loop
            muted
            playsInline
            onLoadedData={() => {
              setIsMediaLoaded(true);
              setIsHighResLoaded(true);
              setTimeout(() => setShowStats(true), 300);
            }}
            className={`w-full h-full object-cover transition-opacity duration-500 ease-out ${isMediaLoaded ? 'opacity-90' : 'opacity-0'} ${isOverlayVisible ? 'opacity-30' : 'group-hover:opacity-30'}`}
          />
        ) : (
          <>
            {/* 低清预览层 - Lo-Fi Ghost Cache */}
            <img 
              src={previewSrc} 
              alt={meme.title} 
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out 
                ${isMediaLoaded ? 'opacity-90' : 'opacity-0'} 
                ${isHighResLoaded ? 'opacity-0' : ''}
                ${isOverlayVisible ? 'opacity-30' : 'group-hover:opacity-30'}`}
              style={{
                filter: isHighResLoaded ? 'none' : 'blur(2px) contrast(110%) grayscale(15%)',
              }}
            />
            {/* 高清源层 - R2 Full Resolution */}
            {isHighResLoaded && (
              <img 
                src={highResSrc} 
                alt={meme.title} 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out
                  ${isOverlayVisible ? 'opacity-30' : 'opacity-90 group-hover:opacity-30'}`}
              />
            )}
            {/* 解密状态指示 */}
            {isMediaLoaded && !isHighResLoaded && meme.previewUrl && (
              <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-[9px] font-mono-retro text-neon-green/70 animate-pulse">
                DECRYPTING...
              </div>
            )}
          </>
        )}
        
        {/* 悬停/点击操作覆盖层 */}
        <div 
            className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4 backdrop-blur-[1px] transition-opacity duration-200 
            ${!isMediaLoaded ? 'hidden' : ''} 
            ${isOverlayVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
           <button 
             onClick={handleCopy}
             className={`w-40 py-3 font-sans font-bold tracking-widest text-xs uppercase border-2 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-0.5 active:shadow-none ${copied ? 'bg-neon-green border-neon-green text-black' : 'bg-black border-white text-white hover:bg-white hover:text-black'} transition-all`}
           >
             {copied ? '链接已复制' : '复制来源'}
           </button>
           <button 
             onClick={handleDownload}
             className="w-40 py-3 font-sans font-bold tracking-widest text-xs uppercase border-2 border-neon-blue text-neon-blue bg-black hover:bg-neon-blue hover:text-black shadow-[2px_2px_0px_0px_rgba(56,189,248,0.5)] active:translate-y-0.5 active:shadow-none transition-all"
           >
             保存到磁盘
           </button>
        </div>

        {/* 稀有度角标装饰 */}
        <div 
          className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, transparent 50%, ${rarityConfig.color}30 50%)`,
          }}
        />
      </div>

      {/* 内容主体 */}
      <div className="p-3 sm:p-5 relative flex flex-col flex-1">
        {/* 物品名称 */}
        <h3 
          className="font-sans font-bold text-sm sm:text-lg leading-normal tracking-wide truncate pr-2 uppercase mb-3"
          style={{ 
            color: rarityConfig.color,
            textShadow: `0 0 20px ${rarityConfig.glowColor}`
          }}
        >
          {meme.title}
        </h3>

        {/* RPG 属性面板 */}
        {meme.stats && (
          <div className="bg-slate-950/80 border border-slate-800 p-3 mb-4 space-y-2">
            <StatBar 
              label="精神污染" 
              value={showStats ? meme.stats.psy_damage : 0} 
              color="#e879f9" 
            />
            <StatBar 
              label="纹理完整" 
              value={showStats ? meme.stats.texture_integrity : 0} 
              color="#38bdf8" 
            />
            <StatBar 
              label="病毒潜能" 
              value={showStats ? meme.stats.viral_potential : 0} 
              color="#34d399" 
            />
          </div>
        )}

        {/* 风味描述 */}
        <div className="bg-slate-950 border border-slate-800 p-3 mb-4 font-mono-retro text-sm text-slate-300 relative overflow-hidden shrink-0 leading-relaxed"
          style={{ minHeight: meme.stats ? '60px' : '80px' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950 pointer-events-none"></div>
          <span className="text-slate-500 mr-2">{'>'}</span>
          <span className="italic">"{flavorText}"</span>
        </div>
        
        {/* 标签 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {meme.tags.slice(0, 4).map((tag, idx) => (
            <span 
              key={idx} 
              className="text-xs font-bold font-sans uppercase tracking-widest px-2 py-1 border transition-colors cursor-default"
              style={{
                color: rarityConfig.color,
                borderColor: `${rarityConfig.color}50`,
                backgroundColor: `${rarityConfig.color}10`
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        
        {/* 底部统计栏 */}
        <div className="mt-auto pt-4 border-t flex justify-between items-center font-mono-retro"
          style={{ borderColor: `${rarityConfig.color}30` }}
        >
            <div className="flex items-center gap-3">
              <button 
                  onClick={(e) => {
                      e.stopPropagation();
                      onLike(meme.id);
                  }}
                  className="text-sm flex items-center gap-1 cursor-pointer hover:text-white transition-all select-none focus:outline-none p-1 -ml-1 active:scale-95"
                  style={{ color: rarityConfig.color }}
                  title="Grant XP"
              >
                  <span className="font-bold">+</span>
                  <span>经验</span>
                  <span className="font-bold text-lg ml-1">{meme.likes}</span>
              </button>

              {/* 克隆按钮 - 仅在公共feed中显示 */}
              {canClone && (
                <button
                  onClick={handleClone}
                  disabled={isCloning}
                  className={`text-sm flex items-center gap-1 transition-all select-none focus:outline-none p-1 active:scale-95 ${
                    isCloning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:text-neon-pink'
                  }`}
                  style={{ color: '#e879f9' }}
                  title="Clone to collection"
                >
                  <span>📋</span>
                  <span className="font-bold">{cloneCount}</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
                <button 
                    onClick={handleCopy}
                    className={`text-xs flex items-center gap-1 transition-colors p-1 font-sans font-bold tracking-wide ${copied ? 'text-neon-green' : 'text-slate-500 hover:text-neon-blue'}`}
                    title="Copy Link"
                >
                   {copied ? (
                       <span>已复制!</span>
                   ) : (
                       <>
                        <span>分享</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                        </svg>
                       </>
                   )}
                </button>
                <div className="text-slate-600 text-xs uppercase tracking-widest border-l border-slate-800 pl-3 font-mono-retro">
                    @{meme.author}
                </div>
            </div>
        </div>

        {/* 装饰性角落 - 使用稀有度颜色 */}
        <div 
          className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2"
          style={{ borderColor: rarityConfig.color }}
        />
      </div>

      {/* SSR/UR 特殊光效 */}
      {(rank === 'SSR' || rank === 'UR') && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: `radial-gradient(ellipse at center, ${rarityConfig.color}20 0%, transparent 70%)`,
            animation: 'pulse 3s ease-in-out infinite'
          }}
        />
      )}
    </div>
  );
};

export default MemeCard;
