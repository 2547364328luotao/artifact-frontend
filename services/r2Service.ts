// R2 对象存储服务

// API 基础路径
// 如果是开发环境，使用相对路径（走 Vite 代理）
// 如果是生产环境，使用环境变量配置的完整后端地址
const API_DOMAIN = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || '');
const API_BASE = `${API_DOMAIN}/api/r2`;

export interface R2UploadResult {
  success: boolean;
  url?: string;
  objectKey?: string;
  size?: number;
  mimeType?: string;
  error?: string;
  fallback?: boolean; // 是否需要回退到 Base64 存储
}

export interface R2Status {
  success: boolean;
  configured: boolean;
  bucketName: string;
  hasPublicUrl: boolean;
}

/**
 * 生成低清预览图 (Lo-Fi Ghost Cache)
 * 风格化压缩：320px宽度，40%质量，轻微去饱和
 */
export async function generateLoFiPreview(base64Data: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(base64Data); // 降级返回原图
        return;
      }

      // 计算缩略尺寸 (最大宽度 320px)
      const maxWidth = 320;
      const scale = Math.min(maxWidth / img.width, 1);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      // 绘制缩小的图像
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 应用"冷存储"风格效果 - 轻微去饱和
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // 80% 饱和度 (向灰度方向移动20%)
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const saturation = 0.8;
        
        data[i] = Math.round(r * saturation + gray * (1 - saturation));
        data[i + 1] = Math.round(g * saturation + gray * (1 - saturation));
        data[i + 2] = Math.round(b * saturation + gray * (1 - saturation));
      }
      
      ctx.putImageData(imageData, 0, 0);

      // 输出低质量 JPEG (质量 40%)
      const loFiBase64 = canvas.toDataURL('image/jpeg', 0.4);
      
      console.log(`✓ Lo-Fi Preview: ${canvas.width}x${canvas.height}, ~${Math.round(loFiBase64.length / 1024)}KB`);
      resolve(loFiBase64);
    };

    img.onerror = () => {
      console.warn('预览图生成失败，使用原图');
      resolve(base64Data);
    };

    img.src = base64Data;
  });
}

/**
 * 上传图片到 Cloudflare R2
 * @param base64Data - 完整的 base64 数据 URL (包含 data:image/xxx;base64, 前缀)
 * @param filename - 可选的文件名
 */
export async function uploadToR2(base64Data: string, filename?: string): Promise<R2UploadResult> {
  try {
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Data,
        filename,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('R2 上传失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '上传失败',
      fallback: true,
    };
  }
}

/**
 * 检查 R2 配置状态
 */
export async function checkR2Status(): Promise<R2Status> {
  try {
    const response = await fetch(`${API_BASE}/status`);
    return await response.json();
  } catch (error) {
    return {
      success: false,
      configured: false,
      bucketName: '',
      hasPublicUrl: false,
    };
  }
}

/**
 * 智能上传：优先使用 R2，失败则回退到 Base64
 * 同时生成低清预览图用于快速加载
 */
export async function smartUpload(base64Data: string): Promise<{
  url: string;
  base64Preview: string;   // 低清预览 (Lo-Fi Ghost Cache)
  base64Backup: string;    // 原图备份 (仅在R2失败时使用)
  storageType: 'r2' | 'base64';
}> {
  // 1. 生成低清预览图 (并行处理)
  const loFiPromise = generateLoFiPreview(base64Data);
  
  // 2. 尝试上传到 R2
  const r2Result = await uploadToR2(base64Data);
  
  // 等待预览图生成完成
  const loFiPreview = await loFiPromise;
  
  if (r2Result.success && r2Result.url) {
    // R2 上传成功 - 使用 R2 URL 作为高清源
    console.log('✓ 双层存储协议激活: R2(高清) + Base64(预览)');
    return {
      url: r2Result.url,
      base64Preview: loFiPreview,  // 低清预览用于快速加载
      base64Backup: '',            // R2 成功时不需要完整备份
      storageType: 'r2',
    };
  }

  // R2 失败，回退到 Base64 存储
  console.log('⚠ R2 上传失败，使用 Base64 双层存储');
  return {
    url: base64Data,               // 原图作为主URL
    base64Preview: loFiPreview,    // 低清预览
    base64Backup: base64Data,      // 保留完整备份
    storageType: 'base64',
  };
}
