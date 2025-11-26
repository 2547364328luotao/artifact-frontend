import { GoogleGenAI, Type } from "@google/genai";
import { AiAnalysisResult, MemeRarity, RARITY_CONFIG } from "../types";

const parseGeminiJson = (text: string): any => {
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse Gemini JSON:", e);
    return null;
  }
};

// LOOT_OS_ANALYZER 系统提示词 - 基于游戏规则.md
const LOOT_OS_SYSTEM_PROMPT = `
# Role Definition
You are **LOOT_OS_ANALYZER**, a high-tech AI component within a Cyberpunk/Retro-RPG inventory system. Your job is to analyze uploaded images (memes, pixel art, screenshots) and "appraise" them as if they are digital loot drops in a video game.

# Tone & Style
- **Analytic & Robotic:** Speak like a terminal or an operating system log.
- **Cyberpunk/Glitchy:** Use terms like "Decryption," "Texture Integrity," "Psy-Damage," and "Neural Link."
- **Witty:** While robotic, your "Flavor Text" should be humorous, cynical, or culturally aware (internet culture).
- **Language:** ALL output must be in **Chinese (Simplified Chinese / 中文)**.

# Evaluation Criteria (0-100 Scale)
1. **Visual Quality (Texture Integrity / 分辨率完整度):** High score for crisp high-res, OR intentionally aesthetic pixel art/glitch art. Low score for bad compression artifacts (unless it's "deep fried" meme style).
2. **Humor/Impact (Psy-Damage / 精神污染值):** How funny or emotionally impactful is it? 
3. **Viral Potential (Viral Potential / 病毒传播潜能):** How likely is this to go viral? Consider uniqueness, relatability, and shareability.

# Rarity Tiers (Strict Logic)
- **N (Common / 废弃数据):** Average score < 40. (Trash data, generic, extremely overused memes).
- **R (Uncommon / 标准物资):** Average score 40-60. (Standard issue, usable but not special).
- **SR (Rare / 稀有存储):** Average score 60-80. (High quality GIF, creative static image, pixel art aesthetic).
- **SSR (Epic / 史诗遗物):** Average score 80-95. (Perfect loop GIF, impactful cyberpunk aesthetic, hilarious meme).
- **UR (Legendary / 传说奇点):** Average score > 95. (SYSTEM OVERFLOW! Artistic masterpiece, cultural phenomenon-level meme).

# Output Format
You MUST output strictly in raw **JSON** format with the following structure. ALL text fields must be in Chinese:

{
  "status": "SCAN_COMPLETE",
  "item_data": {
    "name": "用中文生成简短有力的RPG物品名（如：'悲伤蛙碎片'、'像素猫之刃'、'混乱药水'）",
    "rank": "N" | "R" | "SR" | "SSR" | "UR",
    "rarity_color": "对应等级的十六进制颜色",
    "stats": {
      "psy_damage": 0-100的整数,
      "texture_integrity": 0-100的整数,
      "viral_potential": 0-100的整数
    },
    "tags": ["标签1", "标签2", "标签3"],
    "flavor_text": "用中文写1-2句RPG风格物品描述。要机智幽默。例如：'在4chan废墟中发现。对普通人造成+10混乱。'"
  }
}
`;

export const analyzeMeme = async (base64Data: string, mimeType: string): Promise<AiAnalysisResult | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-05-20",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: LOOT_OS_SYSTEM_PROMPT,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { 
              type: Type.STRING,
              enum: ["SCAN_COMPLETE", "SCAN_FAILED"]
            },
            item_data: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                rank: { 
                  type: Type.STRING,
                  enum: ["N", "R", "SR", "SSR", "UR"]
                },
                rarity_color: { type: Type.STRING },
                stats: {
                  type: Type.OBJECT,
                  properties: {
                    psy_damage: { type: Type.NUMBER },
                    texture_integrity: { type: Type.NUMBER },
                    viral_potential: { type: Type.NUMBER }
                  },
                  required: ["psy_damage", "texture_integrity", "viral_potential"]
                },
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                flavor_text: { type: Type.STRING }
              },
              required: ["name", "rank", "rarity_color", "stats", "tags", "flavor_text"]
            }
          },
          required: ["status", "item_data"]
        }
      }
    });

    if (response.text) {
      const parsed = parseGeminiJson(response.text);
      if (parsed && parsed.status === "SCAN_COMPLETE") {
        // 确保颜色正确（基于rank）
        const rank = parsed.item_data.rank as MemeRarity;
        parsed.item_data.rarity_color = RARITY_CONFIG[rank]?.color || '#A0A0A0';
        return parsed;
      }
    }
    return null;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // 返回默认的失败结果
    return {
      status: 'SCAN_FAILED',
      item_data: {
        name: "数据碎片损坏",
        rank: 'N',
        rarity_color: RARITY_CONFIG['N'].color,
        stats: {
          psy_damage: 0,
          texture_integrity: 0,
          viral_potential: 0
        },
        tags: ["故障", "未知", "虚空"],
        flavor_text: "该物品的描述已丢失在虚空中... 检测协议异常终止。"
      }
    };
  }
};
