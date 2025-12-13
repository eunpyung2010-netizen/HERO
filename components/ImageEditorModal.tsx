import React, { useState } from 'react';
import { X, Camera, Wand2, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { generateImage } from '../services/geminiService';

interface ImageEditorModalProps {
    onClose: () => void;
    onApplyBackground: (imageUrl: string) => void;
}

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ onClose, onApplyBackground }) => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedBg, setGeneratedBg] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        try {
            const base64 = await generateImage(prompt);
            setGeneratedBg(`data:image/png;base64,${base64}`);
            setPrompt('');
        } catch (e) {
            alert('이미지 생성 실패');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 border-2 border-purple-500 rounded-2xl shadow-2xl w-full max-w-4xl h-[85%] flex flex-col relative overflow-hidden">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-900 to-slate-900 p-4 flex justify-between items-center border-b border-purple-500/50">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="text-purple-300" />
                        <h2 className="text-xl font-bold text-white">AI 배경 스튜디오</h2>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-purple-300 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col p-6 bg-slate-900">
                    <div className="flex flex-col h-full gap-4">
                        <div className="flex-1 bg-black/40 rounded-xl border-2 border-dashed border-gray-700 flex items-center justify-center overflow-hidden relative shadow-inner">
                            {generatedBg ? (
                                <img src={generatedBg} alt="Generated Background" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-gray-500 text-center">
                                    <Wand2 className="w-16 h-16 mx-auto mb-4 opacity-30 text-purple-500"/>
                                    <p className="text-lg font-medium">나만의 게임 배경을 만들어보세요.</p>
                                    <p className="text-sm opacity-70">"신비로운 숲", "사이버펑크 도시", "불타는 지옥" 등</p>
                                </div>
                            )}
                            
                            {loading && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm z-10">
                                    <RefreshCw className="w-12 h-12 text-purple-500 animate-spin mb-2" />
                                    <p className="text-purple-200 font-bold animate-pulse">AI가 배경을 그리는 중...</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="원하는 배경을 묘사해주세요 (예: 달빛이 비치는 호수, 고대 유적지)"
                                className="flex-1 bg-slate-800 border-2 border-slate-600 rounded-xl px-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                            />
                            <button 
                                onClick={handleGenerate}
                                disabled={loading || !prompt.trim()}
                                className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-purple-900/50"
                            >
                                <Wand2 size={18} />
                                생성
                            </button>
                            {generatedBg && (
                                <button 
                                    onClick={() => onApplyBackground(generatedBg)}
                                    className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-green-900/50"
                                >
                                    적용하기
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 text-center text-xs text-gray-500">
                        Powered by Gemini 2.5 Flash Image
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageEditorModal;