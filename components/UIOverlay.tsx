import React, { useEffect, useState } from 'react';
import { Player, Quest, Enemy, WeaponType, KeyBindings, MobileControlSettings } from '../types';
import { Star, Map, Skull, Lock, AlertTriangle, ShoppingBag, Zap, Settings, Camera, Crown, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Sword, ChevronsUp, Maximize2, Minimize2, Menu, X, RotateCcw } from 'lucide-react';
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
  onOpenImageEditor?: () => void;
  onSwitchWeapon?: (weapon: WeaponType) => void;
  onJobAdvance?: () => void; 
  stageLevel: number;
  biomeName: string;
  keyBindings: KeyBindings;
  showVirtualControls?: boolean; // New prop to control visibility
  forceMenuOpen?: boolean;
  onCloseMenu?: () => void;
  mobileSettings?: MobileControlSettings;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  player, boss, currentQuest, logs, onGenerateQuest, loadingQuest, onRestart, onOpenShop, onOpenMap, onOpenSkills, onOpenSettings, onOpenImageEditor, onSwitchWeapon, onJobAdvance, stageLevel, biomeName, keyBindings, showVirtualControls = true, forceMenuOpen, onCloseMenu, mobileSettings
}) => {
  const hpPercent = (player.hp / player.maxHp) * 100;
  const mpPercent = (player.mp / player.maxMp) * 100;
  const expPercent = (player.exp / player.maxExp) * 100;

  const canAdvance = player.level >= 30 && !player.isAdvanced;
  const settings = mobileSettings || DEFAULT_MOBILE_SETTINGS;

  // Full Screen State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
      if (forceMenuOpen) setIsMobileMenuOpen(true);
  }, [forceMenuOpen]);

  const handleCloseMenu = () => {
      setIsMobileMenuOpen(false);
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

  const MobileButton = ({ code, icon: Icon, className, color = "bg-slate-700/50", label }: any) => (
      <button
          className={`rounded-full backdrop-blur-sm border-2 border-white/20 shadow-lg active:scale-95 transition-transform flex items-center justify-center touch-none select-none ${color} ${className}`}
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
          onContextMenu={(e) => e.preventDefault()}
      >
          {Icon ? <Icon className="text-white/90" size={24} /> : <span className="text-white font-bold">{label}</span>}
      </button>
  );

  if (player.isDead) {
      return (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/80 z-50 backdrop-blur-sm">
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
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-4">
      
      {/* BOSS BAR */}
      {boss && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 w-[90%] md:w-[600px] z-20 animate-in fade-in slide-in-from-top-4 duration-500 pointer-events-none">
              <div className="flex justify-between text-red-500 font-black text-lg mb-1 drop-shadow-md">
                  <div className="flex items-center gap-2">
                      <AlertTriangle className="animate-pulse"/> {boss.type.toUpperCase()}
                  </div>
                  <div>{(boss.hp / boss.maxHp * 100).toFixed(0)}%</div>
              </div>
              <div className="h-6 bg-black/60 rounded-full border-2 border-red-900 overflow-hidden shadow-[0_0_15px_rgba(255,0,0,0.5)]">
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
        <div className="flex gap-3 scale-90 origin-top-left md:scale-100">
             <div className="relative">
                 <div className="w-16 h-16 bg-slate-800 border-2 border-slate-600 rounded-lg flex items-center justify-center text-4xl shadow-lg z-10 relative">
                     {player.emoji}
                 </div>
                 <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-blue-400 z-20 shadow-md">
                     Lv.{player.level}
                 </div>
             </div>

             <div className="flex flex-col gap-1 w-48 md:w-60">
                 <div className="flex justify-between items-end text-white leading-none mb-0.5">
                     <span className="font-bold text-lg drop-shadow-md flex items-center gap-2 truncate max-w-[120px]">
                         {player.name}
                         {player.isAdvanced && <Crown size={14} className="text-yellow-400 fill-yellow-400"/>}
                     </span>
                     <span className="text-[10px] text-gray-400 uppercase tracking-wider">{player.isAdvanced ? ADVANCED_CLASS_NAMES[player.classType] : player.classType}</span>
                 </div>
                 
                 <div className="relative h-4 bg-slate-900/80 rounded-sm border border-slate-600 overflow-hidden group">
                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300" style={{ width: `${Math.max(0, hpPercent)}%` }} />
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/90 group-hover:text-white drop-shadow-sm z-10">
                       {Math.ceil(player.hp)} / {player.maxHp}
                    </div>
                 </div>

                 <div className="relative h-4 bg-slate-900/80 rounded-sm border border-slate-600 overflow-hidden group">
                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-300" style={{ width: `${Math.max(0, mpPercent)}%` }} />
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/90 group-hover:text-white drop-shadow-sm z-10">
                       {player.mp} / {player.maxMp}
                    </div>
                 </div>

                 <div className="relative h-1.5 bg-black/60 rounded-full mt-1 overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-yellow-400 transition-all duration-300" style={{ width: `${expPercent}%` }} />
                 </div>
             </div>
        </div>

        {/* CENTER: Stage Info */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-4 flex-col items-center pointer-events-none">
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
        <div className="flex flex-col items-end gap-3 scale-90 origin-top-right md:scale-100">
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
                    onClick={onOpenImageEditor}
                    className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg border border-slate-600 shadow-lg active:scale-95 transition-all group relative"
                    title="AI 스튜디오"
                 >
                     <Camera className="w-5 h-5 group-hover:text-pink-400" />
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
             
             {/* Mobile Menu Toggle - Visible on Mobile landscape or when forced */}
             {showVirtualControls && (
                 <div className="lg:hidden">
                     <button 
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="bg-slate-800/90 hover:bg-slate-700 text-white p-3 rounded-full border border-slate-500 shadow-xl active:scale-95 transition-all"
                     >
                         <Menu className="w-6 h-6" />
                     </button>
                 </div>
             )}

             <div className="bg-slate-900/90 text-white p-3 rounded-lg border-l-4 border-yellow-500 shadow-xl w-64 backdrop-blur-sm pointer-events-auto">
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
                            {loadingQuest ? "수신중..." : "퀘스트 받기"}
                        </button>
                    </div>
                )}
             </div>
        </div>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
          <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-lg p-6 flex flex-col pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-white">메뉴 (Menu)</h2>
                  <button 
                    onClick={handleCloseMenu}
                    className="p-2 bg-slate-800 rounded-full border border-slate-600 text-white"
                  >
                      <X size={24} />
                  </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto">
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
                   <button type="button" onClick={() => { handleCloseMenu(); onOpenImageEditor && onOpenImageEditor(); }} className="cursor-pointer touch-manipulation flex flex-col items-center justify-center bg-slate-800 border-2 border-slate-700 hover:border-pink-500 rounded-xl p-6 gap-3 active:scale-95 transition-all">
                       <Camera size={40} className="text-pink-400" />
                       <span className="text-white font-bold text-lg">AI 스튜디오</span>
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
          <div className="lg:hidden absolute bottom-0 left-0 w-full h-full pointer-events-none z-40" style={{ opacity: settings.opacity }}>
               {/* D-Pad (Left) - Customizable Position */}
               <div 
                    className="absolute pointer-events-auto origin-bottom-left"
                    style={{ 
                        left: `${settings.dpadX}%`, 
                        bottom: `${settings.dpadY}%`,
                        transform: `scale(${settings.scale})`
                    }}
               >
                    <div className="grid grid-cols-3 gap-1">
                        <div />
                        <MobileButton code={keyBindings.UP} icon={ArrowUp} className="w-16 h-16" />
                        <div />
                        <MobileButton code={keyBindings.LEFT} icon={ArrowLeft} className="w-16 h-16" />
                        <div className="w-16 h-16 bg-slate-800/30 rounded-full" />
                        <MobileButton code={keyBindings.RIGHT} icon={ArrowRight} className="w-16 h-16" />
                        <div />
                        <MobileButton code={keyBindings.DOWN} icon={ArrowDown} className="w-16 h-16" />
                        <div />
                    </div>
               </div>

               {/* Action Buttons (Right) - Customizable Position */}
               <div 
                    className="absolute pointer-events-auto origin-bottom-right"
                    style={{ 
                        right: `${settings.actionX}%`, 
                        bottom: `${settings.actionY}%`,
                        transform: `scale(${settings.scale})`
                    }}
               >
                    <div className="relative w-64 h-64">
                        {/* Main Actions - Scaled Up */}
                        <MobileButton 
                            code={keyBindings.ATTACK} 
                            icon={Sword} 
                            className="absolute bottom-0 right-0 w-24 h-24 bg-red-800/60 border-red-400 rounded-full z-10" 
                        />
                        <MobileButton 
                            code={keyBindings.JUMP} 
                            icon={ChevronsUp} 
                            className="absolute bottom-4 right-28 w-20 h-20 bg-blue-800/60 border-blue-400 rounded-full" 
                        />

                        {/* Magic Keys (Skills) - Arc placement - Scaled Up */}
                        <MobileButton 
                            code={keyBindings.SKILL_1} 
                            label="A"
                            className="absolute top-16 right-28 w-12 h-12 bg-indigo-900/60 border-indigo-400 text-sm" 
                        />
                        <MobileButton 
                            code={keyBindings.SKILL_2} 
                            label="S"
                            className="absolute top-6 right-20 w-12 h-12 bg-indigo-900/60 border-indigo-400 text-sm" 
                        />
                        <MobileButton 
                            code={keyBindings.SKILL_3} 
                            label="D"
                            className="absolute top-0 right-4 w-12 h-12 bg-indigo-900/60 border-indigo-400 text-sm" 
                        />
                        <MobileButton 
                            code={keyBindings.SKILL_4} 
                            label="F"
                            className="absolute -top-14 right-4 w-12 h-12 bg-indigo-900/60 border-indigo-400 text-sm" 
                        />
                    </div>
               </div>
               
               {/* Mobile Job Advance Alert */}
               {canAdvance && (
                   <div className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-auto">
                        <button 
                            onClick={onJobAdvance}
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
          <div className="w-48 md:w-96 h-24 md:h-40 overflow-hidden flex flex-col justify-end pointer-events-auto mask-image-gradient p-4 mb-20 lg:mb-0">
              <div className="space-y-1">
                  {logs.slice(0, 5).map((log, i) => (
                      <div key={i} className="text-xs text-white/90 drop-shadow-md bg-black/40 px-2 py-0.5 rounded w-fit animate-in fade-in slide-in-from-left-2">
                          {log}
                      </div>
                  ))}
              </div>
          </div>
          
          {/* Skills & Weapons HUD - Hidden on Mobile to unclutter, relying on simplified inputs or hotkeys if keyboard attached */}
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
                            
                            {/* Number logic only works for 1-4 for now, rest are click only unless we extend bindings */}
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

              {/* Dynamic Skill Slots (A, S, D, F, G) */}
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
                         
                         {/* Hotkey Number */}
                         <div className="absolute -top-2 -right-2 bg-gray-700 text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-gray-500 text-white shadow-sm font-bold">
                             {slot.label}
                         </div>

                         {/* Cooldown Overlay */}
                         {cooldown > 0 && (
                             <div className="absolute inset-0 bg-black/70 rounded flex items-center justify-center">
                                 <span className="text-white font-bold text-xs">{Math.ceil(cooldown / 60)}</span>
                             </div>
                         )}

                         {/* MP Cost - Moved below the slot to avoid obscuring the icon */}
                         {skill && skill.mpCost && (
                             <div className="absolute top-full mt-1 right-0 text-[9px] font-bold text-blue-300 drop-shadow-md whitespace-nowrap bg-black/60 px-1 rounded-sm">
                                 {skill.mpCost} MP
                             </div>
                         )}
                      </div>
                  );
              })}
          </div>
          
          {/* Mobile Essential HUD (Potions only) - VISIBLE ONLY IN LANDSCAPE (Portrait has its own controls) */}
          {showVirtualControls && (
              <div className="lg:hidden flex flex-col gap-2 pointer-events-auto p-4 absolute top-20 left-4 z-30" style={{ opacity: settings.opacity }}>
                    <div 
                        onClick={() => simulateKey(keyBindings.POTION_HP, 'keydown')}
                        className="w-10 h-10 rounded-full border-2 border-red-500 bg-red-900/80 flex items-center justify-center text-lg shadow-lg active:scale-95 cursor-pointer relative"
                    >
                        🍷
                        <span className="absolute -top-1 -right-1 bg-red-600 text-[10px] w-4 h-4 rounded-full flex items-center justify-center text-white border border-white/50">{player.hpPotions}</span>
                    </div>
                    <div 
                        onClick={() => simulateKey(keyBindings.POTION_MP, 'keydown')}
                        className="w-10 h-10 rounded-full border-2 border-blue-500 bg-blue-900/80 flex items-center justify-center text-lg shadow-lg active:scale-95 cursor-pointer relative"
                    >
                        🧪
                        <span className="absolute -top-1 -right-1 bg-blue-600 text-[10px] w-4 h-4 rounded-full flex items-center justify-center text-white border border-white/50">{player.mpPotions}</span>
                    </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default UIOverlay;