
import React, { useState } from 'react';
import { Player, KeyBindings } from '../types';
import { SKILL_TREE } from '../constants';
import { X, Lock, ChevronsUp, ShieldCheck, Zap, Keyboard, ArrowDown } from 'lucide-react';

interface SkillTreeModalProps {
    player: Player;
    onClose: () => void;
    onUpgrade: (skillId: string) => void;
    onAssignSlot: (skillId: string, slotKey: string) => void;
    keyBindings: KeyBindings;
}

const SkillTreeModal: React.FC<SkillTreeModalProps> = ({ player, onClose, onUpgrade, onAssignSlot, keyBindings }) => {
    const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
    
    // Filter skills by player class
    const visibleSkills = SKILL_TREE.filter(s => s.classType === 'All' || s.classType === player.classType);
    
    // Group by tiers (rows)
    const tiers = [0, 1, 2, 3, 4, 5];
    const tierLabels = ["기본 (Basic)", "1차 (Lv.1)", "2차 (Lv.5)", "3차 (Lv.10)", "4차 (Lv.20)", "하이퍼 (Lv.30)"];

    const getSkillStats = (id: string, level: number) => {
        if (level === 0) return "효과 없음";
        const skill = SKILL_TREE.find(s => s.id === id);
        if(!skill) return "";
        if (skill.damageMult && skill.type === 'active') return `공격력 ${((skill.damageMult * (1 + level * 0.1))*100).toFixed(0)}% 피해`;
        
        switch(id) {
            case 'IronBody': return `최대 체력 +${level * 50}`;
            case 'DoubleJump': return `공중에서 점프 가능 (2단 점프)`;
            case 'Haste': return `이동 속도 +${level * 5}%`;
            case 'WeaponMastery': return `무기 숙련도 및 명중률 +${level * 5}%`;
            case 'IronWall': return `방어력 +${level * 3}%, 지속 ${(skill.duration || 600)/60 + level * 2}초`;
            case 'Rage': return `공격력 +50%, 지속 ${(skill.duration || 600)/60 + level * 2}초`;
            case 'PowerGuard': return `피해 반사 ${20 + level * 5}%`;
            case 'Achilles': return `피해 감소 ${level * 2}%`;
            case 'Enrage': return `최종 데미지 2배, 지속 10초`;
            case 'Guard': return `3초간 완전 무적`;
            case 'DragonBlood': return `공격력 +30%, HP 소모`;
            case 'DragonFury': return `HP 조건부 공증 +${level * 5}%`;
            case 'SharpEyes': return `크리티컬 확률 +${5 + level * 2}%`;
            case 'Battleship': return `배틀쉽 탑승`;
            case 'LuckyDice': return `랜덤 버프`;
            case 'MagicGuard': return `MP로 피해 흡수`;
            default: 
                if (skill.type === 'buff') return `지속시간 ${(skill.duration || 600)/60 + level * 2}초`;
                if (skill.type === 'passive') return `스킬 레벨 ${level} 효과`;
                return `위력 ${level * 10}% 증가`;
        }
    };

    const selectedSkill = SKILL_TREE.find(s => s.id === selectedSkillId);
    const currentLevel = selectedSkill ? (player.skills[selectedSkill.id] || 0) : 0;
    const isMaxed = selectedSkill ? currentLevel >= selectedSkill.maxLevel : false;
    const reqMet = selectedSkill ? player.level >= selectedSkill.reqLevel && (!selectedSkill.reqSkill || (player.skills[selectedSkill.reqSkill] || 0) > 0) : false;
    const canUpgrade = selectedSkill && !isMaxed && reqMet && player.sp > 0;

    const hotkeys = [
        { label: 'A', key: keyBindings.SKILL_1 },
        { label: 'S', key: keyBindings.SKILL_2 },
        { label: 'D', key: keyBindings.SKILL_3 },
        { label: 'F', key: keyBindings.SKILL_4 },
        { label: 'G', key: keyBindings.SKILL_5 },
    ];

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-2xl shadow-2xl w-full max-w-6xl h-[90%] flex flex-col relative overflow-hidden">
                
                {/* Header */}
                <div className="bg-slate-950 p-4 flex justify-between items-center border-b border-indigo-900 shadow-md z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-900/30 p-2 rounded-lg border border-indigo-500/30">
                             <ChevronsUp className="text-indigo-400 w-6 h-6"/>
                        </div>
                        <div>
                             <h2 className="text-xl font-bold text-white tracking-wider uppercase">Skill Tree</h2>
                             <div className="text-xs text-indigo-400 font-mono">{player.classType} Class</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Skill Points</span>
                            <span className="text-yellow-400 font-black text-2xl drop-shadow-md">{player.sp}</span>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X className="w-8 h-8" />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-slate-900">
                    
                    {/* Left: Tiers List */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-indigo-900 scrollbar-track-transparent">
                        <div className="space-y-8 pb-10">
                            {tiers.map((tier) => {
                                const tierSkills = visibleSkills.filter(s => s.row === tier).sort((a,b) => a.col - b.col);
                                if (tierSkills.length === 0) return null;
                                const isTierUnlocked = player.level >= (tier === 0 ? 1 : (tier === 1 ? 1 : tier === 2 ? 5 : tier === 3 ? 10 : tier === 4 ? 20 : 30));

                                return (
                                    <div key={tier} className={`relative ${!isTierUnlocked ? 'opacity-50 grayscale' : ''}`}>
                                        {/* Tier Label */}
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-indigo-900/50"></div>
                                            <div className="text-xs font-bold text-indigo-300 bg-slate-950 px-3 py-1 rounded-full border border-indigo-900/50">
                                                {tierLabels[tier]}
                                            </div>
                                            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-indigo-900/50"></div>
                                        </div>

                                        {/* Skills Grid */}
                                        <div className="flex justify-center gap-6 md:gap-12">
                                            {tierSkills.map(skill => {
                                                const level = player.skills[skill.id] || 0;
                                                const maxed = level >= skill.maxLevel;
                                                const unlocked = player.level >= skill.reqLevel && (!skill.reqSkill || (player.skills[skill.reqSkill] || 0) > 0);
                                                const isSelected = selectedSkillId === skill.id;

                                                return (
                                                    <div key={skill.id} className="flex flex-col items-center group relative z-10">
                                                        <button
                                                            onClick={() => setSelectedSkillId(skill.id)}
                                                            className={`
                                                                w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center text-3xl transition-all duration-200 border-2 shadow-lg relative
                                                                ${isSelected ? 'border-yellow-400 scale-110 shadow-yellow-900/50 ring-2 ring-yellow-400/20' : 'border-slate-700 hover:border-slate-500'}
                                                                ${maxed ? 'bg-indigo-900/40' : unlocked ? 'bg-slate-800' : 'bg-slate-950'}
                                                            `}
                                                        >
                                                            <span className="drop-shadow-md">{skill.icon}</span>
                                                            
                                                            {/* Level Badge */}
                                                            <div className={`absolute -bottom-3 bg-slate-900 px-2 py-0.5 rounded text-[10px] font-bold border ${maxed ? 'border-yellow-500 text-yellow-400' : 'border-slate-600 text-gray-400'}`}>
                                                                {level}/{skill.maxLevel}
                                                            </div>

                                                            {/* Lock Overlay */}
                                                            {!unlocked && (
                                                                <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center backdrop-blur-[1px] flex-col gap-1">
                                                                    <Lock size={12} className="text-gray-500"/>
                                                                    <span className="text-[8px] text-red-400 font-bold">Lv.{skill.reqLevel}</span>
                                                                </div>
                                                            )}

                                                            {/* Type Indicator */}
                                                            <div className={`absolute -top-2 -right-2 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border shadow-sm ${skill.type==='active'?'bg-red-900 border-red-500 text-white':skill.type==='buff'?'bg-green-900 border-green-500 text-white':'bg-blue-900 border-blue-500 text-white'}`}>
                                                                {skill.type[0].toUpperCase()}
                                                            </div>
                                                        </button>

                                                        {/* Skill Name */}
                                                        <span className={`mt-4 text-[10px] md:text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                                                            {skill.name}
                                                        </span>
                                                        
                                                        {/* Requirement Line (Visual) */}
                                                        {skill.reqSkill && isTierUnlocked && (
                                                            <div className="absolute -top-10 left-1/2 w-0.5 h-10 bg-indigo-900/30 -z-10 flex flex-col items-center justify-center">
                                                                <ArrowDown size={12} className="text-indigo-900/50 absolute bottom-0"/>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Info Panel */}
                    <div className="w-80 md:w-96 bg-slate-950 border-l border-indigo-900/50 p-6 flex flex-col shadow-2xl relative z-20">
                        {selectedSkill ? (
                            <>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-4xl border-2 ${currentLevel >= selectedSkill.maxLevel ? 'bg-yellow-900/20 border-yellow-500' : 'bg-slate-800 border-slate-600'}`}>
                                        {selectedSkill.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{selectedSkill.name}</h3>
                                        <div className={`text-xs font-bold px-2 py-0.5 rounded inline-block mt-1 ${selectedSkill.type==='active'?'bg-red-900/50 text-red-200':selectedSkill.type==='buff'?'bg-green-900/50 text-green-200':'bg-blue-900/50 text-blue-200'}`}>
                                            {selectedSkill.type === 'active' ? 'ACTIVE' : selectedSkill.type === 'buff' ? 'BUFF' : 'PASSIVE'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase">Description</h4>
                                        <p className="text-sm text-gray-300 leading-relaxed bg-slate-900/50 p-3 rounded border border-white/5">
                                            {selectedSkill.description}
                                        </p>
                                    </div>
                                    
                                    {/* Requirements Notice */}
                                    {!reqMet && (
                                        <div className="bg-red-900/20 border border-red-800/50 p-2 rounded text-xs text-red-300 font-bold">
                                            ⚠️ 필요 레벨: {selectedSkill.reqLevel}
                                            {selectedSkill.reqSkill && `, 선행 스킬 필요`}
                                        </div>
                                    )}

                                    {(selectedSkill.type === 'active' || selectedSkill.type === 'buff') && (
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="bg-slate-900 p-2 rounded border border-white/5 flex justify-between">
                                                <span className="text-gray-500">MP Cost</span>
                                                <span className="text-blue-300">{selectedSkill.mpCost}</span>
                                            </div>
                                            <div className="bg-slate-900 p-2 rounded border border-white/5 flex justify-between">
                                                <span className="text-gray-500">Cooldown</span>
                                                <span className="text-gray-300">{(selectedSkill.cooldown || 60)/60}s</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                            <ShieldCheck size={12}/> Current Effect
                                        </h4>
                                        <div className="text-sm text-white bg-indigo-900/20 p-3 rounded border-l-2 border-indigo-500">
                                            {getSkillStats(selectedSkill.id, currentLevel)}
                                        </div>
                                    </div>

                                    {!isMaxed && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                                <ChevronsUp size={12} className="text-green-500"/> Next Level
                                            </h4>
                                            <div className="text-sm text-green-100 bg-green-900/10 p-3 rounded border-l-2 border-green-500">
                                                {getSkillStats(selectedSkill.id, currentLevel + 1)}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Actions Footer */}
                                <div className="pt-6 mt-6 border-t border-white/10 space-y-3">
                                    <button 
                                        onClick={() => canUpgrade && onUpgrade(selectedSkill.id)}
                                        disabled={!canUpgrade}
                                        className={`
                                            w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                                            ${canUpgrade 
                                                ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-900/50 active:scale-95' 
                                                : 'bg-slate-800 text-gray-500 cursor-not-allowed'}
                                        `}
                                    >
                                        <Zap size={16} className={canUpgrade ? "fill-white" : ""}/>
                                        {isMaxed ? "Mastered" : !reqMet ? `Locked (Req Lv.${selectedSkill.reqLevel})` : player.sp <= 0 ? "No SP" : "Level Up (1 SP)"}
                                    </button>

                                    {/* Quick Slot */}
                                    {(selectedSkill.type === 'active' || selectedSkill.type === 'buff') && currentLevel > 0 && (
                                        <div className="bg-slate-900 p-3 rounded-xl border border-white/5">
                                            <div className="text-[10px] font-bold text-gray-500 mb-2 flex items-center gap-1">
                                                <Keyboard size={10}/> ASSIGN HOTKEY
                                            </div>
                                            <div className="flex gap-1 justify-between">
                                                {hotkeys.map(slot => (
                                                    <button
                                                        key={slot.label}
                                                        onClick={() => onAssignSlot(selectedSkill.id, slot.key)}
                                                        className={`
                                                            flex-1 py-1.5 rounded text-xs font-bold border transition-colors
                                                            ${player.skillSlots[slot.key] === selectedSkill.id
                                                                ? 'bg-indigo-600 border-indigo-400 text-white'
                                                                : 'bg-slate-800 border-slate-600 text-gray-400 hover:bg-slate-700 hover:text-white'}
                                                        `}
                                                    >
                                                        {slot.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-4">
                                <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center">
                                    <ShieldCheck size={32} />
                                </div>
                                <p className="text-sm font-medium">Select a skill to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkillTreeModal;
