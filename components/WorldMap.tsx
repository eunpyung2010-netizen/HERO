
import React from 'react';
import { BIOMES } from '../constants';
import { X, Lock, MapPin, Star } from 'lucide-react';

interface WorldMapProps {
    currentStage: number;
    maxStageReached: number;
    onClose: () => void;
}

const WorldMap: React.FC<WorldMapProps> = ({ currentStage, maxStageReached, onClose }) => {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-8 animate-in fade-in duration-300 touch-auto">
            <div className="bg-slate-900 border-2 border-yellow-600 rounded-2xl shadow-2xl w-full max-w-4xl h-full md:h-[80%] flex flex-col overflow-hidden relative">
                {/* Header */}
                <div className="bg-gradient-to-r from-yellow-800 to-yellow-900 p-4 flex justify-between items-center border-b border-yellow-500 shadow-md z-10 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-black/30 p-2 rounded-full border border-yellow-400/50">
                            <MapPin className="text-yellow-400 w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-white drop-shadow-md tracking-wider">WORLD MAP</h2>
                            <p className="text-yellow-200/60 text-xs font-mono">현재: {currentStage} / 최고: {maxStageReached}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-yellow-100 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all"
                    >
                        <X className="w-8 h-8" />
                    </button>
                </div>

                {/* Map Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-900">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {BIOMES.map((biome, index) => {
                            const isUnlocked = maxStageReached >= biome.startStage || index === 0;
                            const isCurrent = currentStage >= biome.startStage && currentStage <= biome.endStage;
                            
                            // Determine status color
                            let borderColor = "border-gray-700";
                            let bgColor = "bg-gray-800/50";
                            let textColor = "text-gray-500";
                            
                            if (isCurrent) {
                                borderColor = "border-yellow-400 ring-2 ring-yellow-400/30";
                                bgColor = "bg-yellow-900/20";
                                textColor = "text-yellow-400";
                            } else if (isUnlocked) {
                                borderColor = "border-blue-500/50 hover:border-blue-400";
                                bgColor = "bg-slate-800/80 hover:bg-slate-700";
                                textColor = "text-white";
                            }

                            return (
                                <div 
                                    key={biome.name}
                                    className={`relative group rounded-xl border-2 ${borderColor} ${bgColor} p-4 transition-all duration-300 flex flex-col gap-3 min-h-[160px] active:scale-95`}
                                >
                                    {/* Background Preview (Simulated with gradient) */}
                                    <div 
                                        className="absolute inset-0 rounded-xl opacity-20 pointer-events-none"
                                        style={{ background: `linear-gradient(135deg, ${biome.sky[0]}, ${biome.sky[1]})` }}
                                    ></div>

                                    {/* Header */}
                                    <div className="flex justify-between items-start relative z-10">
                                        <h3 className={`font-bold text-lg ${textColor} flex items-center gap-2`}>
                                            {isCurrent && <MapPin size={18} className="animate-bounce" />}
                                            {biome.name}
                                        </h3>
                                        {!isUnlocked && <Lock className="text-gray-600" size={20} />}
                                        {isUnlocked && !isCurrent && <Star className="text-blue-500/30" size={16} />}
                                    </div>

                                    {/* Stage Info */}
                                    <div className="mt-auto relative z-10">
                                        <div className="text-xs uppercase tracking-widest text-gray-400 mb-1">
                                            Stage Range
                                        </div>
                                        <div className={`text-2xl font-black ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>
                                            {biome.startStage} <span className="text-gray-500 mx-1">-</span> {biome.endStage}
                                        </div>
                                        
                                        {/* Progress Bar for this biome */}
                                        {isUnlocked && (
                                            <div className="mt-3 h-1.5 bg-black/40 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                                    style={{ 
                                                        width: `${Math.min(100, Math.max(0, (maxStageReached - biome.startStage + 1) / (biome.endStage - biome.startStage + 1) * 100))}%` 
                                                    }}
                                                ></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Biome Environment Decor */}
                                    <div 
                                        className="absolute bottom-2 right-2 w-16 h-16 rounded-full opacity-20 blur-xl pointer-events-none"
                                        style={{ backgroundColor: biome.top }}
                                    ></div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-900 border-t border-white/10 p-3 text-center text-xs text-gray-500 font-mono flex-shrink-0">
                    새로운 지역을 탐험하여 지도를 완성하세요.
                </div>
            </div>
        </div>
    );
};

export default WorldMap;
