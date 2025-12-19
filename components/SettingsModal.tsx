
import React, { useState, useEffect } from 'react';
import { KeyBindings, MobileControlSettings } from '../types';
import { X, Keyboard, RotateCcw, Key, Move, Sliders, QrCode } from 'lucide-react';
import { DEFAULT_KEY_BINDINGS, DEFAULT_MOBILE_SETTINGS } from '../constants';

interface SettingsModalProps {
    bindings: KeyBindings;
    onSave: (newBindings: KeyBindings) => void;
    mobileSettings?: MobileControlSettings;
    onSaveMobileSettings?: (settings: MobileControlSettings) => void;
    onClose: () => void;
    onUnlockAll: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ bindings, onSave, mobileSettings, onSaveMobileSettings, onClose, onUnlockAll }) => {
    const [currentBindings, setCurrentBindings] = useState<KeyBindings>(bindings);
    const [currentMobileSettings, setCurrentMobileSettings] = useState<MobileControlSettings>(mobileSettings || DEFAULT_MOBILE_SETTINGS);
    const [listeningKey, setListeningKey] = useState<keyof KeyBindings | null>(null);
    const [activeTab, setActiveTab] = useState<'keyboard' | 'touch'>('keyboard');

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (listeningKey) {
                e.preventDefault();
                setCurrentBindings(prev => ({
                    ...prev,
                    [listeningKey]: e.code
                }));
                setListeningKey(null);
            }
        };

        if (listeningKey) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [listeningKey]);

    const handleReset = () => {
        if (activeTab === 'keyboard') {
            setCurrentBindings(DEFAULT_KEY_BINDINGS);
        } else {
            setCurrentMobileSettings(DEFAULT_MOBILE_SETTINGS);
        }
    };

    const handleSave = () => {
        onSave(currentBindings);
        if (onSaveMobileSettings) {
            onSaveMobileSettings(currentMobileSettings);
        }
        onClose();
    };

    const formatKey = (code: string) => {
        if (code.startsWith('Key')) return code.replace('Key', '');
        if (code.startsWith('Digit')) return code.replace('Digit', '');
        if (code.startsWith('Arrow')) return code.replace('Arrow', 'Arrow ');
        return code;
    };

    const renderKeySetting = (label: string, key: keyof KeyBindings) => (
        <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded border border-slate-700">
            <span className="text-gray-300 text-xs md:text-sm">{label}</span>
            <button
                onClick={() => setListeningKey(key)}
                className={`
                    px-2 py-1 md:px-3 md:py-1 rounded min-w-[60px] md:min-w-[80px] text-center text-xs md:text-sm font-mono transition-all
                    ${listeningKey === key 
                        ? 'bg-yellow-500 text-black animate-pulse' 
                        : 'bg-slate-700 text-white hover:bg-slate-600'}
                `}
            >
                {listeningKey === key ? '...' : formatKey(currentBindings[key])}
            </button>
        </div>
    );

    const renderSlider = (label: string, value: number, min: number, max: number, step: number, onChange: (val: number) => void) => (
        <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
            <div className="flex justify-between mb-2">
                <span className="text-gray-300 text-xs font-bold">{label}</span>
                <span className="text-yellow-400 text-xs">{value}</span>
            </div>
            <input 
                type="range" min={min} max={max} step={step} value={value} 
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
        </div>
    );

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-8 animate-in fade-in duration-300 touch-auto">
            <div className="bg-slate-900 border-2 border-gray-600 rounded-2xl shadow-2xl w-full max-w-4xl h-full md:h-[90%] flex flex-col relative overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 flex justify-between items-center border-b border-gray-600 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Sliders className="text-gray-400" />
                            <h2 className="text-lg md:text-xl font-bold text-white">설정 (Settings)</h2>
                        </div>
                        <div className="flex bg-slate-800 rounded p-1 gap-1">
                            <button 
                                onClick={() => setActiveTab('keyboard')}
                                className={`px-3 py-1 rounded text-xs font-bold transition-all ${activeTab === 'keyboard' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Keyboard size={14} className="inline mr-1"/> 키보드
                            </button>
                            <button 
                                onClick={() => setActiveTab('touch')}
                                className={`px-3 py-1 rounded text-xs font-bold transition-all ${activeTab === 'touch' ? 'bg-green-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Move size={14} className="inline mr-1"/> 터치 컨트롤
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-red-400 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content Layout */}
                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                    
                    {/* Left: Settings Content */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 lg:border-r border-gray-700">
                        
                        {activeTab === 'keyboard' ? (
                            <>
                                <div className="space-y-3">
                                    <h3 className="text-yellow-400 font-bold border-b border-gray-700 pb-1 text-sm md:text-base">이동 및 액션</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {renderKeySetting('왼쪽 이동', 'LEFT')}
                                        {renderKeySetting('오른쪽 이동', 'RIGHT')}
                                        {renderKeySetting('위쪽 이동', 'UP')}
                                        {renderKeySetting('아래 이동', 'DOWN')}
                                        {renderKeySetting('점프', 'JUMP')}
                                        {renderKeySetting('공격', 'ATTACK')}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-blue-400 font-bold border-b border-gray-700 pb-1 text-sm md:text-base">소모품 및 메뉴</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {renderKeySetting('HP 물약', 'POTION_HP')}
                                        {renderKeySetting('MP 물약', 'POTION_MP')}
                                        {renderKeySetting('스킬창', 'MENU_SKILL')}
                                        {renderKeySetting('아이템 상점', 'MENU_SHOP')}
                                        {renderKeySetting('월드맵', 'MENU_MAP')}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-red-400 font-bold border-b border-gray-700 pb-1 text-sm md:text-base">무기 퀵슬롯</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {renderKeySetting('무기 1번', 'WEAPON_1')}
                                        {renderKeySetting('무기 2번', 'WEAPON_2')}
                                        {renderKeySetting('무기 3번', 'WEAPON_3')}
                                        {renderKeySetting('무기 4번', 'WEAPON_4')}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-purple-400 font-bold border-b border-gray-700 pb-1 text-sm md:text-base">스킬 퀵슬롯</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {renderKeySetting('스킬 1번', 'SKILL_1')}
                                        {renderKeySetting('스킬 2번', 'SKILL_2')}
                                        {renderKeySetting('스킬 3번', 'SKILL_3')}
                                        {renderKeySetting('스킬 4번', 'SKILL_4')}
                                        {renderKeySetting('스킬 5번', 'SKILL_5')}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6">
                                <p className="text-gray-400 text-xs bg-slate-800 p-3 rounded border border-slate-600">
                                    가로 모드에서 화면에 표시되는 가상 컨트롤러의 위치와 크기를 조절합니다.
                                </p>

                                <div className="space-y-3">
                                    <h3 className="text-green-400 font-bold border-b border-gray-700 pb-1 text-sm md:text-base">방향키 (D-Pad)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {renderSlider('좌우 위치 (왼쪽 여백 %)', currentMobileSettings.dpadX, 0, 40, 1, (v) => setCurrentMobileSettings(p => ({...p, dpadX: v})))}
                                        {renderSlider('상하 위치 (아래 여백 %)', currentMobileSettings.dpadY, 0, 40, 1, (v) => setCurrentMobileSettings(p => ({...p, dpadY: v})))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-red-400 font-bold border-b border-gray-700 pb-1 text-sm md:text-base">액션 버튼 (공격/점프)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {renderSlider('좌우 위치 (오른쪽 여백 %)', currentMobileSettings.actionX, 0, 40, 1, (v) => setCurrentMobileSettings(p => ({...p, actionX: v})))}
                                        {renderSlider('상하 위치 (아래 여백 %)', currentMobileSettings.actionY, 0, 40, 1, (v) => setCurrentMobileSettings(p => ({...p, actionY: v})))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-blue-400 font-bold border-b border-gray-700 pb-1 text-sm md:text-base">공통 설정</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {renderSlider('버튼 크기 (배율)', currentMobileSettings.scale, 0.8, 2.0, 0.1, (v) => setCurrentMobileSettings(p => ({...p, scale: v})))}
                                        {renderSlider('투명도', currentMobileSettings.opacity, 0.2, 1.0, 0.1, (v) => setCurrentMobileSettings(p => ({...p, opacity: v})))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Utils */}
                    <div className="w-full lg:w-72 bg-slate-950 p-6 flex flex-col gap-6 flex-shrink-0 border-t lg:border-t-0 border-gray-700">
                        {/* Actions */}
                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-600 flex flex-col gap-2">
                            <button 
                                onClick={handleReset}
                                className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-gray-300 py-2 rounded text-xs transition-colors"
                            >
                                <RotateCcw size={14} /> 설정 초기화
                            </button>
                            <button 
                                onClick={onUnlockAll}
                                className="flex items-center justify-center gap-2 bg-yellow-900/50 hover:bg-yellow-900/80 text-yellow-500 border border-yellow-700/50 py-2 rounded text-xs transition-colors"
                                title="모든 스킬/전직 해금 (테스트용)"
                            >
                                <QrCode size={14} /> 치트키: 모두 해금
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700 bg-gray-800/50 flex justify-end items-center flex-shrink-0">
                    <button 
                        onClick={handleSave}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-8 rounded-lg shadow-lg transition-colors active:scale-95"
                    >
                        저장 및 닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
