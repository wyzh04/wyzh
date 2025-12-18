
import React, { useState, useEffect } from 'react';
import { 
  ImageIcon, Copy, Check, RefreshCw, 
  AlertCircle, Wand2, History, 
  User as UserIcon, LogOut, Download, Trash2, X, Plus, Layers, MessageSquareText, Sparkles, Menu,
  Smartphone, Chrome, MessageCircle, ShieldCheck, Mail, Cpu, Binary, Eye
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
  const [codeInput, setCodeInput] = useState('');

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('pm_user_v3', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('pm_history_nano', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (window.innerWidth < 1024) setShowHistory(false);
  }, []);

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
      setStatus(prev => ({ ...prev, error: null }));
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
        error: '深度分析超时或语义解析失败，请尝试减少图片数量。', 
        result: status.result
      });
    }
  };

  const startLogin = (method: 'google' | 'wechat' | 'phone') => {
    if (method === 'phone') {
      setAuthStage('input');
    } else {
      setAuthStage('processing');
      setTimeout(() => finalizeLogin(method), 1000);
    }
  };

  const finalizeLogin = (method: 'google' | 'wechat' | 'phone') => {
    const newUser: User = {
      id: crypto.randomUUID(),
      name: method === 'google' ? 'Google User' : method === 'wechat' ? '微信用户' : `Phone User ${phoneInput.slice(-4)}`,
      loginType: method,
      isLoggedIn: true,
      registeredAt: Date.now(),
      phone: method === 'phone' ? phoneInput : undefined,
    };
    setUser(newUser);
    setShowLoginModal(false);
    setAuthStage('select');
  };

  const handleLogout = () => {
    setUser({ id: '', name: '', loginType: null, isLoggedIn: false, registeredAt: 0 });
    setHistory([]);
    localStorage.removeItem('pm_history_nano');
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans selection:bg-indigo-200">
      
      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowLoginModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
            <div className="p-10">
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-100">
                  <ShieldCheck className="text-white w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">大师身份认证</h3>
                <p className="text-slate-500 text-sm mt-2 font-medium">开启像素级提示词工程权限</p>
              </div>

              {authStage === 'select' && (
                <div className="space-y-4">
                  <button onClick={() => startLogin('wechat')} className="w-full py-4 px-6 bg-[#07C160] hover:bg-[#06ae56] text-white rounded-2xl font-black flex items-center justify-between transition-all active:scale-95">
                    <div className="flex items-center gap-3"><MessageCircle className="w-6 h-6" /><span>微信快捷登录</span></div>
                  </button>
                  <button onClick={() => startLogin('google')} className="w-full py-4 px-6 bg-white border-2 border-slate-100 hover:border-slate-200 text-slate-700 rounded-2xl font-black flex items-center justify-between transition-all active:scale-95">
                    <div className="flex items-center gap-3"><Chrome className="w-6 h-6 text-blue-500" /><span>Google 账号登录</span></div>
                  </button>
                  <button onClick={() => startLogin('phone')} className="w-full py-4 px-6 bg-slate-900 hover:bg-black text-white rounded-2xl font-black flex items-center justify-between transition-all active:scale-95">
                    <div className="flex items-center gap-3"><Smartphone className="w-6 h-6" /><span>手机验证登录</span></div>
                  </button>
                </div>
              )}

              {authStage === 'input' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-4">
                    <input type="tel" placeholder="手机号码" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} />
                    <div className="flex gap-2">
                      <input type="text" placeholder="验证码" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} />
                      <button className="px-6 bg-slate-100 text-slate-500 font-black rounded-2xl text-xs hover:bg-slate-200 transition-colors">发送</button>
                    </div>
                  </div>
                  <button onClick={() => { setAuthStage('processing'); setTimeout(() => finalizeLogin('phone'), 1200); }} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">进入工坊</button>
                  <button onClick={() => setAuthStage('select')} className="w-full text-slate-400 font-bold text-xs uppercase tracking-widest mt-4">返回</button>
                </div>
              )}

              {authStage === 'processing' && (
                <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-300">
                  <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin" />
                  <p className="font-black text-slate-900">正在链接创作云...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Left Sidebar --- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 md:w-80 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out flex flex-col shadow-xl lg:shadow-none lg:relative lg:translate-x-0 ${showHistory ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Binary className="w-5 h-5 text-indigo-600" />深度解析存档</h2>
          <button onClick={() => setShowHistory(false)} className="p-1.5 hover:bg-slate-100 rounded-lg lg:hidden"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center px-4 space-y-4 opacity-60">
              <Eye className="w-12 h-12" />
              <p className="text-sm font-medium">尚无深度重构记录</p>
            </div>
          ) : (
            history.map(item => (
              <div key={item.id} onClick={() => setStatus({ ...status, result: item })} className={`group relative p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${status.result?.id === item.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-indigo-100'}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                    {item.mediaType === 'mixed/fusion' ? <Layers className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                  <button onClick={(e) => deleteHistoryItem(item.id, e)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
                </div>
                <h4 className="font-bold text-slate-700 text-xs line-clamp-1 leading-tight">{item.descriptionZh}</h4>
                <p className="text-[10px] text-slate-400 mt-2 line-clamp-1 italic font-mono opacity-60">Accuracy Boosted</p>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* --- Main Area --- */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {showHistory && <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setShowHistory(false)} />}
        
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between z-30 shadow-sm">
          <div className="flex items-center gap-4">
            {!showHistory && (
              <button onClick={() => setShowHistory(true)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 flex items-center gap-2 transition-colors">
                <Menu className="w-5 h-5" />
                <span className="hidden md:inline text-sm font-bold">展开存档</span>
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight leading-none">PromptMaster Nano</h1>
                <span className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black rounded uppercase tracking-tighter">Ultra v2.1</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Pixel-Level Prompt Architect</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user.isLoggedIn ? (
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-2xl border border-slate-200 group relative shadow-sm">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md">
                  {user.loginType === 'wechat' ? <MessageCircle className="w-4 h-4" /> : user.loginType === 'google' ? <Chrome className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                </div>
                <div className="flex flex-col pr-2">
                  <span className="text-slate-700 font-black text-[10px] leading-none">{user.name}</span>
                  <span className="text-indigo-500 font-black text-[8px] uppercase tracking-widest mt-0.5">Master Architect</span>
                </div>
                <button onClick={handleLogout} className="p-1 text-slate-400 hover:text-red-500 transition-colors border-l border-slate-200 pl-2 ml-2"><LogOut className="w-4 h-4" /></button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="px-6 py-2.5 bg-slate-900 text-white font-black rounded-xl text-xs hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center gap-2"
              >
                <UserIcon className="w-4 h-4" />
                <span>立即认证身份</span>
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
          {!user.isLoggedIn ? (
            <div className="max-w-3xl mx-auto bg-white rounded-[3.5rem] p-16 text-center shadow-sm border border-slate-200 mt-10">
              <div className="bg-indigo-50 p-8 rounded-full w-fit mx-auto mb-8"><Binary className="w-16 h-16 text-indigo-600 animate-pulse" /></div>
              <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">像素级 提示词架构系统</h2>
              <p className="text-slate-500 mb-10 font-medium max-w-lg mx-auto text-lg leading-relaxed">通过多层级视觉属性堆叠与权重增强算法，为 Nano 模型提供极度精准的画面引导指令。</p>
              <button onClick={() => setShowLoginModal(true)} className="px-14 py-5 bg-indigo-600 text-white font-black rounded-[2rem] hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 text-xl active:scale-95">开始重构</button>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-start pb-20">
              <section className="space-y-8">
                <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 p-8 md:p-10">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black flex items-center gap-3 text-slate-800"><ImageIcon className="w-7 h-7 text-indigo-500" />语义特征库</h2>
                    <div className="flex gap-2">
                       {mediaList.length > 1 && <div className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-indigo-100">Hyper-Fusion</div>}
                       {fusionInstructions && <div className="px-3 py-1 bg-amber-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest">Direct Align</div>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-5 mb-10">
                    {mediaList.map(item => (
                      <div key={item.id} className="relative aspect-square group overflow-visible">
                        <img src={item.url} className="w-full h-full object-cover rounded-[1.5rem] border-2 border-slate-100 shadow-sm transition-all group-hover:scale-110 group-hover:shadow-xl group-hover:z-10" />
                        <button onClick={() => removeMedia(item.id)} className="absolute -top-2 -right-2 bg-white text-red-500 p-2 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 border border-slate-100 hover:scale-125 transition-all z-20"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                    <label className="aspect-square border-2 border-dashed border-slate-200 rounded-[1.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 text-slate-400 transition-all group">
                      <Plus className="w-10 h-10 mb-1 group-hover:rotate-90 transition-transform duration-300" />
                      <span className="text-[10px] font-black uppercase tracking-widest">导入参考</span>
                      <input type="file" className="hidden" accept="image/*,video/*" multiple onChange={handleFileUpload} />
                    </label>
                  </div>

                  <div className="mb-10">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><MessageSquareText className="w-5 h-5 text-indigo-400" />精准导演指令 / Architecture Blueprint</label>
                      <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">Accuracy Mode: Ultra</span>
                    </div>
                    <textarea 
                      className="w-full p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] text-sm font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 outline-none resize-none h-48 transition-all focus:bg-white shadow-inner leading-relaxed placeholder:opacity-50" 
                      placeholder="请尽可能详细地描述。例如：'保留图1的人脸比例，应用图2的湿润油画笔触，将背景中的光源改为来自下方的深蓝色地底发光物质...'" 
                      value={fusionInstructions} 
                      onChange={e => setFusionInstructions(e.target.value)} 
                    />
                  </div>

                  {mediaList.length > 0 && !status.loading && (
                    <button onClick={handleAnalyze} className={`group w-full py-6 font-black rounded-[2.5rem] shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95 overflow-hidden relative ${status.result ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-100' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'}`}>
                      <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      {status.result ? <><RefreshCw className="w-6 h-6 z-10" /><span className="z-10 text-lg">全方位像素重构</span></> : <><Wand2 className="w-6 h-6 z-10" /><span className="z-10 text-lg">开始深度架构生成</span></>}
                    </button>
                  )}
                  {status.loading && (
                    <div className="w-full py-6 bg-slate-100 text-indigo-600 font-black rounded-[2.5rem] flex flex-col items-center justify-center gap-3 animate-pulse border-2 border-indigo-50">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="w-6 h-6 animate-spin" />
                        <span className="text-lg">正在执行层级属性堆叠...</span>
                      </div>
                      <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] opacity-80">Injecting Multi-Layer Physics & Weights</span>
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-8 lg:sticky lg:top-10">
                {!status.result && !status.loading ? (
                  <div className="h-[600px] bg-white rounded-[3rem] border-2 border-slate-100 border-dashed p-10 flex flex-col items-center justify-center text-center opacity-40">
                    <div className="relative mb-8">
                      <Cpu className="w-20 h-20 text-slate-200" />
                      <Eye className="absolute -bottom-2 -right-2 w-10 h-10 text-slate-100 bg-white rounded-full p-2" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">实验室待机中</h3>
                    <p className="text-slate-400 mt-4 text-sm font-medium leading-relaxed max-w-xs">上传素材以开启像素级解构，我们将为您生成支持权重语法的高精度提示词。</p>
                  </div>
                ) : status.result ? (
                  <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-700 ease-out">
                    <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden text-white border border-indigo-400/20">
                      <div className="absolute -bottom-10 -right-10 opacity-20 rotate-12"><Cpu className="w-56 h-56" /></div>
                      <div className="absolute top-6 right-8 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Architect v2.1 Verified</span>
                      </div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-6">Visual Reconstruction Report / 重构逻辑</h3>
                      <p className="font-bold text-xl mb-4 leading-tight border-l-4 border-indigo-400 pl-4">{status.result.descriptionZh}</p>
                      <p className="text-indigo-100 text-xs italic opacity-70 leading-relaxed font-mono">{status.result.description}</p>
                    </div>

                    <PromptCard 
                      title="Positive Stack (Weight-Enhanced)" 
                      english={status.result.positivePrompt} 
                      chinese={status.result.positivePromptZh} 
                      type="pos" 
                      copiedId={copiedId} 
                      onCopy={copyToClipboard} 
                    />
                    
                    <PromptCard 
                      title="Negative Isolation (Hyper-Denoise)" 
                      english={status.result.negativePrompt} 
                      chinese={status.result.negativePromptZh} 
                      type="neg" 
                      copiedId={copiedId} 
                      onCopy={copyToClipboard} 
                      accentColor="text-red-500" 
                    />
                    
                    <button 
                      onClick={() => { setMediaList([]); setFusionInstructions(''); setStatus({ loading: false, error: null, result: null }); }} 
                      className="w-full py-5 bg-white border-2 border-slate-100 hover:border-red-100 hover:text-red-500 text-slate-400 font-black rounded-3xl uppercase tracking-widest text-xs transition-all shadow-sm"
                    >
                      Clear Workshop & Restart
                    </button>
                  </div>
                ) : null}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PromptCard: React.FC<{title: string, english: string, chinese: string, type: string, copiedId: string | null, onCopy: (t: string, i: string) => void, accentColor?: string}> = ({ title, english, chinese, type, copiedId, onCopy, accentColor = "text-emerald-600" }) => (
  <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden group hover:shadow-2xl transition-all duration-500">
    <div className="px-10 py-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
      <h3 className={`text-[10px] font-black tracking-[0.2em] uppercase ${accentColor}`}>{title}</h3>
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
        <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-indigo-400 transition-colors" />
      </div>
    </div>
    <div className="p-10 space-y-8">
      <div>
        <div className="flex justify-between items-start mb-4">
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
            <Cpu className="w-3 h-3" /> Architecture Syntax
          </span>
          <button onClick={() => onCopy(english, `${type}-en`)} className="p-2.5 hover:bg-indigo-50 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all hover:scale-110 active:scale-90 border border-transparent hover:border-indigo-100">
            {copiedId === `${type}-en` ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
        <div className="bg-slate-900 text-indigo-100 p-8 rounded-[2rem] text-xs font-mono break-words shadow-2xl border border-slate-800 leading-[1.8] tracking-wider relative group/code overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-10 -mt-10 group-hover/code:scale-150 transition-transform duration-700" />
          {english}
        </div>
      </div>
      <div className="pt-8 border-t border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-3 h-3" /> Semantic Analysis
          </span>
          <button onClick={() => onCopy(chinese, `${type}-zh`)} className="p-2.5 hover:bg-indigo-50 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all hover:scale-110 active:scale-90 border border-transparent hover:border-indigo-100">
            {copiedId === `${type}-zh` ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-slate-700 text-sm font-bold leading-[1.8] pl-2 border-l-2 border-indigo-100">{chinese}</p>
      </div>
    </div>
  </div>
);

export default App;
