import React, { useState } from 'react';
import { Player, KeyBindings } from '../types';
import { SKILL_TREE } from '../constants';
import { X, Lock, ChevronsUp, ArrowRight, ShieldCheck, Zap, Keyboard } from 'lucide-react';

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

    const getSkillStats = (id: string, level: number) => {
        if (level === 0) return "효과 없음";
        const skill = SKILL_TREE.find(s => s.id === id);
        if(!skill) return "";

        // Active damage scaling (Generic)
        if (skill.damageMult && skill.type === 'active') {
             return `공격력 ${((skill.damageMult * (1 + level * 0.1))*100).toFixed(0)}% 피해`;
        }

        // Specific Skill Descriptions
        switch(id) {
            // === SHARED ===
            case 'IronBody': return `최대 체력 +${level * 50}`;
            case 'DoubleJump': return `공중에서 점프 가능 (2단 점프)`;
            case 'Haste': return `이동 속도 +${level * 5}%`;

            // === WARRIOR ===
            case 'WeaponMastery': return `무기 숙련도 및 명중률 +${level * 5}%`;
            case 'IronWall': return `물리/마법 방어력 +${level * 3}%, 지속 ${(skill.duration || 600)/60 + level * 2}초`;
            case 'Rage': return `공격력 +50%, 지속 ${(skill.duration || 600)/60 + level * 2}초`;
            case 'PowerGuard': return `받는 피해의 ${20 + level * 5}%를 반사`;
            case 'Achilles': return `영구적으로 받는 피해 ${level * 2}% 감소`;
            case 'Enrage': return `최종 데미지 2배 증가, 지속 10초`;

            // === LANCER ===
            case 'PolearmMastery': return `창/폴암 숙련도 및 명중률 +${level * 5}%`;
            case 'Guard': return `사용 시 3초간 완전 무적 (쿨타임 감소)`;
            case 'DragonBlood': return `공격력 +30%, 지속적으로 HP 소모`;
            case 'Reach': return `공격 사거리 +${level * 5}%`;
            case 'DragonFury': return `HP 30%~70%일 때 공격력 +${level * 5}%`;

            // === ARCHER ===
            case 'BowMastery': return `활/석궁 숙련도 및 명중률 +${level * 5}%`;
            case 'Concentrate': return `공격력 +20% 및 회피율 증가, 지속 ${(skill.duration || 600)/60 + level * 2}초`;
            case 'SharpEyes': return `크리티컬 확률 +${5 + level * 2}%, 크리티컬 데미지 증가`;
            
            // === GUNNER ===
            case 'GunMastery': return `총기 숙련도 및 명중률 +${level * 5}%`;
            case 'Battleship': return `배틀쉽 탑승 (방어력/공격력 증가)`;
            case 'LuckyDice': return `랜덤 버프 발생 (1~6), 지속 ${(skill.duration || 600)/60}초`;

            // === MAGE ===
            case 'MPRestore': return `MP 회복 확률 +${level * 5}%`;
            case 'MagicGuard': return `받는 피해의 80%를 MP로 대신 소모`;
            case 'Teleport': return `MP 소모량 감소`; 
            
            // Generic Fallbacks
            default: 
                if (skill.type === 'buff') return `지속시간 ${(skill.duration || 600)/60 + level * 2}초`;
                if (skill.type === 'passive') return `스킬 레벨 ${level} 효과 적용`;
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
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-8 animate-in fade-in duration-300">
            <div className="bg-slate-900 border-2 border-indigo-500 rounded-2xl shadow-2xl w-full max-w-5xl h-full md:h-[85%] flex flex-col relative overflow-hidden">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-4 flex justify-between items-center border-b border-indigo-500/50 flex-shrink-0">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-white tracking-wider flex items-center gap-2">
                            <ChevronsUp className="text-indigo-400"/> <span className="hidden md:inline">SKILL TREE</span><span className="md:hidden">SKILLS</span> ({player.classType})
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-black/40 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-indigo-500/30">
                            <span className="text-gray-400 text-xs md:text-sm">SP:</span>
                            <span className="text-yellow-400 font-bold text-lg md:text-xl ml-2">{player.sp}</span>
                        </div>
                        <button onClick={onClose} className="text-white hover:text-indigo-300 transition-colors">
                            <X className="w-6 h-6 md:w-8 md:h-8" />
                        </button>
                    </div>
                </div>

                {/* Content: Responsive Split View (Stack on mobile, Row on desktop) */}
                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                    
                    {/* Left: Skill Grid */}
                    <div className="flex-1 relative bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-slate-900 overflow-y-auto p-4 md:p-8 order-2 lg:order-1">
                        <div className="grid grid-cols-3 gap-y-8 gap-x-4 md:gap-y-12 md:gap-x-8 max-w-2xl mx-auto pb-20 lg:pb-0">
                            {visibleSkills.map((skill) => {
                                const level = player.skills[skill.id] || 0;
                                const maxed = level >= skill.maxLevel;
                                const unlocked = player.level >= skill.reqLevel && (!skill.reqSkill || (player.skills[skill.reqSkill] || 0) > 0);
                                const isSelected = selectedSkillId === skill.id;

                                return (
                                    <div key={skill.id} className="flex flex-col items-center group relative">
                                        {/* Connector Visual (simplified) */}
                                        {skill.reqSkill && (
                                            <div className="absolute -top-6 md:-top-8 w-0.5 h-6 md:h-8 bg-indigo-900/50 -z-10"></div>
                                        )}

                                        <div 
                                            onClick={() => setSelectedSkillId(skill.id)}
                                            className={`
                                                w-16 h-16 md:w-20 md:h-20 rounded-xl border-4 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer relative z-10
                                                ${isSelected ? 'scale-110 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.6)]' : 'border-slate-700'}
                                                ${maxed ? 'bg-yellow-900/40 border-yellow-500' : 
                                                  unlocked ? 'bg-slate-800 border-gray-500 hover:border-gray-400' : 'bg-black/80 opacity-50 grayscale'}
                                            `}
                                        >
                                            <div className="text-2xl md:text-3xl mb-1">{skill.icon}</div>
                                            <div className={`text-[9px] md:text-[10px] font-bold uppercase ${maxed ? 'text-yellow-400' : 'text-white'}`}>
                                                {level} / {skill.maxLevel}
                                            </div>
                                            
                                            {!unlocked && <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg"><Lock className="text-gray-500"/></div>}
                                            
                                            {/* Type badge */}
                                            <div className={`absolute -top-2 -right-2 px-1.5 py-0.5 rounded text-[8px] font-bold ${skill.type === 'active' ? 'bg-red-600 text-white' : (skill.type === 'buff' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white')}`}>
                                                {skill.type === 'active' ? 'ACT' : (skill.type === 'buff' ? 'BUF' : 'PAS')}
                                            </div>
                                        </div>
                                        
                                        <div className={`mt-2 text-[10px] md:text-xs font-bold text-center ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                                            {skill.name}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Info Panel (Bottom on Mobile) */}
                    <div className="w-full lg:w-80 h-[40%] lg:h-full bg-slate-950 border-t lg:border-t-0 lg:border-l border-indigo-900/50 p-4 md:p-6 flex flex-col shadow-2xl z-20 overflow-y-auto order-1 lg:order-2 flex-shrink-0">
                        {selectedSkill ? (
                            <>
                                <div className="flex items-center gap-4 mb-4 md:mb-6">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-800 rounded-lg flex items-center justify-center text-3xl md:text-4xl border-2 border-indigo-500 flex-shrink-0">
                                        {selectedSkill.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-lg md:text-xl font-bold text-white text-indigo-100">{selectedSkill.name}</h3>
                                        <div className="text-xs text-indigo-400">
                                            {currentLevel >= selectedSkill.maxLevel ? "MASTERED" : `Level ${currentLevel}`}
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded mt-1 inline-block ${selectedSkill.type==='active'?'bg-red-900 text-red-200':(selectedSkill.type==='buff'?'bg-green-900 text-green-200':'bg-blue-900 text-blue-200')}`}>
                                            {selectedSkill.type === 'active' ? '액티브' : (selectedSkill.type === 'buff' ? '버프' : '패시브')}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4 md:space-y-6 flex-1">
                                    <div className="bg-indigo-900/20 p-3 md:p-4 rounded-lg border border-indigo-500/30">
                                        <h4 className="text-xs md:text-sm font-bold text-indigo-300 mb-1">스킬 설명</h4>
                                        <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
                                            {selectedSkill.description}
                                        </p>
                                        {(selectedSkill.type === 'active' || selectedSkill.type === 'buff') && (
                                            <div className="mt-2 pt-2 border-t border-indigo-500/30 text-[10px] md:text-xs text-gray-400 flex gap-4">
                                                <span>MP 소모: {selectedSkill.mpCost}</span>
                                                <span>쿨타임: {(selectedSkill.cooldown || 60)/60}초</span>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h4 className="text-xs md:text-sm font-bold text-gray-400 mb-1 flex items-center gap-2">
                                            <ShieldCheck size={14}/> 현재 효과
                                        </h4>
                                        <div className="bg-black/30 p-2 md:p-3 rounded text-xs md:text-sm text-white border-l-4 border-gray-500">
                                            {getSkillStats(selectedSkill.id, currentLevel)}
                                        </div>
                                    </div>

                                    {!isMaxed && (
                                        <div>
                                            <h4 className="text-xs md:text-sm font-bold text-green-400 mb-1 flex items-center gap-2">
                                                <ArrowRight size={14}/> 다음 레벨
                                            </h4>
                                            <div className="bg-green-900/20 p-2 md:p-3 rounded text-xs md:text-sm text-green-100 border-l-4 border-green-500">
                                                {getSkillStats(selectedSkill.id, currentLevel + 1)}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-indigo-900/50 space-y-3">
                                    <button 
                                        onClick={() => canUpgrade && onUpgrade(selectedSkill.id)}
                                        disabled={!canUpgrade}
                                        className={`
                                            w-full py-2 md:py-3 rounded-xl font-bold text-base md:text-lg transition-all flex items-center justify-center gap-2
                                            ${canUpgrade 
                                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg active:scale-95' 
                                                : 'bg-slate-800 text-gray-500 cursor-not-allowed'}
                                        `}
                                    >
                                        {isMaxed ? "최고 레벨" : !reqMet ? "조건 미충족" : player.sp <= 0 ? "SP 부족" : (
                                            <>
                                                <Zap size={18} className={canUpgrade ? "fill-yellow-400 text-yellow-400" : ""}/>
                                                강화 (SP 1)
                                            </>
                                        )}
                                    </button>

                                    {/* Slot Assignment for Active Skills */}
                                    {(selectedSkill.type === 'active' || selectedSkill.type === 'buff') && currentLevel > 0 && (
                                        <div>
                                            <h4 className="text-[10px] md:text-xs font-bold text-gray-400 mb-1 flex items-center gap-1">
                                                <Keyboard size={12}/> 퀵슬롯 등록
                                            </h4>
                                            <div className="grid grid-cols-5 gap-1">
                                                {hotkeys.map((slot) => {
                                                    const assigned = player.skillSlots[slot.key] === selectedSkill.id;
                                                    return (
                                                        <button
                                                            key={slot.label}
                                                            onClick={() => onAssignSlot(selectedSkill.id, slot.key)}
                                                            className={`
                                                                py-2 rounded text-xs font-bold border transition-colors
                                                                ${assigned 
                                                                    ? 'bg-yellow-600 border-yellow-400 text-white' 
                                                                    : 'bg-slate-800 border-slate-600 text-gray-400 hover:bg-slate-700 hover:text-white'}
                                                            `}
                                                        >
                                                            {slot.label}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                                스킬을 선택하여<br/>정보를 확인하세요.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkillTreeModal;