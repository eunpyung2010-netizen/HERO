
import React, { useState } from 'react';
import { ClassType } from '../types';
import { CLASS_INFOS } from '../constants';
import { Sword, Shield, Zap, Target, MousePointer2, ChevronRight, Star, Gamepad2 } from 'lucide-react';

interface ClassSelectionModalProps {
    onSelectClass: (classType: ClassType) => void;
    virtualControlsEnabled: boolean;
    onToggleVirtualControls: () => void;
}

const ClassSelectionModal: React.FC<ClassSelectionModalProps> = ({ onSelectClass, virtualControlsEnabled, onToggleVirtualControls }) => {
    const [hoveredClass, setHoveredClass] = useState<ClassType | null>(null);

    // Helpers for stat bars
    const getStats = (type: ClassType) => {
        switch(type) {
            case 'Warrior': return { atk: 8, range: 2, diff: 3 };
            case 'Lancer': return { atk: 7, range: 5, diff: 5 };
            case 'Archer': return { atk: 6, range: 9, diff: 7 };
            case 'Gunner': return { atk: 9, range: 7, diff: 4 };
            case 'Mage': return { atk: 10, range: 6, diff: 6 };
            default: return { atk: 5, range: 5, diff: 5 };
        }
    };

    const StatBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-300">
            <span className="w-8 text-right uppercase opacity-70">{label}</span>
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${color} transition-all duration-500 ease-out`} 
                    style={{ width: `${value * 10}%` }}
                ></div>
            </div>
        </div>
    );

    return (
        <div className="absolute inset-0 z-[100] bg-slate-950 flex flex-col overflow-hidden touch-auto">
            {/* Control Toggle */}
            <button 
                onClick={onToggleVirtualControls}
                className={`absolute top-4 right-4 z-50 p-2 rounded-full border-2 transition-all flex items-center gap-2 hover:scale-105 active:scale-95 ${virtualControlsEnabled ? 'bg-green-600 border-green-400 text-white' : 'bg-slate-800/80 border-slate-600 text-gray-400'}`}
                title="Toggle Virtual Controls"
            >
                <Gamepad2 size={24} />
                <span className="text-[10px] font-bold uppercase hidden md:inline">{virtualControlsEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-black z-0 pointer-events-none"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse z-0 pointer-events-none"></div>
            
            {/* Header - Scaled Down */}
            <div className="relative z-10 pt-2 pb-1 text-center">
                <h1 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] tracking-tight mb-0.5">
                    MAPLE AI ADVENTURE
                </h1>
                <p className="text-gray-400 text-[10px] md:text-xs tracking-widest uppercase font-bold opacity-80">
                    Choose Your Destiny
                </p>
            </div>

            {/* Class Carousel - Ultra Compact sizing */}
            <div className="relative z-10 flex-1 flex items-center justify-center p-2 overflow-x-auto overflow-y-hidden touch-pan-x">
                <div className="flex gap-2 px-4 items-center">
                    {(Object.entries(CLASS_INFOS) as [ClassType, typeof CLASS_INFOS[ClassType]][]).map(([key, info]) => {
                        const stats = getStats(key);
                        const isHovered = hoveredClass === key;
                        const isOthersHovered = hoveredClass !== null && !isHovered;

                        return (
                            <div 
                                key={key}
                                onMouseEnter={() => setHoveredClass(key)}
                                onMouseLeave={() => setHoveredClass(null)}
                                onClick={() => onSelectClass(key)}
                                className={`
                                    relative group w-[160px] md:w-[190px] rounded-2xl border-2 cursor-pointer transition-all duration-300 ease-out flex flex-col overflow-hidden flex-shrink-0
                                    ${isHovered 
                                        ? 'scale-105 border-yellow-400 bg-slate-800 shadow-[0_0_20px_rgba(234,179,8,0.3)] z-20 -translate-y-1' 
                                        : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'}
                                    ${isOthersHovered ? 'opacity-50 blur-[1px] scale-95' : 'opacity-100'}
                                `}
                            >
                                {/* Card Header Image Area */}
                                <div className={`
                                    h-20 md:h-24 flex items-center justify-center transition-colors duration-500 relative
                                    ${isHovered ? 'bg-gradient-to-b from-indigo-600/30 to-slate-900' : 'bg-slate-950'}
                                `}>
                                    <div className={`text-4xl md:text-5xl transition-transform duration-500 ${isHovered ? 'scale-125 rotate-3 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]' : 'scale-100 grayscale opacity-70'}`}>
                                        {info.icon}
                                    </div>
                                    <div className="absolute top-2 right-2 bg-black/60 px-1.5 py-0.5 rounded-full text-[9px] font-mono text-gray-400 border border-white/10">
                                        {info.weapon}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-3 flex flex-col flex-1 gap-1.5">
                                    <div>
                                        <h3 className={`text-lg font-black uppercase mb-0.5 transition-colors ${isHovered ? 'text-white' : 'text-gray-500'}`}>
                                            {info.name}
                                        </h3>
                                        <div className="h-0.5 w-6 bg-yellow-500 rounded-full mb-1"></div>
                                        <p className="text-[9px] text-gray-400 leading-tight min-h-[2.2rem]">
                                            {info.desc}
                                        </p>
                                    </div>

                                    {/* Stats */}
                                    <div className={`space-y-1 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-40'}`}>
                                        <StatBar label="Pow" value={stats.atk} color="bg-red-500" />
                                        <StatBar label="Rng" value={stats.range} color="bg-green-500" />
                                        <StatBar label="Dif" value={stats.diff} color="bg-blue-500" />
                                    </div>

                                    <div className="mt-auto pt-2">
                                        <button className={`
                                            w-full py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all duration-300
                                            ${isHovered 
                                                ? 'bg-yellow-500 text-black shadow-lg hover:bg-yellow-400 translate-y-[-1px]' 
                                                : 'bg-slate-800 text-gray-600'}
                                        `}>
                                            <span>Start</span>
                                            {isHovered && <ChevronRight size={10} className="animate-ping"/>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 p-2 text-center text-[9px] text-slate-600 font-mono">
                Powered by Gemini AI • React • Tailwind
            </div>
        </div>
    );
};

export default ClassSelectionModal;
