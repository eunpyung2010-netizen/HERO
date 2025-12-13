
import React from 'react';
import { KeyBindings, Player } from '../types';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Sword, ChevronsUp, Menu } from 'lucide-react';

interface MobileControlsProps {
    keyBindings: KeyBindings;
    onSimulateKey: (code: string, type: 'keydown' | 'keyup') => void;
    onOpenMenu: () => void;
    player: Player;
}

const MobileControls: React.FC<MobileControlsProps> = ({ keyBindings, onSimulateKey, onOpenMenu, player }) => {
    
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
            className={`relative flex items-center justify-center rounded-2xl shadow-[0_4px_0_0_rgba(0,0,0,0.5)] active:shadow-none active:translate-y-1 transition-all touch-none select-none border border-slate-600 active:bg-slate-700 ${color} ${className}`}
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
        <div className="w-full h-full bg-slate-950 border-t border-slate-800 flex flex-col justify-between select-none touch-none overflow-hidden pb-safe pt-2 px-4">
            
            {/* Top Row: Utility & Potions */}
            <div className="flex justify-between items-center h-14 flex-shrink-0 border-b border-slate-800/50 mb-2 pb-2">
                <div className="flex gap-4">
                    <CtrlBtn code={keyBindings.POTION_HP} color="bg-red-950 border-red-900" className="w-12 h-12 rounded-full">
                        <span className="text-xl">🍷</span>
                        <span className="absolute -top-1 -right-1 bg-red-600 text-[10px] w-5 h-5 rounded-full flex items-center justify-center text-white font-bold border border-black">{player.hpPotions}</span>
                    </CtrlBtn>
                    <CtrlBtn code={keyBindings.POTION_MP} color="bg-blue-950 border-blue-900" className="w-12 h-12 rounded-full">
                        <span className="text-xl">🧪</span>
                        <span className="absolute -top-1 -right-1 bg-blue-600 text-[10px] w-5 h-5 rounded-full flex items-center justify-center text-white font-bold border border-black">{player.mpPotions}</span>
                    </CtrlBtn>
                </div>

                <div className="flex gap-2">
                     <button 
                        onPointerDown={(e) => { e.preventDefault(); onOpenMenu(); }}
                        className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-white border border-slate-600 active:scale-95 transition-transform shadow-[0_2px_0_0_rgba(255,255,255,0.1)]"
                     >
                         <Menu size={24}/>
                     </button>
                </div>
            </div>

            {/* Main Controls Area */}
            <div className="flex flex-1 items-end justify-between gap-4 pb-4">
                
                {/* LEFT: D-PAD */}
                <div className="relative w-40 h-40 bg-black/20 rounded-full flex-shrink-0 flex items-center justify-center">
                    <div className="grid grid-cols-3 gap-1 p-1">
                        <div />
                        <CtrlBtn code={keyBindings.UP} className="w-12 h-12 bg-slate-800 rounded-t-lg" >
                            <ArrowUp size={24} className="text-gray-400"/>
                        </CtrlBtn>
                        <div />
                        
                        <CtrlBtn code={keyBindings.LEFT} className="w-12 h-12 bg-slate-800 rounded-l-lg" >
                            <ArrowLeft size={24} className="text-gray-400"/>
                        </CtrlBtn>
                        <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-slate-700 rounded-full"></div>
                        </div>
                        <CtrlBtn code={keyBindings.RIGHT} className="w-12 h-12 bg-slate-800 rounded-r-lg" >
                            <ArrowRight size={24} className="text-gray-400"/>
                        </CtrlBtn>

                        <div />
                        <CtrlBtn code={keyBindings.DOWN} className="w-12 h-12 bg-slate-800 rounded-b-lg" >
                            <ArrowDown size={24} className="text-gray-400"/>
                        </CtrlBtn>
                        <div />
                    </div>
                </div>

                {/* RIGHT: ACTIONS & SKILLS */}
                <div className="flex-1 h-full max-h-[200px] relative">
                    
                    {/* Primary Actions */}
                    <div className="absolute bottom-2 right-2 flex items-end gap-4">
                         <CtrlBtn code={keyBindings.JUMP} color="bg-blue-900 border-blue-700" className="w-16 h-16 rounded-full mb-6">
                            <ChevronsUp size={28} className="text-blue-200"/>
                        </CtrlBtn>
                        <CtrlBtn code={keyBindings.ATTACK} color="bg-red-900 border-red-700" className="w-20 h-20 rounded-full">
                            <Sword size={32} className="text-red-200"/>
                        </CtrlBtn>
                    </div>

                    {/* Skills Arc */}
                    <div className="absolute bottom-28 right-4 flex flex-col gap-3 items-end">
                         {/* Row 2 */}
                        <div className="flex gap-4 mr-6">
                            <CtrlBtn code={keyBindings.SKILL_4} label="F" color="bg-indigo-900 border-indigo-700" className="w-11 h-11 rounded-xl">
                                <span className="text-xs font-bold text-indigo-200">4</span>
                            </CtrlBtn>
                            <CtrlBtn code={keyBindings.SKILL_5} label="G" color="bg-indigo-900 border-indigo-700" className="w-11 h-11 rounded-xl">
                                <span className="text-xs font-bold text-indigo-200">5</span>
                            </CtrlBtn>
                        </div>
                        {/* Row 1 */}
                        <div className="flex gap-4">
                            <CtrlBtn code={keyBindings.SKILL_1} label="A" color="bg-indigo-900 border-indigo-700" className="w-11 h-11 rounded-xl">
                                <span className="text-xs font-bold text-indigo-200">1</span>
                            </CtrlBtn>
                            <CtrlBtn code={keyBindings.SKILL_2} label="S" color="bg-indigo-900 border-indigo-700" className="w-11 h-11 rounded-xl">
                                <span className="text-xs font-bold text-indigo-200">2</span>
                            </CtrlBtn>
                            <CtrlBtn code={keyBindings.SKILL_3} label="D" color="bg-indigo-900 border-indigo-700" className="w-11 h-11 rounded-xl">
                                <span className="text-xs font-bold text-indigo-200">3</span>
                            </CtrlBtn>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default MobileControls;
