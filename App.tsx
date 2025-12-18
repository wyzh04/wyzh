
import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Image as ImageIcon, Copy, Check, RefreshCw, 
  AlertCircle, Wand2, Languages, Film, History, 
  User as UserIcon, LogOut, Download, Trash2, X, Plus, Layers, MessageSquareText
} from 'lucide-react';
import { analyzeMediaForPrompts } from './services/geminiService';
import { AnalysisState, PromptResult, PromptRecord, User } from './types';

const App: React.FC = () => {
  // --- State ---
  const [mediaList, setMediaList] = useState<{ id: string; url: string; type: string; base64: string }[]>([]);
  const [fusionInstructions, setFusionInstructions] = useState('');
  const [status, setStatus] = useState<AnalysisState>({
    loading: false,
    error: null,
    result: null,
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [user, setUser] = useState<User>(() => {
    const savedUser = localStorage.getItem('pm_user');
    return savedUser ? JSON.parse(savedUser) : { name: '', isLoggedIn: false };
  });
  const [history, setHistory] = useState<PromptRecord[]>(() => {
    const savedHistory = localStorage.getItem('pm_history');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  
  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('pm_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('pm_history', JSON.stringify(history));
  }, [history]);

  // --- Handlers ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          setMediaList(prev => [...prev, {
            id: crypto.randomUUID(),
            url: URL.createObjectURL(file),
            type: file.type,
            base64: base64
          }]);
        };
        reader.readAsDataURL(file);
      });
      setStatus({ ...status, result: null, error: null });
    }
  };

  const removeMedia = (id: string) => {
    setMediaList(prev => prev.filter(item => item.id !== id));
  };

  const handleAnalyze = async () => {
    if (mediaList.length === 0) return;
    setStatus(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await analyzeMediaForPrompts(
        mediaList.map(m => ({ base64: m.base64, mimeType: m.type })),
        fusionInstructions
      );
      setStatus({ loading: false, error: null, result });
      
      // Save to history
      const newRecord: PromptRecord = {
        ...result,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        mediaType: mediaList.length > 1 ? 'mixed/fusion' : mediaList[0].type
      };
      setHistory(prev => [newRecord, ...prev]);
    } catch (err) {
      console.error(err);
      setStatus({ 
        loading: false, 
        error: '分析失败。可能是图片过多或体积过大，请尝试减少图片数量。', 
        result: null 
      });
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginInput.trim()) {
      setUser({ name: loginInput.trim(), isLoggedIn: true });
    }
  };

  const handleLogout = () => {
    setUser({ name: '', isLoggedIn: false });
    setHistory([]);
    localStorage.removeItem('pm_history');
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `prompt_history_${new Date().toISOString().slice(0,10)}.json`);
    linkElement.click();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-8 relative">
      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                历史记录
              </h2>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-10">
                  <History className="w-12 h-12 mb-4 opacity-20" />
                  <p>暂无记录</p>
                </div>
              ) : (
                history.map(item => (
                  <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                        {item.mediaType === 'mixed/fusion' ? <Layers className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1">{item.descriptionZh}</h4>
                    <button 
                      onClick={() => { setStatus({ ...status, result: item }); setShowHistory(false); }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 mt-2"
                    >
                      查看详情
                    </button>
                  </div>
                ))
              )}
            </div>
            {history.length > 0 && (
              <div className="p-4 border-t border-slate-100">
                <button onClick={exportHistory} className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" /> 导出记录
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="max-w-6xl w-full flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
            <Wand2 className="text-white w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">PromptMaster Nano</h1>
            <p className="text-slate-500 text-xs md:text-sm">支持多图风格融合的提示词解析系统</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user.isLoggedIn ? (
            <div className="flex items-center gap-4">
              <button onClick={() => setShowHistory(true)} className="px-4 py-2 flex items-center gap-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 shadow-sm transition-all">
                <History className="w-4 h-4 text-indigo-500" /> 历史记录
              </button>
              <div className="flex items-center gap-3 bg-white pl-4 pr-2 py-1.5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-slate-700 font-bold text-sm">{user.name}</span>
                <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"><LogOut className="w-5 h-5" /></button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="flex items-center gap-2">
              <input 
                type="text" placeholder="输入用户名" 
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 w-40 md:w-56"
                value={loginInput} onChange={(e) => setLoginInput(e.target.value)}
              />
              <button type="submit" className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md transition-all"><UserIcon className="w-5 h-5" /></button>
            </form>
          )}
        </div>
      </header>

      {!user.isLoggedIn ? (
        <div className="max-w-2xl w-full bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-200 mt-10">
          <div className="bg-indigo-50 p-6 rounded-full w-fit mx-auto mb-6"><UserIcon className="w-12 h-12 text-indigo-600" /></div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">欢迎使用 PromptMaster</h2>
          <p className="text-slate-500 mb-8">请先登录以开启您的创作解析之旅。支持多图融合模式。</p>
          <button onClick={() => setUser({ name: '访客', isLoggedIn: true })} className="px-8 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">以访客身份继续</button>
        </div>
      ) : (
        <main className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Media Section */}
          <section className="space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-800">
                  <ImageIcon className="w-5 h-5 text-indigo-500" />
                  管理上传媒体 ({mediaList.length})
                </h2>
                {mediaList.length > 1 && (
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-xs font-bold rounded-full flex items-center gap-1 animate-pulse">
                    <Layers className="w-3 h-3" /> 融合模式开启
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
                {mediaList.map((item) => (
                  <div key={item.id} className="relative aspect-square group">
                    {item.type.startsWith('video/') ? (
                      <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden">
                        <Film className="w-6 h-6 text-white opacity-50" />
                      </div>
                    ) : (
                      <img src={item.url} className="w-full h-full object-cover rounded-xl border border-slate-100" />
                    )}
                    <button 
                      onClick={() => removeMedia(item.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                <label className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all text-slate-400">
                  <Plus className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold">添加媒体</span>
                  <input type="file" className="hidden" accept="image/*,video/*" multiple onChange={handleFileUpload} />
                </label>
              </div>

              {/* Fusion Instructions Field */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-600 mb-2 flex items-center gap-2">
                  <MessageSquareText className="w-4 h-4 text-indigo-400" />
                  自定义要求 / Instructions
                </label>
                <textarea 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none resize-none h-24"
                  placeholder="例如：保留图1的角色，融合图2的背景色调，整体呈现油画风格..."
                  value={fusionInstructions}
                  onChange={(e) => setFusionInstructions(e.target.value)}
                />
              </div>

              {mediaList.length > 0 && !status.result && !status.loading && (
                <button 
                  onClick={handleAnalyze}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-5 h-5" />
                  {mediaList.length > 1 ? `融合分析 ${mediaList.length} 张图片` : '解析媒体生成提示词'}
                </button>
              )}

              {status.loading && (
                <div className="w-full py-4 bg-slate-100 text-slate-600 font-medium rounded-2xl flex items-center justify-center gap-3">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  正在深度对齐并融合特征...
                </div>
              )}
            </div>

            {status.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">{status.error}</p>
              </div>
            )}
          </section>

          {/* Results Section */}
          <section className="space-y-6">
            {!status.result && !status.loading ? (
              <div className="h-[400px] bg-white rounded-3xl border border-slate-200 border-dashed p-10 flex flex-col items-center justify-center text-center opacity-60">
                <Layers className="w-12 h-12 text-slate-300 mb-6" />
                <h3 className="text-xl font-semibold text-slate-700">等待融合解析</h3>
                <p className="text-slate-500 mt-2 max-w-xs">您可以上传多张参考图并提供具体要求，AI 将为您合成一套具有统一风格的提示词。</p>
              </div>
            ) : status.result ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">融合解析总结</h3>
                  <p className="text-slate-800 font-medium mb-2">{status.result.descriptionZh}</p>
                  <p className="text-slate-500 text-xs italic">{status.result.description}</p>
                </div>

                <PromptCard 
                  title="融合正向提示词 / Fused Positive"
                  english={status.result.positivePrompt}
                  chinese={status.result.positivePromptZh}
                  type="pos"
                  copiedId={copiedId}
                  onCopy={copyToClipboard}
                />

                <PromptCard 
                  title="融合反提示词 / Fused Negative"
                  english={status.result.negativePrompt}
                  chinese={status.result.negativePromptZh}
                  type="neg"
                  copiedId={copiedId}
                  onCopy={copyToClipboard}
                  accentColor="text-red-500"
                />

                <button 
                  onClick={() => { setMediaList([]); setFusionInstructions(''); setStatus({ loading: false, error: null, result: null }); }}
                  className="w-full py-3 border-2 border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 font-semibold rounded-2xl"
                >
                  清空列表重新开始
                </button>
              </div>
            ) : null}
          </section>
        </main>
      )}

      <footer className="mt-20 text-slate-400 text-xs pb-8 text-center">
        <p>&copy; {new Date().getFullYear()} PromptMaster Nano. 支持大规模视觉特征对齐与融合。</p>
      </footer>
    </div>
  );
};

interface PromptCardProps {
  title: string; english: string; chinese: string; type: string; 
  copiedId: string | null; onCopy: (text: string, id: string) => void;
  accentColor?: string;
}

const PromptCard: React.FC<PromptCardProps> = ({ title, english, chinese, type, copiedId, onCopy, accentColor = "text-emerald-600" }) => (
  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
      <h3 className={`text-sm font-bold tracking-wider ${accentColor}`}>{title}</h3>
    </div>
    <div className="p-6 space-y-4">
      <div className="group">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">English Prompt</span>
          <button onClick={() => onCopy(english, `${type}-en`)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600">
            {copiedId === `${type}-en` ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs font-mono break-words leading-relaxed border border-slate-800 shadow-inner">
          {english}
        </div>
      </div>
      <div className="pt-4 border-t border-slate-100">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">中文释义</span>
          <button onClick={() => onCopy(chinese, `${type}-zh`)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600">
            {copiedId === `${type}-zh` ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-slate-700 text-sm leading-relaxed">{chinese}</p>
      </div>
    </div>
  </div>
);

export default App;
