import React, { useState, useRef, useEffect } from 'react';
import { aiService } from '../services/aiService';
import { smartUpload } from '../services/r2Service';
import { Meme, AiAnalysisResult, RARITY_CONFIG, MemeRarity } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { memeService } from '../services/memeService';

interface UploadModalProps {
  onClose: () => void;
  onUpload: (newMeme: Meme) => void;
}

type CropMode = 'original' | 'square' | 'wide';

// BIOS 风格扫描阶段
type ScanPhase = 'idle' | 'decrypting' | 'analyzing' | 'calculating' | 'complete';

const SCAN_PHASES: { phase: ScanPhase; text: string; duration: number }[] = [
  { phase: 'decrypting', text: 'DECRYPTING DATA STRUCTURE...', duration: 800 },
  { phase: 'analyzing', text: 'ANALYZING PIXEL MATRIX...', duration: 1200 },
  { phase: 'calculating', text: 'CALCULATING RARITY VALUE...', duration: 1000 },
  { phase: 'complete', text: 'SCAN COMPLETE', duration: 500 }
];

// 扫描动画组件
const ScanAnimation: React.FC<{ phase: ScanPhase; result: AiAnalysisResult | null }> = ({ phase, result }) => {
  const phaseIndex = SCAN_PHASES.findIndex(p => p.phase === phase);
  const rank = result?.item_data?.rank || 'R';
  const config = RARITY_CONFIG[rank];
  
  return (
    <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-20 backdrop-blur-sm font-mono-retro">
      {/* 扫描线效果 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="w-full h-1 bg-gradient-to-r from-transparent via-neon-green to-transparent opacity-50 animate-[scanline_2s_linear_infinite]" 
          style={{ animation: 'scanline 2s linear infinite' }}
        />
      </div>
      
      {/* BIOS 风格头部 */}
      <div className="text-neon-green text-xs mb-8 tracking-widest animate-pulse">
        [ LOOT_OS ANALYZER v2.0.1 ]
      </div>
      
      {/* 进度指示器 */}
      <div className="w-80 space-y-3 mb-8">
        {SCAN_PHASES.slice(0, -1).map((p, idx) => (
          <div key={p.phase} className="flex items-center gap-3">
            <div className={`w-3 h-3 border ${
              idx < phaseIndex ? 'bg-neon-green border-neon-green' : 
              idx === phaseIndex ? 'border-neon-green animate-pulse' : 
              'border-slate-600'
            }`} />
            <span className={`text-sm tracking-wider ${
              idx <= phaseIndex ? 'text-neon-green' : 'text-slate-600'
            }`}>
              {p.text}
            </span>
            {idx < phaseIndex && <span className="text-neon-green ml-auto">[OK]</span>}
            {idx === phaseIndex && <span className="text-yellow-400 ml-auto animate-pulse">...</span>}
          </div>
        ))}
      </div>
      
      {/* 进度条 */}
      <div className="w-80 h-4 border-2 border-neon-green/50 p-0.5 mb-6">
        <div 
          className="h-full bg-neon-green transition-all duration-500"
          style={{ width: `${Math.min((phaseIndex + 1) / SCAN_PHASES.length * 100, 100)}%` }}
        />
      </div>
      
      {/* 扫描完成时显示结果预览 */}
      {phase === 'complete' && result?.item_data && (
        <div 
          className="text-center space-y-2 animate-[fadeIn_0.5s_ease-out]"
          style={{ color: config.color }}
        >
          <div className="text-2xl font-bold tracking-wider" style={{ textShadow: `0 0 20px ${config.glowColor}` }}>
            [ {rank} ] {config.labelCN}
          </div>
          <div className="text-lg">{result.item_data.name}</div>
        </div>
      )}
      
      {/* 装饰性角落 */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-neon-green/30" />
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-neon-green/30" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-neon-green/30" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-neon-green/30" />
    </div>
  );
};

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onUpload }) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropMode, setCropMode] = useState<CropMode>('original');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanPhase, setScanPhase] = useState<ScanPhase>('idle');
  const [analysisResult, setAnalysisResult] = useState<AiAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Floating Window State
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Check for mobile and initialize position
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    if (!initialized.current) {
        const startX = window.innerWidth / 2 - 384;
        const startY = Math.max(40, window.innerHeight / 2 - 300); 
        setPos({ x: startX, y: startY });
        initialized.current = true;
    }

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    if (e.button !== 0) return;
    setIsDragging(true);
    
    if (modalRef.current) {
        const rect = modalRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    }
    e.stopPropagation();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || isMobile) return;
    setPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
    });
  };

  useEffect(() => {
    if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    } else {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, isMobile]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setCropMode('original');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const cropImage = (src: string, mode: CropMode): Promise<string> => {
    return new Promise((resolve) => {
      if (mode === 'original') {
        resolve(src);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            resolve(src);
            return;
        }

        let renderWidth = img.width;
        let renderHeight = img.height;
        let offsetX = 0;
        let offsetY = 0;

        const targetAspect = mode === 'square' ? 1 : (16 / 9);
        const sourceAspect = img.width / img.height;

        if (sourceAspect > targetAspect) {
           renderHeight = img.height;
           renderWidth = img.height * targetAspect;
           offsetX = (img.width - renderWidth) / 2;
           offsetY = 0;
        } else {
           renderWidth = img.width;
           renderHeight = img.width / targetAspect;
           offsetX = 0;
           offsetY = (img.height - renderHeight) / 2;
        }

        canvas.width = renderWidth;
        canvas.height = renderHeight;

        ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight, 0, 0, renderWidth, renderHeight);
        resolve(canvas.toDataURL(file?.type || 'image/png'));
      };
      img.src = src;
    });
  };

  // 执行 BIOS 风格的扫描动画
  const runScanAnimation = async (): Promise<void> => {
    for (const phaseConfig of SCAN_PHASES) {
      setScanPhase(phaseConfig.phase);
      await new Promise(resolve => setTimeout(resolve, phaseConfig.duration));
    }
  };

  const handleSubmit = async () => {
    if (!file || !preview) return;

    setIsAnalyzing(true);
    setScanPhase('idle');
    setAnalysisResult(null);

    try {
      // 1. 处理裁剪
      const processedDataUrl = await cropImage(preview, cropMode);
      const base64Data = processedDataUrl.split(',')[1];
      const mimeType = file.type;

      // 2. 启动扫描动画（同时进行AI分析）
      const [analysis] = await Promise.all([
        aiService.analyzeImage(base64Data, mimeType),
        runScanAnimation()
      ]);

      if (analysis && analysis.item_data) {
        setAnalysisResult(analysis);
        
        // 显示结果一会儿
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 3. 上传到 R2 对象存储
        const uploadResult = await smartUpload(processedDataUrl);
        
        const itemData = analysis.item_data;
        
        const memeData = {
          url: uploadResult.url,
          title: itemData.name,
          description: itemData.flavor_text,
          flavor_text: itemData.flavor_text,
          tags: itemData.tags,
          type: mimeType.includes('gif') ? 'gif' : 'image',
          author: user ? user.username : 'GUEST_USER',
          authorId: user?.id,
          base64Preview: uploadResult.base64Preview,  // 低清预览 (Lo-Fi Ghost Cache)
          base64Backup: uploadResult.base64Backup,
          storageType: uploadResult.storageType,
          // RPG 属性
          rank: itemData.rank,
          rarity_color: itemData.rarity_color,
          stats: itemData.stats
        };

        // 4. 上传到后端
        if (user && user.id) {
          const uploadData = {
            userId: user.id,
            url: uploadResult.url,
            title: itemData.name,
            description: itemData.flavor_text,
            flavor_text: itemData.flavor_text,
            tags: itemData.tags,
            type: mimeType.includes('gif') ? 'gif' : 'image',
            base64Preview: uploadResult.base64Preview,  // 低清预览
            base64Backup: uploadResult.base64Backup,
            storageType: uploadResult.storageType,
            rank: itemData.rank,
            rarity_color: itemData.rarity_color,
            stats: itemData.stats
          };
          const result = await memeService.upload(uploadData);
          if (result.success && result.meme) {
            onUpload(result.meme!);
            onClose();
          } else {
            throw new Error(result.error || '上传失败');
          }
        } else {
          // 游客模式 - 创建本地 meme
          const newMeme: Meme = {
            id: Date.now().toString(),
            ...memeData,
            uploadedAt: new Date(),
            likes: 0
          } as Meme;
          onUpload(newMeme);
          onClose();
        }
      } else {
         alert('鉴定失败。造物过于模糊或数据损坏。');
      }

    } catch (error) {
      console.error(error);
      alert('上传错误_500');
    } finally {
      setIsAnalyzing(false);
      setScanPhase('idle');
    }
  };

  const isGif = file?.type.includes('gif');

  return (
    <div className={`fixed inset-0 z-[60] pointer-events-none ${isMobile ? 'flex items-center justify-center bg-black/80' : ''}`}>
      
      <div 
        ref={modalRef}
        style={isMobile ? {} : { 
            left: `${pos.x}px`, 
            top: `${pos.y}px`,
            position: 'absolute'
        }}
        className={`bg-slate-900 border-4 border-slate-700 w-full relative pointer-events-auto transition-shadow flex flex-col
          ${isMobile ? 'h-full max-w-none m-0 border-0 fixed inset-0 z-[70]' : 'max-w-3xl shadow-[16px_16px_0px_0px_rgba(0,0,0,0.5)] max-h-[90vh]'}
        `}
      >
        
        {/* Retro Header */}
        <div 
            onMouseDown={handleMouseDown}
            className={`bg-slate-800 text-white font-sans font-bold tracking-widest text-sm md:text-base p-4 flex justify-between items-center border-b-4 border-slate-700 select-none shrink-0
              ${isMobile ? '' : 'cursor-grab active:cursor-grabbing'}
            `}
        >
            <span className="text-neon-green pointer-events-none">{'>>'} LOOT_OS 鉴定向导.EXE {user && `[USER:${user.username}]`}</span>
            <button 
                onMouseDown={(e) => e.stopPropagation()} 
                onClick={onClose} 
                className="hover:bg-red-500 hover:text-white px-3 py-1 transition-colors font-mono-retro text-xl leading-none border border-transparent hover:border-white"
            >
                X
            </button>
        </div>

        <div className="p-4 md:p-6 flex-1 flex flex-col overflow-y-auto">
          {!preview ? (
            <div 
              className="border-2 border-dashed border-slate-600 bg-slate-950/50 flex-1 min-h-[300px] flex flex-col items-center justify-center cursor-pointer hover:border-neon-pink hover:bg-slate-900 transition-all group relative overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
              <div className="text-5xl md:text-6xl mb-6 group-hover:-translate-y-2 transition-transform duration-300">📦</div>
              <p className="font-sans font-bold tracking-wide text-sm md:text-base text-slate-400 group-hover:text-white transition-colors text-center px-4 leading-relaxed">
                {isMobile ? '点击上传数字造物' : '拖拽数字造物到此处'}
              </p>
              <p className="font-mono-retro text-sm text-slate-600 mt-3">[ JPG / PNG / GIF ]</p>
              <p className="font-mono-retro text-xs text-neon-green/50 mt-2">LOOT_OS 将自动分析并鉴定其稀有度</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col relative">
              
              {/* 扫描动画覆盖层 */}
              {isAnalyzing && (
                <ScanAnimation phase={scanPhase} result={analysisResult} />
              )}
              
              {/* Preview Canvas */}
              <div className="relative border-2 border-slate-700 bg-black p-0 flex-1 flex items-center justify-center min-h-[300px] overflow-hidden mb-6">
                 
                 <div className={`transition-all duration-300 relative
                    ${cropMode === 'original' ? 'w-full h-full' : ''}
                    ${cropMode === 'square' ? 'aspect-square w-auto h-full max-w-full' : ''}
                    ${cropMode === 'wide' ? 'aspect-video w-full h-auto' : ''}
                 `}>
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className={`w-full h-full ${cropMode === 'original' ? 'object-contain' : 'object-cover'}`} 
                    />
                    
                    {cropMode !== 'original' && !isAnalyzing && (
                        <div className="absolute inset-0 border border-white/30 pointer-events-none grid grid-cols-3 grid-rows-3">
                            {[...Array(9)].map((_, i) => <div key={i} className="border border-white/10"></div>)}
                        </div>
                    )}
                 </div>
              </div>

              {/* Tools & Controls */}
              {!isAnalyzing && (
                 <div className="space-y-6">
                    
                    {/* Aspect Ratio Tools */}
                    {!isGif ? (
                        <div className="flex justify-center gap-3 mb-2">
                             {(['original', 'square', 'wide'] as CropMode[]).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setCropMode(mode)}
                                    className={`px-4 py-2 font-sans font-bold tracking-wide text-sm uppercase border border-slate-600 transition-all
                                        ${cropMode === mode ? 'bg-neon-pink text-black border-neon-pink shadow-[2px_2px_0px_0px_rgba(232,121,249,0.5)]' : 'bg-slate-900 text-slate-400 hover:text-white hover:border-white'}
                                    `}
                                >
                                    {mode === 'original' ? '原始' : mode === 'square' ? '1:1' : '16:9'}
                                </button>
                             ))}
                        </div>
                    ) : (
                        <div className="text-center font-sans text-sm text-slate-500 mb-2 tracking-wide">[ 检测到动态图像 - 裁剪已禁用 ]</div>
                    )}

                    <div className="flex gap-6 shrink-0">
                        <button 
                            onClick={() => setPreview(null)}
                            className="flex-1 py-4 md:py-4 border-2 border-slate-600 text-slate-400 font-sans font-bold tracking-widest text-base hover:bg-slate-800 hover:text-white transition-colors"
                        >
                            取消
                        </button>
                        <button 
                            onClick={handleSubmit}
                            className="flex-1 py-4 md:py-4 bg-neon-green text-black font-sans font-bold tracking-widest text-base border-2 border-neon-green hover:bg-white hover:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none transition-all"
                        >
                            开始鉴定
                        </button>
                    </div>
                 </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
