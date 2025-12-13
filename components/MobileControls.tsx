import React from 'react';
import { KeyBindings, Player } from '../types';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Sword, ChevronsUp, Menu, ShoppingBag, Zap, Map } from 'lucide-react';

interface MobileControlsProps {
    keyBindings: KeyBindings;
    onSimulateKey: (code: string, type: 'keydown' | 'keyup') => void;
    onOpenMenu: () => void;
    player: Player;
}

const MobileControls: React.FC<MobileControlsProps> = ({ keyBindings, onSimulateKey, onOpenMenu, player }) => {
    
    const handleTouchStart = (code: string, e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault(); 
        e.stopPropagation();
        onSimulateKey(code, 'keydown');
    };

    const handleTouchEnd = (code: string, e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onSimulateKey(code, 'keyup');
    };

    // Button Helper
    const CtrlBtn = ({ code, children, className, color = "bg-slate-700", label }: any) => (
        <button
            className={`relative flex items-center justify-center rounded-2xl shadow-[0_4px_0_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-1 transition-all touch-none select-none border border-white/10 ${color} ${className}`}
            onPointerDown={(e) => handleTouchStart(code, e)}
            onPointerUp={(e) => handleTouchEnd(code, e)}
            onPointerLeave={(e) => handleTouchEnd(code, e)}
            onContextMenu={(e) => e.preventDefault()}
        >
            {children}
            {label && <span className="absolute -bottom-5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">{label}</span>}
        </button>
    );

    return (
        <div className="w-full h-full bg-slate-900 border-t-4 border-slate-800 p-4 flex flex-col justify-between select-none touch-none">
            
            {/* Top Row: Utility & Potions */}
            <div className="flex justify-between items-center mb-2 px-2">
                <div className="flex gap-4">
                    <CtrlBtn code={keyBindings.POTION_HP} color="bg-red-900/80 border-red-700" className="w-12 h-12 rounded-full">
                        <span className="text-xl">🍷</span>
                        <span className="absolute -top-1 -right-1 bg-red-600 text-[10px] w-5 h-5 rounded-full flex items-center justify-center text-white font-bold border border-black">{player.hpPotions}</span>
                    </CtrlBtn>
                    <CtrlBtn code={keyBindings.POTION_MP} color="bg-blue-900/80 border-blue-700" className="w-12 h-12 rounded-full">
                        <span className="text-xl">🧪</span>
                        <span className="absolute -top-1 -right-1 bg-blue-600 text-[10px] w-5 h-5 rounded-full flex items-center justify-center text-white font-bold border border-black">{player.mpPotions}</span>
                    </CtrlBtn>
                </div>

                <div className="flex gap-2">
                     <button 
                        onClick={onOpenMenu}
                        className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-white border border-slate-600 active:scale-95 transition-transform"
                     >
                         <Menu size={24}/>
                     </button>
                </div>
            </div>

            {/* Main Controls Area */}
            <div className="flex flex-1 items-end justify-between pb-4 gap-4">
                
                {/* LEFT: D-PAD */}
                <div className="relative w-48 h-48 bg-slate-800/50 rounded-full border border-white/5 flex-shrink-0 flex items-center justify-center">
                    <div className="grid grid-cols-3 gap-2 p-2">
                        <div />
                        <CtrlBtn code={keyBindings.UP} className="w-14 h-14 bg-slate-700 rounded-t-xl" >
                            <ArrowUp size={28} className="text-gray-300"/>
                        </CtrlBtn>
                        <div />
                        
                        <CtrlBtn code={keyBindings.LEFT} className="w-14 h-14 bg-slate-700 rounded-l-xl" >
                            <ArrowLeft size={28} className="text-gray-300"/>
                        </CtrlBtn>
                        <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                        </div>
                        <CtrlBtn code={keyBindings.RIGHT} className="w-14 h-14 bg-slate-700 rounded-r-xl" >
                            <ArrowRight size={28} className="text-gray-300"/>
                        </CtrlBtn>

                        <div />
                        <CtrlBtn code={keyBindings.DOWN} className="w-14 h-14 bg-slate-700 rounded-b-xl" >
                            <ArrowDown size={28} className="text-gray-300"/>
                        </CtrlBtn>
                        <div />
                    </div>
                </div>

                {/* RIGHT: ACTIONS & SKILLS */}
                <div className="flex-1 relative h-48">
                    {/* Attack (Big Button) */}
                    <CtrlBtn code={keyBindings.ATTACK} color="bg-red-700" className="absolute bottom-2 right-2 w-20 h-20 rounded-full z-10 border-4 border-red-900/50">
                        <Sword size={32} className="text-white"/>
                        <span className="absolute bottom-2 text-[10px] font-black text-red-200">ATTACK</span>
                    </CtrlBtn>

                    {/* Jump */}
                    <CtrlBtn code={keyBindings.JUMP} color="bg-blue-600" className="absolute bottom-4 right-28 w-16 h-16 rounded-full border-4 border-blue-800/50">
                        <ChevronsUp size={28} className="text-white"/>
                    </CtrlBtn>

                    {/* Skill Arc */}
                    <div className="absolute top-0 right-4 flex gap-3">
                        <CtrlBtn code={keyBindings.SKILL_1} label="A" color="bg-indigo-600" className="w-11 h-11 rounded-xl">
                            <span className="text-xs font-bold">1</span>
                        </CtrlBtn>
                        <CtrlBtn code={keyBindings.SKILL_2} label="S" color="bg-indigo-600" className="w-11 h-11 rounded-xl">
                            <span className="text-xs font-bold">2</span>
                        </CtrlBtn>
                        <CtrlBtn code={keyBindings.SKILL_3} label="D" color="bg-indigo-600" className="w-11 h-11 rounded-xl">
                            <span className="text-xs font-bold">3</span>
                        </CtrlBtn>
                    </div>
                    <div className="absolute top-14 right-32 flex gap-3">
                         <CtrlBtn code={keyBindings.SKILL_4} label="F" color="bg-indigo-600" className="w-11 h-11 rounded-xl">
                            <span className="text-xs font-bold">4</span>
                        </CtrlBtn>
                         <CtrlBtn code={keyBindings.SKILL_5} label="G" color="bg-indigo-600" className="w-11 h-11 rounded-xl">
                            <span className="text-xs font-bold">5</span>
                        </CtrlBtn>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileControls;