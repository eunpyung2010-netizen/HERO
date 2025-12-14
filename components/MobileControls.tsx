
import React from 'react';
import { KeyBindings, Player } from '../types';
import { ArrowLeft, ArrowRight, Sword, ChevronsUp, Zap } from 'lucide-react';

interface MobileControlsProps {
    keyBindings: KeyBindings;
    onSimulateKey: (code: string, type: 'keydown' | 'keyup') => void;
    player: Player;
    onOpenMenu?: () => void; // Kept in interface but not used in this view anymore
}

const MobileControls: React.FC<MobileControlsProps> = ({ keyBindings, onSimulateKey, player }) => {
    
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
        <div className="absolute inset-0 pointer-events-none select-none touch-none overflow-hidden pb-safe px-4 flex items-end justify-between pb-4">
            {/* Main Controls Area */}
                
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

            {/* RIGHT: ACTIONS & SKILLS */}
            <div className="relative w-64 h-48 pointer-events-auto">
                
                {/* Primary Actions */}
                <div className="absolute bottom-2 right-2 flex items-end gap-4">
                        {/* Old Jump Position -> Now Magic (Skill 1) */}
                        <CtrlBtn code={keyBindings.SKILL_1} color="bg-indigo-900 border-indigo-700" className="w-16 h-16 rounded-full mb-6">
                        <Zap size={28} className="text-yellow-200 fill-yellow-200"/>
                        <span className="absolute -top-2 -right-2 bg-indigo-600 text-[10px] w-5 h-5 rounded-full flex items-center justify-center text-white border border-black shadow">A</span>
                    </CtrlBtn>
                    
                    {/* Attack Button */}
                    <CtrlBtn code={keyBindings.ATTACK} color="bg-red-900 border-red-700" className="w-20 h-20 rounded-full">
                        <Sword size={32} className="text-red-200"/>
                    </CtrlBtn>
                </div>

                {/* Skills Arc */}
                <div className="absolute bottom-28 right-4 flex flex-col gap-3 items-end">
                        {/* Row 2 */}
                    <div className="flex gap-4 mr-6">
                        <CtrlBtn code={keyBindings.SKILL_4} label="F" color="bg-purple-900 border-purple-700" className="w-11 h-11 rounded-xl">
                            <span className="text-xs font-bold text-purple-200">4</span>
                        </CtrlBtn>
                        <CtrlBtn code={keyBindings.SKILL_5} label="G" color="bg-pink-900 border-pink-700" className="w-11 h-11 rounded-xl">
                            <span className="text-xs font-bold text-pink-200">5</span>
                        </CtrlBtn>
                    </div>
                    {/* Row 1 */}
                    <div className="flex gap-4">
                        {/* SKILL 1 is now main button, remove from small list or keep as duplicate? User asked to move jump position to magic. I'll keep Skill 2 and 3 here. */}
                        <CtrlBtn code={keyBindings.SKILL_2} label="S" color="bg-green-900 border-green-700" className="w-11 h-11 rounded-xl">
                            <span className="text-xs font-bold text-green-200">2</span>
                        </CtrlBtn>
                        <CtrlBtn code={keyBindings.SKILL_3} label="D" color="bg-blue-900 border-blue-700" className="w-11 h-11 rounded-xl">
                            <span className="text-xs font-bold text-blue-200">3</span>
                        </CtrlBtn>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MobileControls;
