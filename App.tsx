
import React, { useState, useEffect } from 'react';
import { 
  ImageIcon, Copy, Check, RefreshCw, 
  Wand2, History, 
  User as UserIcon, LogOut, Trash2, X, Plus, Layers, MessageSquareText, Menu,
  Smartphone, Chrome, MessageCircle, ShieldCheck, Cpu, Binary, Eye, Film, Zap,
  Sparkles, Camera, Clapperboard
} from 'lucide-react';
import { analyzeMediaForPrompts } from './services/geminiService';
import { AnalysisState, PromptResult, PromptRecord, User, TargetModel } from './types';

const App: React.FC = () => {
  // --- State ---
  const [mediaList, setMediaList] = useState<{ id: string; url: string; type: string; base64: string }[]>([]);
  const [fusionInstructions, setFusionInstructions] = useState('');
  const [targetModel, setTargetModel] = useState<TargetModel>('nano');
  const [status, setStatus] = useState<AnalysisState>({
    loading: false,
    error: null,
    result: null,
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [user, setUser] = useState<User>(() => {
    const savedUser = localStorage.getItem('pm_user_v3');
    return savedUser ? JSON.parse(savedUser) : { 
      id: '', name: '', loginType: null, isLoggedIn: false, registeredAt: 0 
    };
  });
  const [history, setHistory] = useState<PromptRecord[]>(() => {
    const savedHistory = localStorage.getItem('pm_history_nano');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  const [showHistory, setShowHistory] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authStage, setAuthStage] = useState<'select' | 'input' | 'processing'>('select');
  const [phoneInput, setPhoneInput] = useState('');

  useEffect(() => {
    localStorage.setItem('pm_user_v3', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('pm_history_nano', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (window.innerWidth < 1024) setShowHistory(false);
  }, []);

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
        fusionInstructions,
        targetModel
      );
      setStatus({ loading: false, error: null, result });
      const newRecord: PromptRecord = {
        ...result,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        mediaType: mediaList.length > 1 ? 'mixed/fusion' : mediaList[0].type,
        targetModel
      };
      setHistory(prev => [newRecord, ...prev]);
    } catch (err) {
      setStatus({ loading: false, error: '分析失败，请检查网络或指令。', result: status.result });
    }
  };

  const startLogin = (method: 'google' | 'wechat' | 'phone') => {
    if (method === 'phone') setAuthStage('input');
    else {
      setAuthStage('processing');
      setTimeout(() => finalizeLogin(method), 800);
    }
  };

  const finalizeLogin = (method: 'google' | 'wechat' | 'phone') => {
    const newUser: User = {
      id: crypto.randomUUID(),
      name: method === 'google' ? 'Google Master' : method === 'wechat' ? '微信创作者' : `用户 ${phoneInput.slice(-4)}`,
      loginType: method,
      isLoggedIn: true,
      registeredAt: Date.now(),
    };
    setUser(newUser);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setUser({ id: '', name: '', loginType: null, isLoggedIn: false, registeredAt: 0 });
    setHistory([]);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans selection:bg-indigo-200 transition-colors duration-500 ${targetModel === 'sora2' ? 'bg-slate-900' : 'bg-slate-50'}`}>
      
      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowLoginModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-100">
                <ShieldCheck className="text-white w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">大师身份认证</h3>
            </div>
            <div className="space-y-4">
              <button onClick={() => startLogin('wechat')} className="w-full py-4 px-6 bg-[#07C160] text-white rounded-2xl font-black flex items-center gap-3 active:scale-95 transition-all"><MessageCircle className="w-6 h-6" />微信一键登录</button>
              <button onClick={() => startLogin('google')} className="w-full py-4 px-6 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black flex items-center gap-3 active:scale-95 transition-all"><Chrome className="w-6 h-6 text-blue-500" />Google 账号登录</button>
              <button onClick={() => setAuthStage('input')} className="w-full py-4 px-6 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-3 active:scale-95 transition-all"><Smartphone className="w-6 h-6" />手机号码登录</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Sidebar --- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-80 border-r transition-all duration-500 lg:translate-x-0 ${targetModel === 'sora2' ? 'bg-slate-950 border-white/10' : 'bg-white border-slate-200'} ${showHistory ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className={`p-6 border-b flex justify-between items-center sticky top-0 ${targetModel === 'sora2' ? 'border-white/10' : 'border-slate-100'}`}>
          <h2 className={`font-bold flex items-center gap-2 ${targetModel === 'sora2' ? 'text-white' : 'text-slate-800'}`}>
            {targetModel === 'sora2' ? <Clapperboard className="w-5 h-5 text-indigo-400" /> : <Binary className="w-5 h-5 text-indigo-600" />}
            语义存档
          </h2>
          <button onClick={() => setShowHistory(false)} className="lg:hidden"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {history.length === 0 ? (
            <div className={`h-full flex flex-col items-center justify-center opacity-40 ${targetModel === 'sora2' ? 'text-white' : 'text-slate-400'}`}>
              <Eye className="w-10 h-10 mb-2" />
              <p className="text-xs font-bold">暂无历史记录</p>
            </div>
          ) : (
            history.map(item => (
              <div key={item.id} onClick={() => setStatus({ ...status, result: item })} className={`p-4 rounded-2xl border transition-all cursor-pointer ${status.result?.id === item.id ? (targetModel === 'sora2' ? 'bg-indigo-900/40 border-indigo-500' : 'bg-indigo-50 border-indigo-200') : (targetModel === 'sora2' ? 'bg-white/5 border-white/5 hover:border-white/20' : 'bg-white border-slate-100')}`}>
                <div className="flex justify-between items-center mb-1">
                   <span className={`text-[8px] font-black uppercase tracking-widest ${targetModel === 'sora2' ? 'text-indigo-400' : 'text-indigo-600'}`}>{item.targetModel} Engine</span>
                   <button onClick={(e) => { e.stopPropagation(); setHistory(h => h.filter(i => i.id !== item.id)); }} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                </div>
                <h4 className={`font-bold text-xs truncate ${targetModel === 'sora2' ? 'text-slate-300' : 'text-slate-700'}`}>{item.descriptionZh}</h4>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* --- Main --- */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className={`px-8 py-4 flex items-center justify-between z-30 transition-all duration-500 border-b ${targetModel === 'sora2' ? 'bg-slate-950/80 border-white/10 backdrop-blur-md' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-4">
            {!showHistory && <button onClick={() => setShowHistory(true)} className={`p-2 rounded-xl ${targetModel === 'sora2' ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-600'}`}><Menu className="w-5 h-5" /></button>}
            <div>
              <h1 className={`text-xl font-black leading-none ${targetModel === 'sora2' ? 'text-white' : 'text-slate-900'}`}>PromptMaster Nano</h1>
              <p className={`text-[10px] font-bold mt-1 uppercase tracking-[0.3em] ${targetModel === 'sora2' ? 'text-indigo-400' : 'text-slate-400'}`}>Architecture Suite v3.5</p>
            </div>
          </div>
          {user.isLoggedIn ? (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all ${targetModel === 'sora2' ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
              <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white"><UserIcon className="w-4 h-4" /></div>
              <span className="font-black text-[10px]">{user.name}</span>
              <button onClick={handleLogout} className="ml-2 text-slate-400 hover:text-red-500"><LogOut className="w-4 h-4" /></button>
            </div>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className="px-6 py-2 bg-indigo-600 text-white font-black rounded-xl text-xs hover:scale-105 transition-all">认证实验室</button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
          {!user.isLoggedIn ? (
            <div className={`max-w-2xl mx-auto rounded-[3rem] p-16 text-center border mt-10 transition-all ${targetModel === 'sora2' ? 'bg-white/5 border-white/10 shadow-2xl' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className={`p-8 rounded-full w-fit mx-auto mb-8 ${targetModel === 'sora2' ? 'bg-indigo-500/20' : 'bg-indigo-50'}`}><Zap className={`w-16 h-16 ${targetModel === 'sora2' ? 'text-indigo-400' : 'text-indigo-600'}`} /></div>
              <h2 className={`text-3xl font-black mb-4 ${targetModel === 'sora2' ? 'text-white' : 'text-slate-900'}`}>跨模型视觉架构系统</h2>
              <p className={`mb-10 font-medium ${targetModel === 'sora2' ? 'text-slate-400' : 'text-slate-500'}`}>专为 Nano 图像渲染与 Sora 2 动态视频设计的生成式指令对齐工坊。</p>
              <button onClick={() => setShowLoginModal(true)} className="px-14 py-5 bg-indigo-600 text-white font-black rounded-full text-lg hover:shadow-2xl shadow-indigo-500/20 transition-all">开启架构权</button>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              
              {/* 控制面板 */}
              <div className={`rounded-[3rem] p-8 md:p-10 border transition-all duration-500 ${targetModel === 'sora2' ? 'bg-slate-950 border-white/10 shadow-2xl shadow-indigo-500/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="space-y-10">
                  <div className="flex justify-between items-center">
                    <h2 className={`text-2xl font-black flex items-center gap-3 ${targetModel === 'sora2' ? 'text-white' : 'text-slate-800'}`}>
                      {targetModel === 'sora2' ? <Clapperboard className="w-7 h-7 text-indigo-400" /> : <Camera className="w-7 h-7 text-indigo-600" />}
                      架构 Workbench
                    </h2>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${targetModel === 'sora2' ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-600'}`}>
                      {targetModel === 'nano' ? 'Static Opt' : 'Motion Opt'}
                    </span>
                  </div>

                  {/* 模型切换器 */}
                  <div className={`grid grid-cols-2 gap-3 p-2 rounded-[1.5rem] transition-all ${targetModel === 'sora2' ? 'bg-white/5' : 'bg-slate-100'}`}>
                    <button onClick={() => setTargetModel('nano')} className={`py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-3 transition-all ${targetModel === 'nano' ? 'bg-white text-indigo-600 shadow-xl' : (targetModel === 'sora2' ? 'text-slate-500 hover:text-white' : 'text-slate-500 hover:text-slate-800')}`}>
                      <Cpu className="w-4 h-4" /> NANO 图像
                    </button>
                    <button onClick={() => setTargetModel('sora2')} className={`py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-3 transition-all ${targetModel === 'sora2' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-800'}`}>
                      <Film className="w-4 h-4" /> SORA 2 视频
                    </button>
                  </div>

                  {/* 素材库 */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                    {mediaList.map(item => (
                      <div key={item.id} className="relative aspect-square group">
                        <img src={item.url} className={`w-full h-full object-cover rounded-[1.2rem] border-2 transition-all group-hover:scale-105 ${targetModel === 'sora2' ? 'border-white/10' : 'border-slate-50'}`} />
                        <button onClick={() => removeMedia(item.id)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                    <label className={`aspect-square border-2 border-dashed rounded-[1.2rem] flex flex-col items-center justify-center cursor-pointer transition-all ${targetModel === 'sora2' ? 'border-white/10 hover:border-indigo-500 hover:bg-indigo-500/10 text-slate-500' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-400'}`}>
                      <Plus className="w-10 h-10 mb-1" />
                      <span className="text-[9px] font-black uppercase">Add Assets</span>
                      <input type="file" className="hidden" multiple onChange={handleFileUpload} />
                    </label>
                  </div>

                  {/* 指令输入 */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${targetModel === 'sora2' ? 'text-indigo-400' : 'text-slate-400'}`}>
                        <MessageSquareText className="w-4 h-4" /> 导演意图 / Director Instruction
                      </label>
                    </div>
                    <textarea 
                      className={`w-full p-8 rounded-[2rem] text-sm font-bold outline-none border-2 transition-all h-48 resize-none shadow-inner leading-relaxed ${targetModel === 'sora2' ? 'bg-white/5 border-white/5 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10' : 'bg-slate-50 border-slate-100 text-slate-800 focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50'}`} 
                      placeholder={targetModel === 'nano' ? "Nano 模式：详细描述静止画面的物理质感、材质权重、特定的渲染风格标签..." : "Sora 2 模式：描述视频的开场、关键动作轨迹、镜头的平移/推拉感、环境如何随时间产生交互..."}
                      value={fusionInstructions} 
                      onChange={e => setFusionInstructions(e.target.value)} 
                    />
                  </div>

                  <button 
                    onClick={handleAnalyze} 
                    disabled={mediaList.length === 0 || status.loading}
                    className={`group w-full py-6 rounded-full font-black text-lg flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl relative overflow-hidden ${status.loading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : (targetModel === 'sora2' ? 'bg-indigo-600 text-white shadow-indigo-500/40 hover:bg-indigo-700' : 'bg-slate-900 text-white hover:bg-black')}`}
                  >
                    {status.loading ? <><RefreshCw className="w-6 h-6 animate-spin" />正在架构...</> : <><Sparkles className="w-6 h-6" />生成大师级指令</>}
                  </button>
                </div>
              </div>

              {/* 结果区域 */}
              <div className="space-y-8">
                {!status.result && !status.loading ? (
                  <div className={`h-full min-h-[600px] border-4 border-dashed rounded-[3rem] flex flex-col items-center justify-center p-12 text-center transition-all ${targetModel === 'sora2' ? 'border-white/5 text-white/20' : 'border-slate-100 text-slate-200'}`}>
                    <Clapperboard className="w-24 h-24 mb-6 opacity-40" />
                    <p className="text-xl font-black">等待指令对齐</p>
                    <p className="text-xs mt-3 italic opacity-60 max-w-xs leading-relaxed">请选择目标模型并上传参考源素材，AI 将执行像素级/叙事级解构。</p>
                  </div>
                ) : status.result ? (
                  <div className="space-y-8 animate-in slide-in-from-right-12 duration-700 ease-out">
                    <div className={`p-10 rounded-[3rem] relative overflow-hidden shadow-2xl transition-all duration-500 ${targetModel === 'sora2' ? 'bg-gradient-to-br from-indigo-700 to-indigo-950 text-white border border-white/10' : 'bg-slate-900 text-white shadow-slate-200'}`}>
                      <div className="absolute top-0 right-0 p-8 opacity-20"><Zap className="w-40 h-40" /></div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-6">Master Analytical Report</h3>
                      <p className="text-2xl font-bold leading-tight mb-4 border-l-4 border-indigo-500 pl-6">{status.result.descriptionZh}</p>
                      <p className="text-xs opacity-60 font-mono italic leading-relaxed">{status.result.description}</p>
                    </div>

                    <PromptCard title="Positive Instruction / 正向指令" content={status.result.positivePrompt} zh={status.result.positivePromptZh} type="pos" onCopy={copyToClipboard} copiedId={copiedId} targetModel={targetModel} />
                    <PromptCard title="Negative Guard / 负向规避" content={status.result.negativePrompt} zh={status.result.negativePromptZh} type="neg" onCopy={copyToClipboard} copiedId={copiedId} accentColor="text-red-500" targetModel={targetModel} />

                    <button onClick={() => { setMediaList([]); setStatus({ ...status, result: null }); setFusionInstructions(''); }} className={`w-full py-5 font-black rounded-full text-xs uppercase tracking-[0.3em] transition-all border-2 ${targetModel === 'sora2' ? 'bg-white/5 border-white/10 text-slate-400 hover:text-red-400 hover:border-red-400/50' : 'bg-white border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100'}`}>Reset Workbench</button>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const PromptCard: React.FC<{title: string, content: string, zh: string, type: string, onCopy: (c: string, id: string) => void, copiedId: string | null, accentColor?: string, targetModel: TargetModel}> = ({ title, content, zh, type, onCopy, copiedId, accentColor="text-indigo-500", targetModel }) => (
  <div className={`rounded-[3rem] border shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500 ${targetModel === 'sora2' ? 'bg-slate-950 border-white/10' : 'bg-white border-slate-200'}`}>
    <div className={`px-10 py-5 flex justify-between items-center ${targetModel === 'sora2' ? 'bg-white/5 border-b border-white/5' : 'bg-slate-50/50 border-b border-slate-50'}`}>
      <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${accentColor}`}>{title}</span>
      {targetModel === 'sora2' ? <Film className="w-4 h-4 text-white/20" /> : <Cpu className="w-4 h-4 text-slate-200" />}
    </div>
    <div className="p-10 space-y-10">
      <div className="relative group/field">
        <div className="flex justify-between items-center mb-4">
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Binary className="w-3 h-3" /> Architecture Script</span>
           <button onClick={() => onCopy(content, `${type}-en`)} className={`p-2.5 rounded-2xl transition-all hover:scale-110 active:scale-90 ${targetModel === 'sora2' ? 'bg-white/5 text-white/40 hover:text-indigo-400' : 'bg-indigo-50 text-indigo-400 hover:bg-indigo-100'}`}>
             {copiedId === `${type}-en` ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
           </button>
        </div>
        <div className={`p-8 rounded-[2rem] text-xs font-mono leading-[1.8] break-words shadow-2xl border transition-all ${targetModel === 'sora2' ? 'bg-black text-indigo-300 border-white/5' : 'bg-slate-900 text-indigo-50 border-slate-800'}`}>
          {content}
        </div>
      </div>
      <div className={`pt-10 border-t ${targetModel === 'sora2' ? 'border-white/5' : 'border-slate-50'}`}>
        <div className="flex justify-between items-center mb-4">
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Eye className="w-3 h-3" /> Logic Analysis</span>
           <button onClick={() => onCopy(zh, `${type}-zh`)} className={`p-2.5 rounded-2xl transition-all hover:scale-110 active:scale-90 ${targetModel === 'sora2' ? 'bg-white/5 text-white/40 hover:text-indigo-400' : 'bg-indigo-50 text-indigo-400 hover:bg-indigo-100'}`}>
             {copiedId === `${type}-zh` ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
           </button>
        </div>
        <p className={`text-sm font-bold leading-relaxed pl-4 border-l-2 ${targetModel === 'sora2' ? 'text-slate-300 border-indigo-500' : 'text-slate-600 border-indigo-100'}`}>{zh}</p>
      </div>
    </div>
  </div>
);

export default App;
