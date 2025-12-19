
import React from 'react';
import { KeyBindings, Player } from '../types';
import { ArrowLeft, ArrowRight, Sword, ChevronsUp, Zap, Menu } from 'lucide-react';

interface MobileControlsProps {
    keyBindings: KeyBindings;
    onSimulateKey: (code: string, type: 'keydown' | 'keyup') => void;
    player: Player;
    onOpenMenu?: () => void; 
}

const MobileControls: React.FC<MobileControlsProps> = ({ keyBindings, onSimulateKey, player, onOpenMenu }) => {
    
    const handleTouchStart = (code: string, e: React.PointerEvent | React.MouseEvent) => {
        e.preventDefault(); 
        e.stopPropagation();
        onSimulateKey(code, 'keydown');
    };

    const handleTouchEnd = (code: string, e: React.PointerEvent | React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onSimulateKey(code, 'keyup');
    };

    // Button Helper
    const CtrlBtn = ({ code, children, className, color = "bg-slate-800", label, style }: any) => (
        <button
            className={`relative flex items-center justify-center rounded-2xl shadow-[0_4px_0_0_rgba(0,0,0,0.5)] active:shadow-none active:translate-y-1 transition-all touch-none select-none border border-slate-600 active:bg-slate-700 pointer-events-auto ${color} ${className}`}
            style={style}
            onPointerDown={(e) => handleTouchStart(code, e)}
            onPointerUp={(e) => handleTouchEnd(code, e)}
            onPointerLeave={(e) => handleTouchEnd(code, e)}
            onPointerCancel={(e) => handleTouchEnd(code, e)}
            onContextMenu={(e) => e.preventDefault()}
        >
            {children}
            {label && <span className="absolute -bottom-6 text-[10px] text-gray-500 font-bold uppercase tracking-wider pointer-events-none">{label}</span>}
        </button>
    );

    return (
        <div className="absolute inset-0 select-none touch-none overflow-hidden pb-safe px-2 flex flex-col justify-between pointer-events-none">
            
            {/* Top HUD Area for Portrait Mode (Gold/Potions) */}
            <div className="flex justify-between items-center p-2 bg-slate-800/80 border-t border-slate-700 pointer-events-auto">
                 <div className="flex items-center gap-3">
                     <button
                        onPointerDown={(e) => handleTouchStart(keyBindings.POTION_HP, e)}
                        className="w-10 h-10 bg-red-950 border border-red-600 rounded-full flex items-center justify-center active:scale-95 relative"
                     >
                         <span className="text-lg">🍷</span>
                         <span className="absolute -top-1 -right-1 bg-red-600 text-[9px] w-4 h-4 rounded-full flex items-center justify-center text-white border border-black">{player.hpPotions}</span>
                     </button>
                     <button
                        onPointerDown={(e) => handleTouchStart(keyBindings.POTION_MP, e)}
                        className="w-10 h-10 bg-blue-950 border border-blue-600 rounded-full flex items-center justify-center active:scale-95 relative"
                     >
                         <span className="text-lg">🧪</span>
                         <span className="absolute -top-1 -right-1 bg-blue-600 text-[9px] w-4 h-4 rounded-full flex items-center justify-center text-white border border-black">{player.mpPotions}</span>
                     </button>
                 </div>
                 
                 <div className="bg-black/40 px-3 py-1 rounded-full border border-yellow-600/30">
                     <span className="text-yellow-400 font-bold text-sm">💰 {player.gold.toLocaleString()}</span>
                 </div>
            </div>

            {/* Bottom Controls Area */}
            <div className="flex justify-between items-end pb-6 px-2">
                
                {/* LEFT: D-PAD (Modified: UP=Jump, No Down) */}
                <div className="relative w-40 h-40 bg-black/20 rounded-full flex-shrink-0 flex items-center justify-center pointer-events-auto">
                    <div className="grid grid-cols-3 gap-1 p-1">
                        {/* Row 1 */}
                        <div />
                        <CtrlBtn code={keyBindings.JUMP} className="w-12 h-12 bg-slate-800 rounded-t-lg" label="JUMP">
                            <ChevronsUp size={24} className="text-blue-400"/>
                        </CtrlBtn>
                        <div />
                        
                        {/* Row 2 */}
                        <CtrlBtn code={keyBindings.LEFT} className="w-12 h-12 bg-slate-800 rounded-l-lg" >
                            <ArrowLeft size={24} className="text-gray-400"/>
                        </CtrlBtn>
                        <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-slate-700 rounded-full"></div>
                        </div>
                        <CtrlBtn code={keyBindings.RIGHT} className="w-12 h-12 bg-slate-800 rounded-r-lg" >
                            <ArrowRight size={24} className="text-gray-400"/>
                        </CtrlBtn>

                        {/* Row 3 (Empty - Down Removed) */}
                        <div />
                        <div className="w-12 h-12" /> {/* Spacer */}
                        <div />
                    </div>
                </div>

                {/* CENTER: MENU BUTTON */}
                <div className="pointer-events-auto mb-4">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onOpenMenu && onOpenMenu(); }}
                        className="bg-slate-700 p-4 rounded-full border-2 border-slate-500 text-white active:scale-95 shadow-lg active:bg-slate-600 transition-colors z-50"
                        style={{ touchAction: 'manipulation' }}
                    >
                        <Menu size={28} />
                    </button>
                </div>

                {/* RIGHT: ACTIONS & SKILLS */}
                <div className="relative w-40 h-48 pointer-events-auto flex flex-col justify-end items-end">
                    
                    {/* Skills Grid - EXPANDED TO 4 BUTTONS */}
                    <div className="grid grid-cols-2 gap-2 mb-4 mr-1">
                         {/* Skill 1 (A) */}
                        <CtrlBtn code={keyBindings.SKILL_1} label="A" color="bg-indigo-900 border-indigo-700" className="w-12 h-12 rounded-xl">
                            <Zap size={20} className="text-yellow-200 fill-yellow-200"/>
                        </CtrlBtn>
                        {/* Skill 2 (S) */}
                        <CtrlBtn code={keyBindings.SKILL_2} label="S" color="bg-green-900 border-green-700" className="w-12 h-12 rounded-xl">
                            <span className="text-sm font-bold text-green-200">S</span>
                        </CtrlBtn>
                        {/* Skill 3 (D) */}
                        <CtrlBtn code={keyBindings.SKILL_3} label="D" color="bg-blue-900 border-blue-700" className="w-12 h-12 rounded-xl">
                            <span className="text-sm font-bold text-blue-200">D</span>
                        </CtrlBtn>
                        {/* Skill 4 (F) */}
                        <CtrlBtn code={keyBindings.SKILL_4} label="F" color="bg-purple-900 border-purple-700" className="w-12 h-12 rounded-xl">
                            <span className="text-sm font-bold text-purple-200">F</span>
                        </CtrlBtn>
                    </div>

                    {/* Main Action - Attack */}
                    <div className="mr-2">
                        <CtrlBtn code={keyBindings.ATTACK} color="bg-red-900 border-red-700" className="w-20 h-20 rounded-full">
                            <Sword size={32} className="text-red-200"/>
                        </CtrlBtn>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default MobileControls;
