
import React, { useState, useEffect } from 'react';
import { 
  ImageIcon, Copy, Check, RefreshCw, 
  AlertCircle, Wand2, History, 
  User as UserIcon, LogOut, Download, Trash2, X, Plus, Layers, MessageSquareText, Sparkles, Menu,
  Smartphone, Chrome, MessageCircle, ShieldCheck, Mail
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
    const savedUser = localStorage.getItem('pm_user_v2');
    return savedUser ? JSON.parse(savedUser) : { 
      id: '', name: '', loginType: null, isLoggedIn: false, registeredAt: 0 
    };
  });
  const [history, setHistory] = useState<PromptRecord[]>(() => {
    const savedHistory = localStorage.getItem('pm_history');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  const [showHistory, setShowHistory] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authStage, setAuthStage] = useState<'select' | 'input' | 'processing'>('select');
  const [selectedMethod, setSelectedMethod] = useState<'google' | 'wechat' | 'phone' | null>(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [codeInput, setCodeInput] = useState('');

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('pm_user_v2', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('pm_history', JSON.stringify(history));
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
        error: '分析失败，请检查网络或减少图片数量。', 
        result: status.result
      });
    }
  };

  const startLogin = (method: 'google' | 'wechat' | 'phone') => {
    setSelectedMethod(method);
    if (method === 'phone') {
      setAuthStage('input');
    } else {
      setAuthStage('processing');
      // 模拟第三方授权
      setTimeout(() => finalizeLogin(method), 1500);
    }
  };

  const finalizeLogin = (method: 'google' | 'wechat' | 'phone', data?: any) => {
    const newUser: User = {
      id: crypto.randomUUID(),
      name: method === 'google' ? 'Google 用户' : method === 'wechat' ? '微信用户' : `手机用户 ${phoneInput.slice(-4)}`,
      loginType: method,
      isLoggedIn: true,
      registeredAt: Date.now(),
      phone: method === 'phone' ? phoneInput : undefined,
    };
    setUser(newUser);
    setShowLoginModal(false);
    setAuthStage('select');
    setSelectedMethod(null);
  };

  const handleLogout = () => {
    setUser({ id: '', name: '', loginType: null, isLoggedIn: false, registeredAt: 0 });
    setHistory([]);
    localStorage.removeItem('pm_history');
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
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowLoginModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10">
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-100">
                  <ShieldCheck className="text-white w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">登录 / 注册</h3>
                <p className="text-slate-500 text-sm mt-2 font-medium">选择您的首选方式进入工坊</p>
              </div>

              {authStage === 'select' && (
                <div className="space-y-4">
                  <button onClick={() => startLogin('wechat')} className="w-full py-4 px-6 bg-[#07C160] hover:bg-[#06ae56] text-white rounded-2xl font-black flex items-center justify-between transition-all group active:scale-95">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-6 h-6" />
                      <span>微信快捷登录</span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] tracking-widest uppercase">Quick Login</div>
                  </button>
                  <button onClick={() => startLogin('google')} className="w-full py-4 px-6 bg-white border-2 border-slate-100 hover:border-slate-200 text-slate-700 rounded-2xl font-black flex items-center justify-between transition-all group active:scale-95">
                    <div className="flex items-center gap-3">
                      <Chrome className="w-6 h-6 text-blue-500" />
                      <span>Google 账号登录</span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] tracking-widest uppercase text-slate-300">Auth Service</div>
                  </button>
                  <button onClick={() => startLogin('phone')} className="w-full py-4 px-6 bg-slate-900 hover:bg-black text-white rounded-2xl font-black flex items-center justify-between transition-all group active:scale-95">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-6 h-6" />
                      <span>手机验证码登录</span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] tracking-widest uppercase text-slate-500">Secure OTP</div>
                  </button>
                </div>
              )}

              {authStage === 'input' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-4">
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="tel" placeholder="请输入手机号码"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                          type="text" placeholder="验证码"
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={codeInput} onChange={(e) => setCodeInput(e.target.value)}
                        />
                      </div>
                      <button className="px-6 bg-slate-100 text-slate-500 font-black rounded-2xl text-xs hover:bg-slate-200 transition-all">发送</button>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setAuthStage('processing'); setTimeout(() => finalizeLogin('phone'), 1500); }}
                    className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                  >
                    立即验证并进入
                  </button>
                  <button onClick={() => setAuthStage('select')} className="w-full text-slate-400 font-bold text-xs uppercase tracking-widest">返回其他方式</button>
                </div>
              )}

              {authStage === 'processing' && (
                <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-300">
                  <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin" />
                  <div>
                    <p className="font-black text-slate-900">正在安全连接...</p>
                    <p className="text-slate-400 text-xs mt-1">正在校验第三方授权信息</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Left Sidebar --- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 md:w-80 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out flex flex-col shadow-xl lg:shadow-none lg:relative lg:translate-x-0 ${showHistory ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><History className="w-5 h-5 text-indigo-500" />历史记录</h2>
          <button onClick={() => setShowHistory(false)} className="p-1.5 hover:bg-slate-100 rounded-lg lg:hidden"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-4 space-y-4 opacity-50">
              <History className="w-12 h-12" />
              <p className="text-sm font-medium">还没有生成的记录</p>
            </div>
          ) : (
            history.map(item => (
              <div key={item.id} onClick={() => setStatus({ ...status, result: item })} className={`group relative p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${status.result?.id === item.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-indigo-100'}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                    {item.mediaType === 'mixed/fusion' ? <Layers className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                  <button onClick={(e) => deleteHistoryItem(item.id, e)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                </div>
                <h4 className="font-bold text-slate-700 text-xs line-clamp-1 leading-tight">{item.descriptionZh}</h4>
                <p className="text-[10px] text-slate-400 mt-2 line-clamp-2 italic font-mono">{item.positivePrompt}</p>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* --- Main Area --- */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {showHistory && <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setShowHistory(false)} />}
        
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-4">
            {!showHistory && (
              <button onClick={() => setShowHistory(true)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 flex items-center gap-2">
                <Menu className="w-5 h-5" />
                <span className="hidden md:inline text-sm font-bold">查看记录</span>
              </button>
            )}
            <div>
              <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight leading-none">PromptMaster Nano</h1>
              <p className="text-[10px] text-slate-500 font-medium mt-1">AI 视觉融合专家系统</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user.isLoggedIn ? (
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-2xl border border-slate-200 group relative cursor-pointer">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg">
                  {user.loginType === 'wechat' ? <MessageCircle className="w-4 h-4" /> : user.loginType === 'google' ? <Chrome className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-700 font-black text-[10px] leading-none">{user.name}</span>
                  <span className="text-slate-400 font-bold text-[8px] uppercase tracking-widest mt-0.5">{user.loginType}</span>
                </div>
                <button onClick={handleLogout} className="p-1 text-slate-400 hover:text-red-500 transition-colors ml-2" title="注销"><LogOut className="w-4 h-4" /></button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="px-6 py-2.5 bg-slate-900 text-white font-black rounded-xl text-xs hover:bg-black transition-all shadow-xl shadow-slate-100 flex items-center gap-2"
              >
                <UserIcon className="w-4 h-4" />
                <span>立即登录 / 注册</span>
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
          {!user.isLoggedIn ? (
            <div className="max-w-2xl mx-auto bg-white rounded-[3rem] p-16 text-center shadow-sm border border-slate-200 mt-10">
              <div className="bg-indigo-50 p-8 rounded-full w-fit mx-auto mb-8"><Sparkles className="w-16 h-16 text-indigo-600" /></div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">创意无限，即刻开启</h2>
              <p className="text-slate-500 mb-10 font-medium max-w-sm mx-auto text-lg leading-relaxed">通过多种社交账号或手机号登录，永久保存您的每一份灵感创作。</p>
              <button onClick={() => setShowLoginModal(true)} className="px-12 py-5 bg-indigo-600 text-white font-black rounded-[2rem] hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 text-lg">开启大师之旅</button>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              <section className="space-y-6">
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-black flex items-center gap-2 text-slate-800"><ImageIcon className="w-6 h-6 text-indigo-500" />素材管理</h2>
                    {mediaList.length > 1 && <div className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full animate-pulse uppercase tracking-widest">Fusion Mode</div>}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-8">
                    {mediaList.map(item => (
                      <div key={item.id} className="relative aspect-square group">
                        <img src={item.url} className="w-full h-full object-cover rounded-2xl border border-slate-100 shadow-sm" />
                        <button onClick={() => removeMedia(item.id)} className="absolute -top-2 -right-2 bg-white text-red-500 p-1.5 rounded-full shadow-xl opacity-0 group-hover:opacity-100 border border-slate-100"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                    <label className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 text-slate-400 transition-all">
                      <Plus className="w-8 h-8 mb-1" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Add</span>
                      <input type="file" className="hidden" accept="image/*,video/*" multiple onChange={handleFileUpload} />
                    </label>
                  </div>
                  <div className="mb-8">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><MessageSquareText className="w-4 h-4 text-indigo-400" />融合要求</label>
                    <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-indigo-50 outline-none resize-none h-32 transition-all focus:bg-white" placeholder="例如：保留角色特征，风格转向超现实主义..." value={fusionInstructions} onChange={e => setFusionInstructions(e.target.value)} />
                  </div>
                  {mediaList.length > 0 && !status.loading && (
                    <button onClick={handleAnalyze} className={`w-full py-5 font-black rounded-[2rem] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 ${status.result ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                      {status.result ? <><RefreshCw className="w-5 h-5" />重新生成</> : <><Wand2 className="w-5 h-5" />开始解析</>}
                    </button>
                  )}
                  {status.loading && (
                    <div className="w-full py-5 bg-slate-100 text-indigo-600 font-black rounded-[2rem] flex items-center justify-center gap-3 animate-pulse">
                      <RefreshCw className="w-5 h-5 animate-spin" />特征提取中...
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-6 lg:sticky lg:top-10">
                {!status.result && !status.loading ? (
                  <div className="h-[500px] bg-white rounded-[2.5rem] border-2 border-slate-100 border-dashed p-10 flex flex-col items-center justify-center text-center">
                    <Layers className="w-16 h-16 text-slate-200 mb-6" />
                    <h3 className="text-xl font-black text-slate-800">准备绪就</h3>
                    <p className="text-slate-400 mt-3 text-sm font-medium">请上传素材并设置您的解析偏好。</p>
                  </div>
                ) : status.result ? (
                  <div className="space-y-6 animate-in slide-in-from-right-10 duration-500">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-4">Fusion Summary</h3>
                      <p className="text-slate-800 font-black text-lg mb-2">{status.result.descriptionZh}</p>
                      <p className="text-slate-500 text-xs italic">{status.result.description}</p>
                    </div>
                    <PromptCard title="Positive Prompt" english={status.result.positivePrompt} chinese={status.result.positivePromptZh} type="pos" copiedId={copiedId} onCopy={copyToClipboard} />
                    <PromptCard title="Negative Prompt" english={status.result.negativePrompt} chinese={status.result.negativePromptZh} type="neg" copiedId={copiedId} onCopy={copyToClipboard} accentColor="text-red-500" />
                    <button onClick={() => { setMediaList([]); setFusionInstructions(''); setStatus({ loading: false, error: null, result: null }); }} className="w-full py-4 bg-white border-2 border-slate-100 hover:border-slate-300 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-xs transition-all">Reset Workshop</button>
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
  <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden group hover:shadow-lg transition-all">
    <div className="px-8 py-4 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
      <h3 className={`text-[10px] font-black tracking-widest uppercase ${accentColor}`}>{title}</h3>
    </div>
    <div className="p-8 space-y-6">
      <div>
        <div className="flex justify-between items-start mb-2">
          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">English</span>
          <button onClick={() => onCopy(english, `${type}-en`)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
            {copiedId === `${type}-en` ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <div className="bg-slate-900 text-indigo-100 p-6 rounded-2xl text-xs font-mono break-words shadow-2xl">{english}</div>
      </div>
      <div className="pt-6 border-t border-slate-100">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Translation</span>
          <button onClick={() => onCopy(chinese, `${type}-zh`)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
            {copiedId === `${type}-zh` ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-slate-700 text-sm font-bold">{chinese}</p>
      </div>
    </div>
  </div>
);

export default App;
