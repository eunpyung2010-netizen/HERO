import { GoogleGenAI } from "@google/genai";
import { Quest } from "../types";
import { BIOME_QUESTS, BIOMES } from "../constants";

// Initialize the API client safely
const apiKey = process.env.API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
    try {
        ai = new GoogleGenAI({ apiKey: apiKey });
    } catch (e) {
        console.warn("Google GenAI 클라이언트 초기화 실패 (API 키 확인 필요)");
    }
}

// Fallback chat messages when API is not available
const FALLBACK_MESSAGES = [
    "꾸웩!", "아프다!", "두고보자!", "히잉...", "밥줘...", 
    "강하다...", "도망가자!", "메롱!", "으악!", "살려줘!"
];

// Uses local static data for reliability. API is NOT required for quests.
export const generateQuest = async (playerLevel: number, playerClass: string, context: string, stageLevel: number): Promise<Quest> => {
    // Determine biome index based on STAGE LEVEL (location), not player level.
    // This ensures the quest target actually exists in the current map.
    let biomeIndex = BIOMES.findIndex(b => stageLevel >= b.startStage && stageLevel <= b.endStage);
    
    // Fallbacks
    if (biomeIndex === -1) biomeIndex = BIOMES.length - 1;
    if (stageLevel < BIOMES[0].startStage) biomeIndex = 0;

    const quests = BIOME_QUESTS[biomeIndex] || BIOME_QUESTS[0];
    const template = quests[Math.floor(Math.random() * quests.length)];
    
    // Scale count slightly by player level/3 to add difficulty as they grow
    const count = Math.ceil(template.count * (1 + (playerLevel % 5) * 0.1));

    return {
        title: template.title,
        description: template.desc,
        targetMonster: template.targetMonster,
        targetCount: count,
        currentCount: 0,
        reward: "경험치 & 골드",
        rewardExp: count * 30 * Math.max(1, stageLevel), // Reward scales with stage
        isCompleted: false,
    };
};

export const generateChat = async (keyword: string): Promise<string> => {
   // If no API or error, use fallback immediately
   if (!ai) {
       return FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)];
   }

   try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Write a very short, one-sentence shout (in Korean) that a cute RPG monster would say when attacked. Keyword: ${keyword}. No quotes.`,
    });
    return response.text || FALLBACK_MESSAGES[0];
   } catch (e) {
       return FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)];
   }
};

export const generateImage = async (prompt: string): Promise<string> => {
    if (!ai) {
        throw new Error("API 키가 설정되지 않아 이미지를 생성할 수 없습니다.");
    }

    try {
        // Enhance prompt for better game background quality
        const enhancedPrompt = `${prompt}, high quality, detailed, atmospheric, 2d game background style, wide angle, fantasy art`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: enhancedPrompt }] }
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return part.inlineData.data;
        }
        throw new Error("이미지 생성 실패: 결과 없음");
    } catch (e) {
        console.error("Image Gen Error:", e);
        throw e;
    }
};