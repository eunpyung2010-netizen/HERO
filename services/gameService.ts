
import { Quest } from "../types";
import { BIOME_QUESTS, BIOMES, MONSTER_MESSAGES } from "../constants";

export const generateStaticQuest = (playerLevel: number, stageLevel: number): Quest => {
    // Determine biome index based on STAGE LEVEL (location)
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

export const getRandomChat = (): string => {
   return MONSTER_MESSAGES[Math.floor(Math.random() * MONSTER_MESSAGES.length)];
};
