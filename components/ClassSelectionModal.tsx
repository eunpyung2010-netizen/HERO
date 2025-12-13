import React from 'react';
import { ClassType } from '../types';
import { CLASS_INFOS } from '../constants';
import { Sword, Target, Wand2, MousePointer2 } from 'lucide-react';

interface ClassSelectionModalProps {
    onSelectClass: (classType: ClassType) => void;
}

const ClassSelectionModal: React.FC<ClassSelectionModalProps> = ({ onSelectClass }) => {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-8 animate-in fade-in duration-500">
            <div className="max-w-6xl w-full text-center">
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-sm mb-4">
                    직업을 선택하세요
                </h1>
                <p className="text-gray-400 mb-12 text-lg">당신의 모험 스타일을 결정할 시간입니다.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {(Object.entries(CLASS_INFOS) as [ClassType, typeof CLASS_INFOS[ClassType]][]).map(([key, info]) => (
                        <div 
                            key={key}
                            onClick={() => onSelectClass(key)}
                            className="group relative bg-slate-800 border-2 border-slate-600 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:border-yellow-500 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] flex flex-col items-center gap-4"
                        >
                            <div className="w-24 h-24 rounded-full bg-black/50 flex items-center justify-center text-6xl shadow-inner group-hover:bg-yellow-900/20 transition-colors">
                                {info.icon}
                            </div>
                            
                            <h3 className="text-2xl font-bold text-white group-hover:text-yellow-400">
                                {info.name}
                            </h3>
                            
                            <p className="text-sm text-gray-400 group-hover:text-gray-200 leading-relaxed min-h-[60px]">
                                {info.desc}
                            </p>

                            <div className="mt-auto w-full pt-4 border-t border-slate-700">
                                <span className="text-xs uppercase tracking-widest text-slate-500 font-bold block mb-1">Weapon</span>
                                <span className="text-sm text-yellow-500 font-mono">{info.weapon}</span>
                            </div>

                            {/* Hover Overlay Effect */}
                            <div className="absolute inset-0 border-2 border-yellow-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ClassSelectionModal;