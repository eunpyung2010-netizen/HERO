
import React, { useEffect, useState } from 'react';
import { Player, Quest, Enemy, WeaponType, KeyBindings, MobileControlSettings } from '../types';
import { Star, Map, Skull, Lock, AlertTriangle, ShoppingBag, Zap, Settings, Crown, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Sword, ChevronsUp, Maximize2, Minimize2, Menu, X, RotateCcw } from 'lucide-react';
import { WEAPONS, SKILL_TREE, ADVANCED_CLASS_NAMES, DEFAULT_MOBILE_SETTINGS } from '../constants';

interface UIOverlayProps {
  player: Player;
  boss: Enemy | null; 
  currentQuest: Quest | null;
  logs: string[];
  onGenerateQuest: () => void;
  loadingQuest: boolean;
  onRestart: () => void;
  onOpenShop: () => void;
  onOpenMap: () => void;
  onOpenSkills?: () => void;
  onOpenSettings?: () => void;
  onSwitchWeapon?: (weapon: WeaponType) => void;
  onJobAdvance?: () => void; 
  stageLevel: number;
  biomeName: string;
  keyBindings: KeyBindings;
  showVirtualControls?: boolean; 
  forceMenuOpen?: boolean;
  onCloseMenu?: () => void;
  mobileSettings?: MobileControlSettings;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  player, boss, currentQuest, logs, onGenerateQuest, loadingQuest, onRestart, onOpenShop, onOpenMap, onOpenSkills, onOpenSettings, onSwitchWeapon, onJobAdvance, stageLevel, biomeName, keyBindings, showVirtualControls = true, forceMenuOpen, onCloseMenu, mobileSettings
}) => {
  const hpPercent = (player.hp / player.maxHp) * 100;
  const mpPercent = (player.mp / player.maxMp) * 100;
  const expPercent = (player.exp / player.maxExp) * 100;

  const canAdvance = player.level >= 30 && !player.isAdvanced;
  const settings = mobileSettings || DEFAULT_MOBILE_SETTINGS;

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Use the prop provided by App.tsx as the source of truth for the menu
  const isMobileMenuOpen = forceMenuOpen || false;

  const handleCloseMenu = () => {
      if (onCloseMenu) onCloseMenu();
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Virtual Key Helper
  const simulateKey = (code: string, type: 'keydown' | 'keyup') => {
      window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
  };

  const MobileButton = ({ code, icon: Icon, className, color, label, style, size = 64 }: any) => {
      const defaultColor = "bg-slate-800/60 border-slate-500/50";
      
      return (
        <button
            className={`absolute rounded-full backdrop-blur-md border-2 shadow-lg active:scale-95 transition-transform flex items-center justify-center touch-none select-none ${color || defaultColor} ${className}`}
            style={{ 
                width: size, 
                height: size, 
                ...style 
            }}
            onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation(); 
                simulateKey(code, 'keydown');
            }}
            onPointerUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
                simulateKey(code, 'keyup');
            }}
            onPointerLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                simulateKey(code, 'keyup');
            }}
            onPointerCancel={(e) => {
                e.preventDefault();
                e.stopPropagation();
                simulateKey(code, 'keyup');
            }}
            onContextMenu={(e) => e.preventDefault()}
        >
            {Icon ? <Icon className="text-white/90 drop-shadow-md" size={size * 0.5} /> : <span className="text-white font-bold drop-shadow-md text-lg">{label}</span>}
        </button>
      );
  };

  if (player.isDead) {
      return (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/80 z-50 backdrop-blur-sm pointer-events-auto">
              <div className="text-center p-8 bg-slate-900 border-2 border-red-800 rounded-xl shadow-2xl">
                  <Skull className="w-16 h-16 text-red-600 mx-auto mb-4 animate-pulse" />
                  <h2 className="text-4xl font-black text-white mb-2 tracking-widest uppercase">Game Over</h2>
                  <p className="text-gray-400 mb-6">용사의 모험이 여기서 끝났습니다...</p>
                  <button 
                    onClick={onRestart}
                    className="px-6 py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg transition-transform hover:scale-105"
                  >
                      다시 도전하기
                  </button>
              </div>
          </div>
      )
  }

  // Hotkey mapping for skill slots
  const skillHotkeys = [
      { label: 'A', code: keyBindings.SKILL_1 },
      { label: 'S', code: keyBindings.SKILL_2 },
      { label: 'D', code: keyBindings.SKILL_3 },
      { label: 'F', code: keyBindings.SKILL_4 },
      { label: 'G', code: keyBindings.SKILL_5 },
  ];

  const displayWeapons = ['Sword', 'Spear', 'Bow', 'Gun'];
  if (player.unlockedWeapons.length > 4) {
      const advanced = player.unlockedWeapons.filter(w => !displayWeapons.includes(w));
      displayWeapons.push(...advanced);
  }

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-4 pb-safe pl-safe pr-safe">
      
      {/* BOSS BAR */}
      {boss && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-[85%] md:w-[600px] z-20 animate-in fade-in slide-in-from-top-4 duration-500 pointer-events-none">
              <div className="flex justify-between text-red-500 font-black text-lg mb-1 drop-shadow-md">
                  <div className="flex items-center gap-2">
                      <AlertTriangle className="animate-pulse"/> {boss.type.toUpperCase()}
                  </div>
                  <div>{(boss.hp / boss.maxHp * 100).toFixed(0)}%</div>
              </div>
              <div className="h-4 md:h-6 bg-black/60 rounded-full border-2 border-red-900 overflow-hidden shadow-[0_0_15px_rgba(255,0,0,0.5)]">
                  <div 
                      className="h-full bg-gradient-to-r from-red-700 via-red-500 to-red-700 transition-all duration-200"
                      style={{ width: `${Math.max(0, boss.hp / boss.maxHp * 100)}%` }}
                  ></div>
              </div>
          </div>
      )}
      
      {/* TOP HEADER */}
      <div className="flex justify-between items-start w-full pointer-events-auto">
        
        {/* LEFT: Player Status */}
        {/* Added scale-75 for mobile to reduce overlap */}
        <div className={`flex gap-2 md:gap-3 mt-2 md:mt-0 origin-top-left ${showVirtualControls ? 'scale-75' : 'scale-90 md:scale-100'}`}>
             <div className="relative">
                 <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-800 border-2 border-slate-600 rounded-lg flex items-center justify-center text-3xl md:text-4xl shadow-lg z-10 relative">
                     {player.emoji}
                 </div>
                 <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full border border-blue-400 z-20 shadow-md">
                     Lv.{player.level}
                 </div>
             </div>

             <div className="flex flex-col gap-1 w-40 md:w-60">
                 <div className="flex justify-between items-end text-white leading-none mb-0.5">
                     <span className="font-bold text-sm md:text-lg drop-shadow-md flex items-center gap-2 truncate max-w-[100px] md:max-w-[120px]">
                         {player.name}
                         {player.isAdvanced && <Crown size={12} className="text-yellow-400 fill-yellow-400"/>}
                     </span>
                     <span className="text-[9px] md:text-[10px] text-gray-400 uppercase tracking-wider">{player.isAdvanced ? ADVANCED_CLASS_NAMES[player.classType] : player.classType}</span>
                 </div>
                 
                 <div className="relative h-3 md:h-4 bg-slate-900/80 rounded-sm border border-slate-600 overflow-hidden group">
                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300" style={{ width: `${Math.max(0, hpPercent)}%` }} />
                    <div className="absolute inset-0 flex items-center justify-center text-[8px] md:text-[9px] font-bold text-white/90 group-hover:text-white drop-shadow-sm z-10">
                       {Math.ceil(player.hp)} / {player.maxHp}
                    </div>
                 </div>

                 <div className="relative h-3 md:h-4 bg-slate-900/80 rounded-sm border border-slate-600 overflow-hidden group">
                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-300" style={{ width: `${Math.max(0, mpPercent)}%` }} />
                    <div className="absolute inset-0 flex items-center justify-center text-[8px] md:text-[9px] font-bold text-white/90 group-hover:text-white drop-shadow-sm z-10">
                       {Math.floor(player.mp)} / {player.maxMp}
                    </div>
                 </div>

                 {/* EXP BAR RESTORED */}
                 <div className="relative h-2 md:h-2.5 bg-slate-900/90 rounded-sm border border-slate-600 mt-0.5 overflow-hidden shadow-inner group" title={`EXP: ${player.exp} / ${player.maxExp}`}>
                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-200 transition-all duration-300" style={{ width: `${Math.min(100, expPercent)}%` }} />
                    <div className="absolute inset-0 flex items-center justify-center text-[7px] md:text-[8px] font-black text-black/70 z-10 tracking-widest">
                       EXP {(expPercent).toFixed(1)}%
                    </div>
                 </div>
             </div>
        </div>

        {/* CENTER: Stage Info (Hidden on very small screens in landscape to save space) */}
        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 top-4 flex-col items-center pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md px-4 py-1 rounded-full border border-white/10 mb-1">
                <span className="text-yellow-400 font-bold text-xs tracking-[0.2em]">STAGE {stageLevel}</span>
            </div>
            <div className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wide">
                {biomeName}
            </div>
             {canAdvance && (
                <button 
                    onClick={onJobAdvance}
                    className="mt-4 pointer-events-auto bg-gradient-to-r from-yellow-600 to-red-600 hover:from-yellow-500 hover:to-red-500 text-white font-black py-2 px-6 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.6)] animate-bounce border-2 border-white/50"
                >
                    👑 전직 가능! (Click)
                </button>
            )}
        </div>

        {/* RIGHT: Menu Buttons */}
        <div className="flex flex-col items-end gap-3 mt-2 md:mt-0">
             {/* Desktop Menu - Hidden on Mobile */}
             <div className="hidden lg:flex gap-2">
                 <button 
                    onClick={onRestart}
                    className="bg-red-900/80 hover:bg-red-800 text-white p-2 rounded-lg border border-red-700 shadow-lg active:scale-95 transition-all group"
                    title="새로 시작"
                 >
                     <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500"/>
                 </button>
                 <button 
                    onClick={toggleFullScreen}
                    className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg border border-slate-600 shadow-lg active:scale-95 transition-all group"
                    title="전체화면"
                 >
                     {isFullscreen ? <Minimize2 className="w-5 h-5"/> : <Maximize2 className="w-5 h-5"/>}
                 </button>
                 <button 
                    onClick={onOpenSkills}
                    className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg border border-slate-600 shadow-lg active:scale-95 transition-all group relative"
                    title="스킬 트리 (K)"
                 >
                     <Zap className="w-5 h-5 group-hover:text-green-300" />
                     {player.sp > 0 && (
                         <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                         </span>
                     )}
                 </button>
                 <button 
                    onClick={onOpenMap}
                    className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg border border-slate-600 shadow-lg active:scale-95 transition-all group"
                    title="지도 열기 (M)"
                 >
                     <Map className="w-5 h-5 group-hover:text-blue-300" />
                 </button>
                 <button 
                    onClick={onOpenShop}
                    className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg border border-slate-600 shadow-lg active:scale-95 transition-all group"
                    title="상점 열기 (B)"
                 >
                     <ShoppingBag className="w-5 h-5 group-hover:text-yellow-300" />
                 </button>
                 <button 
                    onClick={onOpenSettings}
                    className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg border border-slate-600 shadow-lg active:scale-95 transition-all group"
                    title="설정"
                 >
                     <Settings className="w-5 h-5 group-hover:text-gray-300" />
                 </button>
             </div>
             
             {/* Mobile Menu & Potions - Visible on Mobile landscape */}
             {showVirtualControls && (
                 <div className="lg:hidden pointer-events-auto flex gap-2 items-center absolute top-4 right-4">
                     {/* Mobile Potions (Moved from MobileControls to Overlay) */}
                     <button
                        onPointerDown={(e) => { e.preventDefault(); simulateKey(keyBindings.POTION_HP, 'keydown'); }}
                        className="w-10 h-10 bg-red-950 border border-red-600 rounded-full flex items-center justify-center active:scale-95 relative"
                     >
                         <span className="text-lg">🍷</span>
                         <span className="absolute -top-1 -right-1 bg-red-600 text-[9px] w-4 h-4 rounded-full flex items-center justify-center text-white border border-black">{player.hpPotions}</span>
                     </button>
                     <button
                        onPointerDown={(e) => { e.preventDefault(); simulateKey(keyBindings.POTION_MP, 'keydown'); }}
                        className="w-10 h-10 bg-blue-950 border border-blue-600 rounded-full flex items-center justify-center active:scale-95 relative"
                     >
                         <span className="text-lg">🧪</span>
                         <span className="absolute -top-1 -right-1 bg-blue-600 text-[9px] w-4 h-4 rounded-full flex items-center justify-center text-white border border-black">{player.mpPotions}</span>
                     </button>

                     <button 
                        onPointerDown={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation();
                            if (onCloseMenu) onCloseMenu(); // This toggles it in parent
                        }}
                        className="bg-slate-800/80 hover:bg-slate-700 text-white p-2 rounded-full border border-slate-500/50 shadow-xl active:scale-95 transition-all backdrop-blur-sm ml-2"
                     >
                         <Menu className="w-6 h-6" />
                     </button>
                 </div>
             )}

             {/* Quest Log - Collapsible or simplified on mobile */}
             <div className="hidden lg:flex bg-slate-900/90 text-white p-3 rounded-lg border-l-4 border-yellow-500 shadow-xl w-64 backdrop-blur-sm pointer-events-auto flex-col">
                <div className="flex items-center gap-2 mb-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <h3 className="font-bold text-sm text-yellow-100 truncate">
                        {currentQuest ? currentQuest.title : "모험 대기중..."}
                    </h3>
                </div>
                {currentQuest ? (
                    <div className="space-y-2">
                        <div className="bg-black/40 rounded p-2">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-400">{currentQuest.targetMonster}</span>
                                <span className="text-yellow-400 font-bold">{currentQuest.currentCount} / {currentQuest.targetCount}</span>
                            </div>
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-yellow-500 transition-all duration-300"
                                    style={{ width: `${Math.min(100, (currentQuest.currentCount / currentQuest.targetCount) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 line-clamp-2">{currentQuest.description}</p>
                    </div>
                ) : (
                    <div className="text-center py-2">
                        <button 
                            onClick={onGenerateQuest}
                            disabled={loadingQuest}
                            className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors shadow-lg animate-pulse"
                        >
                            {loadingQuest ? "준비중..." : "퀘스트 받기"}
                        </button>
                    </div>
                )}
             </div>
        </div>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-lg p-6 flex flex-col pointer-events-auto animate-in fade-in zoom-in-95 duration-200" style={{ touchAction: 'pan-y' }}>
              <div className="flex justify-between items-center mb-8 flex-shrink-0">
                  <h2 className="text-2xl font-black text-white">메뉴 (Menu)</h2>
                  <button 
                    onPointerDown={(e) => { e.preventDefault(); handleCloseMenu(); }}
                    className="p-2 bg-slate-800 rounded-full border border-slate-600 text-white"
                  >
                      <X size={24} />
                  </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto pb-4">
                   <button type="button" onClick={() => { handleCloseMenu(); onOpenShop(); }} className="cursor-pointer touch-manipulation flex flex-col items-center justify-center bg-slate-800 border-2 border-slate-700 hover:border-yellow-500 rounded-xl p-6 gap-3 active:scale-95 transition-all">
                       <ShoppingBag size={40} className="text-yellow-400" />
                       <span className="text-white font-bold text-lg">상점 (Shop)</span>
                   </button>
                   <button type="button" onClick={() => { handleCloseMenu(); onOpenSkills && onOpenSkills(); }} className="cursor-pointer touch-manipulation flex flex-col items-center justify-center bg-slate-800 border-2 border-slate-700 hover:border-green-500 rounded-xl p-6 gap-3 active:scale-95 transition-all relative">
                       <Zap size={40} className="text-green-400" />
                       <span className="text-white font-bold text-lg">스킬 (Skills)</span>
                       {player.sp > 0 && <span className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full animate-ping"/>}
                   </button>
                   <button type="button" onClick={() => { handleCloseMenu(); onOpenMap(); }} className="cursor-pointer touch-manipulation flex flex-col items-center justify-center bg-slate-800 border-2 border-slate-700 hover:border-blue-500 rounded-xl p-6 gap-3 active:scale-95 transition-all">
                       <Map size={40} className="text-blue-400" />
                       <span className="text-white font-bold text-lg">지도 (Map)</span>
                   </button>
                   <button type="button" onClick={() => { handleCloseMenu(); onOpenSettings && onOpenSettings(); }} className="cursor-pointer touch-manipulation flex flex-col items-center justify-center bg-slate-800 border-2 border-slate-700 hover:border-gray-500 rounded-xl p-6 gap-3 active:scale-95 transition-all">
                       <Settings size={40} className="text-gray-300" />
                       <span className="text-white font-bold text-lg">설정 (Settings)</span>
                   </button>
                   <button type="button" onClick={() => { handleCloseMenu(); onRestart(); }} className="cursor-pointer touch-manipulation flex flex-col items-center justify-center bg-red-900/30 border-2 border-red-700 hover:border-red-500 rounded-xl p-6 gap-3 active:scale-95 transition-all">
                       <RotateCcw size={40} className="text-red-400"/>
                       <span className="text-white font-bold text-lg">새로 시작</span>
                   </button>
                   <button type="button" onClick={() => { handleCloseMenu(); toggleFullScreen(); }} className="cursor-pointer touch-manipulation flex flex-col items-center justify-center bg-slate-800 border-2 border-slate-700 hover:border-purple-500 rounded-xl p-6 gap-3 active:scale-95 transition-all">
                       {isFullscreen ? <Minimize2 size={40} className="text-purple-400"/> : <Maximize2 size={40} className="text-purple-400"/>}
                       <span className="text-white font-bold text-lg">전체화면</span>
                   </button>
              </div>
          </div>
      )}

      {/* VIRTUAL CONTROLS FOR MOBILE (LANDSCAPE ONLY) */}
      {showVirtualControls && (
          <div className="lg:hidden fixed inset-0 pointer-events-none z-40" style={{ opacity: settings.opacity }}>
               {/* D-Pad (Left) - Enhanced MOBA Style */}
               <div 
                    className="absolute pointer-events-auto"
                    style={{ 
                        left: `${settings.dpadX + 5}%`, 
                        bottom: `${settings.dpadY + 10}%`,
                        transform: `scale(${settings.scale})`
                    }}
               >
                    <div className="relative w-48 h-48 bg-slate-800/30 rounded-full border border-white/10 backdrop-blur-[2px]">
                        {/* Center Decor */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-slate-700/50 rounded-full border border-white/5"></div>
                        
                        {/* Directional Buttons */}
                        <MobileButton code={keyBindings.UP} icon={ArrowUp} size={60} className="top-1 left-1/2 -translate-x-1/2" />
                        <MobileButton code={keyBindings.LEFT} icon={ArrowLeft} size={60} className="left-1 top-1/2 -translate-y-1/2" />
                        <MobileButton code={keyBindings.RIGHT} icon={ArrowRight} size={60} className="right-1 top-1/2 -translate-y-1/2" />
                        <MobileButton code={keyBindings.DOWN} icon={ArrowDown} size={60} className="bottom-1 left-1/2 -translate-x-1/2" />
                    </div>
               </div>

               {/* Action Buttons (Right) - Enhanced Arc Layout */}
               <div 
                    className="absolute pointer-events-auto"
                    style={{ 
                        right: `${settings.actionX + 5}%`, 
                        bottom: `${settings.actionY + 8}%`,
                        transform: `scale(${settings.scale})`
                    }}
               >
                    <div className="relative w-64 h-64">
                        {/* Main Attack - Bottom Right Anchor */}
                        <MobileButton 
                            code={keyBindings.ATTACK} 
                            icon={Sword} 
                            size={85}
                            color="bg-red-600/70 border-red-400 shadow-red-900/50"
                            style={{ right: 10, bottom: 10 }}
                            className="z-20"
                        />
                        
                        {/* Jump - Secondary, slightly inward */}
                        <MobileButton 
                            code={keyBindings.JUMP} 
                            icon={ChevronsUp} 
                            size={70}
                            color="bg-blue-600/70 border-blue-400 shadow-blue-900/50"
                            style={{ right: 100, bottom: 20 }}
                            className="z-10"
                        />

                        {/* Skills Arc */}
                        {/* Skill 1 (A) */}
                        <MobileButton 
                            code={keyBindings.SKILL_1} 
                            label="A"
                            size={50}
                            color="bg-indigo-600/60 border-indigo-400"
                            style={{ right: 20, bottom: 110 }}
                        />
                        {/* Skill 2 (S) */}
                        <MobileButton 
                            code={keyBindings.SKILL_2} 
                            label="S"
                            size={50}
                            color="bg-indigo-600/60 border-indigo-400"
                            style={{ right: 80, bottom: 100 }}
                        />
                         {/* Skill 3 (D) */}
                        <MobileButton 
                            code={keyBindings.SKILL_3} 
                            label="D"
                            size={50}
                            color="bg-indigo-600/60 border-indigo-400"
                            style={{ right: 130, bottom: 80 }}
                        />
                         {/* Skill 4 (F) - Further out */}
                        <MobileButton 
                            code={keyBindings.SKILL_4} 
                            label="F"
                            size={45}
                            color="bg-purple-600/60 border-purple-400"
                            style={{ right: 170, bottom: 40 }}
                        />
                    </div>
               </div>
               
               {/* Mobile Job Advance Alert */}
               {canAdvance && (
                   <div className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-auto">
                        <button 
                            onPointerDown={(e) => { e.preventDefault(); onJobAdvance && onJobAdvance(); }}
                            className="bg-yellow-600 text-white text-xs font-bold px-4 py-2 rounded-full animate-bounce shadow-lg border border-yellow-300"
                        >
                            👑 전직하기
                        </button>
                   </div>
               )}
          </div>
      )}

      {/* BOTTOM SECTION (HUD) */}
      <div className="flex justify-between items-end pointer-events-none">
          {/* Logs */}
          <div className="hidden lg:flex w-48 md:w-96 h-24 md:h-40 overflow-hidden flex-col justify-end pointer-events-auto mask-image-gradient p-4 mb-0">
              <div className="space-y-1">
                  {logs.slice(0, 5).map((log, i) => (
                      <div key={i} className="text-xs text-white/90 drop-shadow-md bg-black/40 px-2 py-0.5 rounded w-fit animate-in fade-in slide-in-from-left-2">
                          {log}
                      </div>
                  ))}
              </div>
          </div>
          
          {/* Skills & Weapons HUD (Desktop) */}
          <div className="hidden lg:flex gap-2 pointer-events-auto p-4 items-end">
              {/* Potions & Gold */}
              <div className="flex gap-2 mr-2">
                  <div 
                    onClick={() => simulateKey(keyBindings.POTION_HP, 'keydown')}
                    className="w-12 h-12 rounded border-2 border-gray-600 bg-black/60 flex items-center justify-center text-xl relative group cursor-pointer active:scale-95" title="HP 물약">
                      🍷
                      <div className="absolute -top-2 -right-2 bg-red-600 text-[10px] min-w-[1.25rem] h-5 rounded-full flex items-center justify-center border border-red-400 text-white shadow-sm font-bold px-1">
                          {player.hpPotions}
                      </div>
                      <div className="absolute bottom-0.5 right-1 text-[8px] text-gray-400 font-bold group-hover:text-white">Q</div>
                  </div>
                   <div 
                    onClick={() => simulateKey(keyBindings.POTION_MP, 'keydown')}
                    className="w-12 h-12 rounded border-2 border-gray-600 bg-black/60 flex items-center justify-center text-xl relative group cursor-pointer active:scale-95" title="MP 물약">
                      🧪
                      <div className="absolute -top-2 -right-2 bg-blue-600 text-[10px] min-w-[1.25rem] h-5 rounded-full flex items-center justify-center border border-blue-400 text-white shadow-sm font-bold px-1">
                          {player.mpPotions}
                      </div>
                      <div className="absolute bottom-0.5 right-1 text-[8px] text-gray-400 font-bold group-hover:text-white">W</div>
                  </div>

                  {/* Gold Display */}
                  <div className="h-12 px-3 rounded-lg border-2 border-yellow-600/80 bg-black/70 flex flex-col items-center justify-center min-w-[80px]" title="골드">
                      <span className="text-[10px] text-yellow-500 font-bold leading-none mb-0.5">GOLD</span>
                      <span className="text-white font-mono font-bold text-sm leading-none flex items-center gap-1">
                          💰 {player.gold.toLocaleString()}
                      </span>
                  </div>
              </div>

              <div className="w-px h-12 bg-white/10 mx-2"></div>

              {/* Weapons (Dynamic List) */}
              <div className="flex gap-1">
                {displayWeapons.map((w, i) => {
                    const unlocked = player.unlockedWeapons.includes(w as WeaponType);
                    const weaponInfo = WEAPONS[w as any];
                    const isAdvancedWeapon = !['Sword', 'Spear', 'Bow', 'Gun'].includes(w);
                    
                    return (
                        <div key={w} 
                            onClick={() => unlocked && onSwitchWeapon?.(w as WeaponType)}
                            className={`
                            w-12 h-12 rounded border-2 flex items-center justify-center text-xl transition-all relative cursor-pointer
                            ${player.currentWeapon === w ? 'border-yellow-400 bg-yellow-900/50 scale-110 shadow-lg z-10' : 
                                unlocked ? (isAdvancedWeapon ? 'border-purple-500 bg-purple-900/30' : 'border-gray-600 bg-black/60') + ' text-white/50 hover:bg-gray-800' : 'border-gray-800 bg-black/80 text-gray-700'}
                        `}>
                            {unlocked ? weaponInfo.emoji : <Lock size={16}/>}
                            
                            {i < 4 && (
                                <div className="absolute -top-2 -right-2 bg-gray-700 text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-gray-500 text-white shadow-sm font-bold">
                                    {i+1}
                                </div>
                            )}
                        </div>
                    )
                })}
              </div>
              
              <div className="w-px h-12 bg-white/10 mx-2"></div>

              {/* Dynamic Skill Slots */}
              {skillHotkeys.map((slot, i) => {
                  const skillId = player.skillSlots[slot.code];
                  const skill = skillId ? SKILL_TREE.find(s => s.id === skillId) : null;
                  const cooldown = skillId ? (player.cooldowns[skillId] || 0) : 0;
                  
                  return (
                      <div key={slot.label} 
                        onClick={() => simulateKey(slot.code, 'keydown')}
                        className={`
                          w-12 h-12 rounded border-2 flex items-center justify-center text-xl transition-all relative
                          ${skill ? 'border-indigo-600 bg-black/60 hover:bg-indigo-900 cursor-pointer active:scale-95' : 'border-gray-800 bg-black/80 text-gray-700'}
                      `}>
                         {skill ? skill.icon : <span className="text-gray-700 text-xs">Empty</span>}
                         
                         <div className="absolute -top-2 -right-2 bg-gray-700 text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-gray-500 text-white shadow-sm font-bold">
                             {slot.label}
                         </div>

                         {cooldown > 0 && (
                             <div className="absolute inset-0 bg-black/70 rounded flex items-center justify-center">
                                 <span className="text-white font-bold text-xs">{Math.ceil(cooldown / 60)}</span>
                             </div>
                         )}

                         {skill && skill.mpCost && (
                             <div className="absolute top-full mt-1 right-0 text-[9px] font-bold text-blue-300 drop-shadow-md whitespace-nowrap bg-black/60 px-1 rounded-sm">
                                 {skill.mpCost} MP
                             </div>
                         )}
                      </div>
                  );
              })}
          </div>
      </div>
    </div>
  );
};

export default UIOverlay;
