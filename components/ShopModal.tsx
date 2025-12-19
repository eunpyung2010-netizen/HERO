
import React from 'react';
import { Player } from '../types';
import { UPGRADE_COSTS } from '../constants';
import { ShoppingBag, Sword, Heart, Zap, X } from 'lucide-react';

interface ShopModalProps {
    player: Player;
    onClose: () => void;
    onPurchase: (type: 'POTION_HP' | 'POTION_MP' | 'UPGRADE_ATK' | 'UPGRADE_HP' | 'UPGRADE_MP') => void;
}

const ShopModal: React.FC<ShopModalProps> = ({ player, onClose, onPurchase }) => {
    const atkCost = Math.floor(UPGRADE_COSTS.ATK.base * Math.pow(UPGRADE_COSTS.ATK.scale, Math.floor((player.attack - 10) / 5)));
    const hpCost = Math.floor(UPGRADE_COSTS.HP.base * Math.pow(UPGRADE_COSTS.HP.scale, Math.floor((player.maxHp - 100) / 50)));
    const mpCost = Math.floor(UPGRADE_COSTS.MP.base * Math.pow(UPGRADE_COSTS.MP.scale, Math.floor((player.maxMp - 100) / 30)));

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300 touch-auto">
            <div className="bg-slate-900 border-2 border-yellow-500 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-yellow-700 to-yellow-600 p-4 flex justify-between items-center border-b border-yellow-400 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="text-white w-6 h-6" />
                        <h2 className="text-xl font-black text-white drop-shadow-md">모험가 상점</h2>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-red-300 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                    {/* Consumables */}
                    <div className="space-y-4">
                        <h3 className="text-yellow-400 font-bold border-b border-yellow-400/30 pb-2 mb-2">소모품</h3>
                        
                        <div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">🍷</div>
                                <div>
                                    <div className="text-white font-bold text-sm">HP 물약</div>
                                    <div className="text-gray-400 text-xs">체력 50 회복</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => onPurchase('POTION_HP')}
                                disabled={player.gold < UPGRADE_COSTS.POTION}
                                className="px-3 py-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs font-bold rounded flex items-center gap-1 active:scale-95 transition-transform"
                            >
                                {UPGRADE_COSTS.POTION} G
                            </button>
                        </div>

                        <div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">🧪</div>
                                <div>
                                    <div className="text-white font-bold text-sm">MP 물약</div>
                                    <div className="text-gray-400 text-xs">마나 50 회복</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => onPurchase('POTION_MP')}
                                disabled={player.gold < UPGRADE_COSTS.POTION}
                                className="px-3 py-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs font-bold rounded flex items-center gap-1 active:scale-95 transition-transform"
                            >
                                {UPGRADE_COSTS.POTION} G
                            </button>
                        </div>
                    </div>

                    {/* Upgrades */}
                    <div className="space-y-4">
                        <h3 className="text-blue-400 font-bold border-b border-blue-400/30 pb-2 mb-2">능력치 강화</h3>

                        {/* Attack */}
                        <div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-900/50 rounded-lg text-red-400"><Sword size={18}/></div>
                                <div>
                                    <div className="text-white font-bold text-sm">공격력 강화</div>
                                    <div className="text-gray-400 text-xs">현재: {player.attack} (+5)</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => onPurchase('UPGRADE_ATK')}
                                disabled={player.gold < atkCost}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs font-bold rounded active:scale-95 transition-transform"
                            >
                                {atkCost} G
                            </button>
                        </div>

                        {/* HP */}
                        <div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-900/50 rounded-lg text-pink-400"><Heart size={18}/></div>
                                <div>
                                    <div className="text-white font-bold text-sm">최대 체력 증가</div>
                                    <div className="text-gray-400 text-xs">현재: {player.maxHp} (+50)</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => onPurchase('UPGRADE_HP')}
                                disabled={player.gold < hpCost}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs font-bold rounded active:scale-95 transition-transform"
                            >
                                {hpCost} G
                            </button>
                        </div>

                         {/* MP */}
                         <div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-900/50 rounded-lg text-indigo-400"><Zap size={18}/></div>
                                <div>
                                    <div className="text-white font-bold text-sm">최대 마나 증가</div>
                                    <div className="text-gray-400 text-xs">현재: {player.maxMp} (+30)</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => onPurchase('UPGRADE_MP')}
                                disabled={player.gold < mpCost}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs font-bold rounded active:scale-95 transition-transform"
                            >
                                {mpCost} G
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-800 p-4 flex justify-between items-center text-sm text-gray-400 flex-shrink-0">
                     <div>보유 골드: <span className="text-yellow-400 font-bold">{player.gold.toLocaleString()} G</span></div>
                     <div className="text-xs">터치하여 구매</div>
                </div>
            </div>
        </div>
    );
};

export default ShopModal;
