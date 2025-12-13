import React, { useState, useEffect } from 'react';
import { KeyBindings } from '../types';
import { X, Keyboard, RotateCcw, Key, Smartphone, QrCode } from 'lucide-react';
import { DEFAULT_KEY_BINDINGS } from '../constants';

interface SettingsModalProps {
    bindings: KeyBindings;
    onSave: (newBindings: KeyBindings) => void;
    onClose: () => void;
    onUnlockAll: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ bindings, onSave, onClose, onUnlockAll }) => {
    const [currentBindings, setCurrentBindings] = useState<KeyBindings>(bindings);
    const [listeningKey, setListeningKey] = useState<keyof KeyBindings | null>(null);
    const [qrUrl, setQrUrl] = useState('');

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

        // Generate QR Code URL based on current page URL
        setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}`);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [listeningKey]);

    const handleReset = () => {
        setCurrentBindings(DEFAULT_KEY_BINDINGS);
    };

    const handleSave = () => {
        onSave(currentBindings);
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
            <span className="text-gray-300 text-sm">{label}</span>
            <button
                onClick={() => setListeningKey(key)}
                className={`
                    px-3 py-1 rounded min-w-[80px] text-center text-sm font-mono transition-all
                    ${listeningKey === key 
                        ? 'bg-yellow-500 text-black animate-pulse' 
                        : 'bg-slate-700 text-white hover:bg-slate-600'}
                `}
            >
                {listeningKey === key ? 'Press Key...' : formatKey(currentBindings[key])}
            </button>
        </div>
    );

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-8 animate-in fade-in duration-300">
            <div className="bg-slate-900 border-2 border-gray-600 rounded-2xl shadow-2xl w-full max-w-4xl h-[85%] flex flex-col relative overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 flex justify-between items-center border-b border-gray-600">
                    <div className="flex items-center gap-2">
                        <Keyboard className="text-gray-400" />
                        <h2 className="text-xl font-bold text-white">게임 설정 (Settings)</h2>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-red-400 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content Layout (Split View) */}
                <div className="flex flex-1 overflow-hidden">
                    
                    {/* Left: Key Bindings (Scrollable) */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 border-r border-gray-700">
                        
                        <div className="space-y-3">
                            <h3 className="text-yellow-400 font-bold border-b border-gray-700 pb-1">이동 및 액션</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {renderKeySetting('왼쪽 이동', 'LEFT')}
                                {renderKeySetting('오른쪽 이동', 'RIGHT')}
                                {renderKeySetting('위쪽 이동', 'UP')}
                                {renderKeySetting('아래 이동', 'DOWN')}
                                {renderKeySetting('점프', 'JUMP')}
                                {renderKeySetting('공격', 'ATTACK')}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-blue-400 font-bold border-b border-gray-700 pb-1">소모품 및 메뉴</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {renderKeySetting('HP 물약', 'POTION_HP')}
                                {renderKeySetting('MP 물약', 'POTION_MP')}
                                {renderKeySetting('스킬창', 'MENU_SKILL')}
                                {renderKeySetting('아이템 상점', 'MENU_SHOP')}
                                {renderKeySetting('월드맵', 'MENU_MAP')}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-red-400 font-bold border-b border-gray-700 pb-1">무기 퀵슬롯</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {renderKeySetting('무기 1번', 'WEAPON_1')}
                                {renderKeySetting('무기 2번', 'WEAPON_2')}
                                {renderKeySetting('무기 3번', 'WEAPON_3')}
                                {renderKeySetting('무기 4번', 'WEAPON_4')}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-purple-400 font-bold border-b border-gray-700 pb-1">스킬 퀵슬롯</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {renderKeySetting('스킬 1번', 'SKILL_1')}
                                {renderKeySetting('스킬 2번', 'SKILL_2')}
                                {renderKeySetting('스킬 3번', 'SKILL_3')}
                                {renderKeySetting('스킬 4번', 'SKILL_4')}
                                {renderKeySetting('스킬 5번', 'SKILL_5')}
                            </div>
                        </div>
                    </div>

                    {/* Right: Mobile Connection & Utils */}
                    <div className="w-72 bg-slate-950 p-6 flex flex-col gap-6">
                        
                        {/* Mobile Connect Section */}
                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-600 flex flex-col items-center text-center">
                            <div className="flex items-center gap-2 text-white font-bold mb-3">
                                <Smartphone className="text-green-400" size={20}/> 모바일 접속
                            </div>
                            <div className="bg-white p-2 rounded-lg mb-2">
                                {/* Use an external QR code API for simplicity without extra dependencies */}
                                <img src={qrUrl} alt="Scan to play on mobile" className="w-32 h-32" />
                            </div>
                            <p className="text-xs text-gray-400">
                                핸드폰 카메라로 스캔하여<br/>
                                모바일에서 플레이하세요!
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">
                                (가로 모드 권장)
                            </p>
                        </div>

                        {/* Cheats Section */}
                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-600">
                            <h4 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                                <Key size={14} /> 개발자 도구
                            </h4>
                            <div className="flex flex-col gap-2">
                                <button 
                                    onClick={handleReset}
                                    className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-gray-300 py-2 rounded text-xs transition-colors"
                                >
                                    <RotateCcw size={14} /> 키 설정 초기화
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
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700 bg-gray-800/50 flex justify-end items-center">
                    <button 
                        onClick={handleSave}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-8 rounded-lg shadow-lg transition-colors"
                    >
                        설정 저장 및 닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;