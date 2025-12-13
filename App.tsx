import React, { useState, useCallback, useEffect, useRef } from 'react';
import GameCanvas, { GameCanvasHandle } from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import ShopModal from './components/ShopModal';
import WorldMap from './components/WorldMap';
import SkillTreeModal from './components/SkillTreeModal';
import SettingsModal from './components/SettingsModal';
import ImageEditorModal from './components/ImageEditorModal';
import ClassSelectionModal from './components/ClassSelectionModal';
import { Player, Quest, Enemy, WeaponType, KeyBindings, ClassType } from './types';
import { generateQuest } from './services/geminiService';
import { UPGRADE_COSTS, BIOMES, DEFAULT_KEY_BINDINGS, CLASS_INFOS, ADVANCED_CLASS_NAMES } from './constants';

const App: React.FC = () => {
  const gameRef = useRef<GameCanvasHandle>(null);
  const playerStatsRef = useRef<Player | null>(null); // Ref to hold latest stats
  const [playerStats, setPlayerStats] = useState<Player | null>(null);
  const [bossStats, setBossStats] = useState<Enemy | null>(null);
  const [currentQuest, setCurrentQuest] = useState<Quest | null>(null);
  const [loadingQuest, setLoadingQuest] = useState(false);
  const [gameLogs, setGameLogs] = useState<string[]>([]);
  
  // Game State Flow
  const [isClassSelectionOpen, setIsClassSelectionOpen] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  
  // Modals / Pause State
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
  
  const [stageInfo, setStageInfo] = useState({ level: 1, name: 'Peaceful Forest' });
  const [keyBindings, setKeyBindings] = useState<KeyBindings>(DEFAULT_KEY_BINDINGS);
  const [customBackground, setCustomBackground] = useState<string | null>(null);
  
  // Scaling State
  const [scale, setScale] = useState(1);

  // Derived state for game loop
  const isPaused = isShopOpen || isMapOpen || isSkillsOpen || isSettingsOpen || isImageEditorOpen || isClassSelectionOpen;
  const gameActive = gameStarted && !isGameOver && !isPaused;

  // Refs for tracking state inside effects without dependency loops
  const currentQuestRef = useRef<Quest | null>(null);
  const prevBiomeIndexRef = useRef<number>(0);

  // Sync refs
  useEffect(() => { currentQuestRef.current = currentQuest; }, [currentQuest]);

  // Handle Scaling
  useEffect(() => {
    const handleResize = () => {
       const targetW = 1024;
       const targetH = 600;
       const windowW = window.innerWidth;
       const windowH = window.innerHeight;
       
       // Calculate scale to fit window with some margin
       const scaleX = windowW / targetW;
       const scaleY = windowH / targetH;
       
       // Choose the smaller scale to ensure full fit
       // Clamp max scale to 1.0 (optional, but good for pixel art sharpness if not using pixelated render)
       // We allow < 1 for mobile.
       const newScale = Math.min(scaleX, scaleY);
       setScale(newScale * 0.98); // 98% to prevent scrollbars from rounding errors
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleClassSelect = (classType: ClassType) => {
      const info = CLASS_INFOS[classType];
      
      setPlayerStats({
          id: 'player', x: 0, y: 0, width: 50, height: 60, vx: 0, vy: 0, 
          color: 'blue', emoji: '🧙‍♂️', direction: 1, isDead: false,
          hp: 100, maxHp: 100, mp: 100, maxMp: 100,
          level: 1, exp: 0, maxExp: 100, attack: 10,
          name: info.name, classType: classType, isAdvanced: false,
          isAttacking: false, isDownAttacking: false, attackCooldown: 0, maxAttackCooldown: 20,
          currentWeapon: info.weapon, unlockedWeapons: [info.weapon],
          weaponRotation: 0, invincibilityTimer: 0, gold: 0, 
          hpPotions: 3, mpPotions: 3, maxStageReached: 1, sp: 0, 
          skills: {}, skillSlots: {}, cooldowns: {}, jumps: 0, maxJumps: 1,
          buffs: {}, shield: 0
      });

      setIsClassSelectionOpen(false);
      setGameStarted(true);
      addLog(`${info.name}로 모험을 시작합니다!`);
  };

  const handleStatsUpdate = useCallback((player: Player, boss: Enemy | null, stageLevel: number, biomeName: string) => {
    // Dynamically update name if advanced
    if (player.isAdvanced && ADVANCED_CLASS_NAMES[player.classType]) {
        player.name = ADVANCED_CLASS_NAMES[player.classType];
    }
    setPlayerStats(player);
    playerStatsRef.current = player; 
    setBossStats(boss);
    setStageInfo({ level: stageLevel, name: biomeName });
  }, []);

  const addLog = useCallback((msg: string) => {
    setGameLogs(prev => [msg, ...prev].slice(0, 50));
  }, []);

  const handleGameOver = useCallback(() => {
    setIsGameOver(true);
    addLog("Game Over!");
  }, []);

  const handleRestart = useCallback(() => {
      setIsGameOver(false);
      setGameLogs([]);
      setCurrentQuest(null);
      setIsClassSelectionOpen(true); // Go back to class selection
      setGameStarted(false);
  }, []);

  const handleQuestUpdate = useCallback((newCount: number) => {
      setCurrentQuest(prev => prev ? { ...prev, currentCount: newCount } : null);
  }, []);

  const handleGenerateQuest = async (stageOverride?: number) => {
    const player = playerStatsRef.current;
    if (!player) return;
    setLoadingQuest(true);
    
    const targetStage = stageOverride !== undefined ? stageOverride : stageInfo.level;

    try {
      const newQuest = await generateQuest(
        player.level, 
        player.classType, 
        "",
        targetStage
      );
      setCurrentQuest(newQuest);
      addLog(`📜 퀘스트 수락: ${newQuest.title}`);
    } catch (e) {
      addLog("퀘스트 생성 실패.");
    } finally {
      setLoadingQuest(false);
    }
  };

  const handleQuestComplete = useCallback((rewardExp: number, rewardGold: number) => {
      setCurrentQuest(prev => prev ? { ...prev, isCompleted: true } : null);
      addLog(`보상 획득: ${rewardExp} EXP, ${rewardGold} GOLD`);
      
      setTimeout(() => {
          if (!isGameOver) handleGenerateQuest();
      }, 3000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGameOver]); 

  // Modal Handlers
  const handleOpenShop = () => setIsShopOpen(true);
  const handleCloseShop = () => setIsShopOpen(false);
  const handleOpenMap = () => setIsMapOpen(true);
  const handleCloseMap = () => setIsMapOpen(false);
  const handleOpenSkills = () => setIsSkillsOpen(true);
  const handleCloseSkills = () => setIsSkillsOpen(false);
  const handleOpenSettings = () => setIsSettingsOpen(true);
  const handleCloseSettings = () => setIsSettingsOpen(false);
  
  const handleOpenImageEditor = () => {
    setIsImageEditorOpen(true);
  };
  const handleCloseImageEditor = () => setIsImageEditorOpen(false);
  const handleApplyBackground = (imageUrl: string) => {
      setCustomBackground(imageUrl);
      addLog("새로운 배경이 적용되었습니다.");
      setIsImageEditorOpen(false);
  };

  const handlePurchase = (type: 'POTION_HP' | 'POTION_MP' | 'UPGRADE_ATK' | 'UPGRADE_HP' | 'UPGRADE_MP') => {
      if (!gameRef.current || !playerStats) return;

      let success = false;
      
      if (type === 'POTION_HP') success = gameRef.current.purchasePotion('HP');
      if (type === 'POTION_MP') success = gameRef.current.purchasePotion('MP');
      
      if (type.startsWith('UPGRADE_')) {
          let cost = 0;
          if (type === 'UPGRADE_ATK') cost = Math.floor(UPGRADE_COSTS.ATK.base * Math.pow(UPGRADE_COSTS.ATK.scale, Math.floor((playerStats.attack - 10) / 5)));
          if (type === 'UPGRADE_HP') cost = Math.floor(UPGRADE_COSTS.HP.base * Math.pow(UPGRADE_COSTS.HP.scale, Math.floor((playerStats.maxHp - 100) / 50)));
          if (type === 'UPGRADE_MP') cost = Math.floor(UPGRADE_COSTS.MP.base * Math.pow(UPGRADE_COSTS.MP.scale, Math.floor((playerStats.maxMp - 100) / 30)));
          
          success = gameRef.current.upgradeStat(type.replace('UPGRADE_', '') as any, cost);
      }

      if (success) {
          addLog("구매 성공!");
      } else {
          addLog("골드가 부족합니다.");
      }
  };

  const handleSwitchWeapon = useCallback((weapon: WeaponType) => {
    if (gameRef.current) {
        gameRef.current.switchWeapon(weapon);
    }
  }, []);

  const handleUpgradeSkill = (skillId: string) => {
      if (gameRef.current) {
          gameRef.current.upgradeSkill(skillId);
      }
  };

  const handleAssignSkillSlot = (skillId: string, slotKey: string) => {
      if (gameRef.current) {
          const result = gameRef.current.assignSkillSlot(skillId, slotKey);
          const keyName = slotKey.replace('Digit','').replace('SKILL_', '');
          if (result === 'removed') {
              addLog(`단축키 [${keyName}] 해제되었습니다.`);
          } else {
              addLog(`단축키 [${keyName}] 등록 완료!`);
          }
      }
  };

  const handleJobAdvance = useCallback(() => {
      if (gameRef.current) {
          gameRef.current.jobAdvance();
      }
  }, []);

  const handleUnlockAll = useCallback(() => {
      if (gameRef.current) {
          gameRef.current.unlockAllSkills();
          addLog("치트 활성화: 모든 스킬 및 전직 해금!");
          setIsSettingsOpen(false);
      }
  }, []);

  // Global Key Bindings for Opening Menus
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (!gameStarted) return;
          
          if (!isSettingsOpen && !isImageEditorOpen) {
              if (e.code === keyBindings.MENU_SHOP) setIsShopOpen(prev => !prev);
              if (e.code === keyBindings.MENU_MAP) setIsMapOpen(prev => !prev);
              if (e.code === keyBindings.MENU_SKILL) setIsSkillsOpen(prev => !prev);
          }

          if (e.code === 'Escape') {
              setIsShopOpen(false);
              setIsMapOpen(false);
              setIsSkillsOpen(false);
              setIsSettingsOpen(false);
              setIsImageEditorOpen(false);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, isSettingsOpen, isImageEditorOpen, keyBindings]);
  
  // Initial startup quest
  useEffect(() => {
    if (gameStarted && !currentQuest && playerStats && playerStats.level === 1 && !loadingQuest) {
       handleGenerateQuest();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted, playerStats]); 

  // --- Biome Change Detection ---
  useEffect(() => {
    if (!gameStarted) return;

    const currentStageLevel = stageInfo.level;
    let newBiomeIndex = BIOMES.findIndex(b => currentStageLevel >= b.startStage && currentStageLevel <= b.endStage);
    if (newBiomeIndex === -1) newBiomeIndex = BIOMES.length - 1;

    if (newBiomeIndex !== prevBiomeIndexRef.current) {
        prevBiomeIndexRef.current = newBiomeIndex;
        if (customBackground) {
            setCustomBackground(null);
            addLog("새로운 지역에 도착했습니다.");
        }
        if (currentQuestRef.current && !currentQuestRef.current.isCompleted) {
             addLog("⚠️ 지역이 변경되어 퀘스트가 갱신됩니다.");
             handleGenerateQuest(currentStageLevel);
        }
    }
  }, [stageInfo.level, gameStarted, customBackground]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black overflow-hidden select-none">
        
      {/* Game Wrapper with Scaling */}
      <div 
        className="relative shadow-2xl overflow-hidden bg-slate-800 transition-transform duration-200 origin-center"
        style={{ 
            width: 1024, 
            height: 600,
            transform: `scale(${scale})`
        }}
      >
        <GameCanvas 
          ref={gameRef}
          onStatsUpdate={handleStatsUpdate} 
          onEventLog={addLog}
          onGameOver={handleGameOver}
          onQuestUpdate={handleQuestUpdate}
          onQuestComplete={handleQuestComplete}
          gameActive={gameActive}
          currentQuest={currentQuest}
          keyBindings={keyBindings}
          backgroundImage={customBackground}
          initialClass={playerStats?.classType}
        />
        {playerStats && (
          <UIOverlay 
            player={playerStats} 
            boss={bossStats}
            currentQuest={currentQuest}
            logs={gameLogs}
            onGenerateQuest={() => handleGenerateQuest()}
            loadingQuest={loadingQuest}
            onRestart={handleRestart}
            onOpenShop={handleOpenShop}
            onOpenMap={handleOpenMap}
            onOpenSkills={handleOpenSkills}
            onOpenSettings={handleOpenSettings}
            onOpenImageEditor={handleOpenImageEditor}
            onSwitchWeapon={handleSwitchWeapon}
            stageLevel={stageInfo.level}
            biomeName={stageInfo.name}
            keyBindings={keyBindings}
            onJobAdvance={handleJobAdvance}
          />
        )}

        {/* Render Class Selection on top of game canvas logic */}
        {isClassSelectionOpen && (
           <div className="absolute inset-0 z-50">
               <ClassSelectionModal onSelectClass={handleClassSelect} />
           </div>
        )}

        {isShopOpen && playerStats && (
            <ShopModal 
                player={playerStats} 
                onClose={handleCloseShop} 
                onPurchase={handlePurchase} 
            />
        )}
        {isMapOpen && playerStats && (
            <WorldMap 
                currentStage={stageInfo.level}
                maxStageReached={playerStats.maxStageReached}
                onClose={handleCloseMap}
            />
        )}
        {isSkillsOpen && playerStats && (
            <SkillTreeModal 
                player={playerStats}
                onClose={handleCloseSkills}
                onUpgrade={handleUpgradeSkill}
                onAssignSlot={handleAssignSkillSlot}
                keyBindings={keyBindings}
            />
        )}
        {isSettingsOpen && (
            <SettingsModal
                bindings={keyBindings}
                onSave={setKeyBindings}
                onClose={handleCloseSettings}
                onUnlockAll={handleUnlockAll}
            />
        )}
        {isImageEditorOpen && (
            <ImageEditorModal
                onClose={handleCloseImageEditor}
                onApplyBackground={handleApplyBackground}
            />
        )}
        
        {isPaused && !isGameOver && !isClassSelectionOpen && (
            <div className="absolute top-4 right-4 bg-yellow-500 text-black font-bold px-3 py-1 rounded shadow animate-pulse pointer-events-none z-40">
                PAUSED
            </div>
        )}
      </div>
    </div>
  );
};

export default App;