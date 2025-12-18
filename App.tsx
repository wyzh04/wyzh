
import React, { useState, useEffect } from 'react';
import { 
  ImageIcon, Copy, Check, RefreshCw, 
  Wand2, History, 
  User as UserIcon, LogOut, Trash2, X, Plus, Layers, MessageSquareText, Menu,
  Smartphone, Chrome, MessageCircle, ShieldCheck, Cpu, Binary, Eye, Film, Zap,
  Sparkles, Camera, Clapperboard, ChevronRight, Share2, Globe, Github, Info
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
    const savedUser = localStorage.getItem('pm_pro_user');
    return savedUser ? JSON.parse(savedUser) : { 
      id: '', name: '', loginType: null, isLoggedIn: false, registeredAt: 0 
    };
  });
  const [history, setHistory] = useState<PromptRecord[]>(() => {
    const savedHistory = localStorage.getItem('pm_pro_history');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authStage, setAuthStage] = useState<'select' | 'input' | 'processing'>('select');
  const [phoneInput, setPhoneInput] = useState('');

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('pm_pro_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('pm_pro_history', JSON.stringify(history));
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
      setStatus({ loading: false, error: '语义架构解析失败，请检查资源文件大小或内容。', result: status.result });
    }
  };

  const finalizeLogin = (method: 'google' | 'wechat' | 'phone') => {
    const newUser: User = {
      id: crypto.randomUUID(),
      name: method === 'google' ? 'Alpha Architect' : method === 'wechat' ? '微信创意大师' : `创作者 ${phoneInput.slice(-4)}`,
      loginType: method,
      isLoggedIn: true,
      registeredAt: Date.now(),
    };
    setUser(newUser);
    setShowLoginModal(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogout = () => {
    setUser({ 
      id: '', name: '', loginType: null, isLoggedIn: false, registeredAt: 0 
    });
    setShowHistory(false);
    setMediaList([]);
    setStatus({ loading: false, error: null, result: null });
    setFusionInstructions('');
  };

  // --- Views ---
  const LandingView = () => (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
      </div>

      <div className="relative z-10 max-w-5xl w-full px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">The Future of Prompt Engineering</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tighter leading-none">
          PromptMaster <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">ULTRA</span>
        </h1>
        
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
          全球领先的 AI 视觉指令架构系统。专为 Nano 级渲染器与 Sora 2 电影级视频模型打造的像素级逻辑对齐工坊。
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <button 
            onClick={() => setShowLoginModal(true)}
            className="group px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-indigo-500/30 transition-all active:scale-95 flex items-center gap-3"
          >
            开启架构实验室 <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </button>
          <a 
            href="#features" 
            className="px-10 py-5 bg-white/5 hover:bg-white/10 text-white rounded-[2rem] font-black text-xl backdrop-blur-md border border-white/10 transition-all"
          >
            查看模型规范
          </a>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-md">
            <Cpu className="w-10 h-10 text-indigo-400 mb-6" />
            <h3 className="text-white font-bold text-xl mb-3">Nano 权重引擎</h3>
            <p className="text-slate-500 text-sm leading-relaxed">针对端侧轻量化模型，采用多层物理属性堆叠与权重增强语法，确保生成精度。</p>
          </div>
          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-md">
            <Clapperboard className="w-10 h-10 text-purple-400 mb-6" />
            <h3 className="text-white font-bold text-xl mb-3">Sora 2 叙事架构</h3>
            <p className="text-slate-500 text-sm leading-relaxed">注入电影级镜头调度、动态流体物理与时间轴连贯性逻辑，重塑视频生成的可能性。</p>
          </div>
          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-md">
            <Layers className="w-10 h-10 text-emerald-400 mb-6" />
            <h3 className="text-white font-bold text-xl mb-3">多模态特征融合</h3>
            <p className="text-slate-500 text-sm leading-relaxed">支持多张参考图的语义提取，解决视觉冲突，实现完美的风格迁移与内容重组。</p>
          </div>
        </div>
      </div>
      
      <footer className="absolute bottom-10 w-full text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">
        © 2025 PromptMaster Pro AI Lab. All Rights Reserved.
      </footer>
    </div>
  );

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-700 ${!user.isLoggedIn ? '' : (targetModel === 'sora2' ? 'bg-slate-900' : 'bg-slate-50')}`}>
      
      {!user.isLoggedIn ? (
        <LandingView />
      ) : (
        <>
          {/* --- History Sidebar --- */}
          {/* On desktop: static/flex child to avoid covering header. On mobile: fixed overlay. */}
          <aside className={`
            fixed lg:static inset-y-0 left-0 z-50 lg:z-10
            w-80 border-r flex flex-col shrink-0
            transition-all duration-500 
            ${showHistory ? 'translate-x-0' : '-translate-x-full lg:-ml-80'}
            ${targetModel === 'sora2' ? 'bg-slate-950 border-white/10' : 'bg-white border-slate-200'}
          `}>
            <div className={`p-8 border-b flex justify-between items-center sticky top-0 ${targetModel === 'sora2' ? 'border-white/10' : 'border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${targetModel === 'sora2' ? 'bg-indigo-500/20' : 'bg-indigo-50'}`}>
                   {targetModel === 'sora2' ? <Clapperboard className="w-5 h-5 text-indigo-400" /> : <Binary className="w-5 h-5 text-indigo-600" />}
                </div>
                <h2 className={`font-black text-sm tracking-tight ${targetModel === 'sora2' ? 'text-white' : 'text-slate-800'}`}>语义工坊历史</h2>
              </div>
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className={`flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar ${targetModel === 'sora2' ? 'dark-scrollbar' : ''}`}>
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 px-8 text-center">
                  <Eye className={`w-12 h-12 mb-4 ${targetModel === 'sora2' ? 'text-white' : 'text-slate-400'}`} />
                  <p className={`text-xs font-black uppercase tracking-widest ${targetModel === 'sora2' ? 'text-white' : 'text-slate-400'}`}>Empty Archive</p>
                </div>
              ) : (
                history.map(item => (
                  <div key={item.id} onClick={() => setStatus({ ...status, result: item })} className={`p-5 rounded-[1.5rem] border transition-all cursor-pointer group ${status.result?.id === item.id ? (targetModel === 'sora2' ? 'bg-indigo-900/40 border-indigo-500' : 'bg-indigo-50 border-indigo-200 shadow-lg') : (targetModel === 'sora2' ? 'bg-white/5 border-white/5 hover:border-white/20' : 'bg-white border-slate-100 hover:shadow-md')}`}>
                    <div className="flex justify-between items-center mb-2">
                       <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${targetModel === 'sora2' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>{item.targetModel} Engine</span>
                       <button onClick={(e) => { e.stopPropagation(); setHistory(h => h.filter(i => i.id !== item.id)); }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"><Trash2 className="w-3 h-3" /></button>
                    </div>
                    <h4 className={`font-bold text-xs line-clamp-2 leading-snug ${targetModel === 'sora2' ? 'text-slate-300' : 'text-slate-700'}`}>{item.descriptionZh}</h4>
                    <p className="text-[8px] mt-3 opacity-40 font-black tracking-widest uppercase">{new Date(item.timestamp).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
            <div className={`p-6 border-t ${targetModel === 'sora2' ? 'border-white/10 bg-slate-950' : 'border-slate-100 bg-slate-50'}`}>
               <button onClick={handleLogout} className="w-full py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                 <LogOut className="w-4 h-4" /> 退出系统
               </button>
            </div>
          </aside>

          {/* --- Main Content --- */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <header className={`px-8 py-6 flex items-center justify-between z-30 transition-all duration-500 border-b ${targetModel === 'sora2' ? 'bg-slate-950/90 border-white/10 backdrop-blur-xl' : 'bg-white/90 border-slate-200 backdrop-blur-xl shadow-sm'}`}>
              <div className="flex items-center gap-6">
                {!showHistory && (
                  <button onClick={() => setShowHistory(true)} className={`p-3 rounded-xl transition-all ${targetModel === 'sora2' ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <Menu className="w-5 h-5" />
                  </button>
                )}
                <div>
                  <h1 className={`text-2xl font-black leading-none tracking-tight ${targetModel === 'sora2' ? 'text-white' : 'text-slate-900'}`}>PromptMaster Ultra</h1>
                  <p className={`text-[10px] font-black mt-2 uppercase tracking-[0.4em] flex items-center gap-2 ${targetModel === 'sora2' ? 'text-indigo-400' : 'text-slate-400'}`}>
                    <Globe className="w-3 h-3" /> Visual Architecture Suite 2025
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className={`hidden md:flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all ${targetModel === 'sora2' ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-full flex items-center justify-center text-white shadow-lg"><UserIcon className="w-4 h-4" /></div>
                  <div className="flex flex-col">
                    <span className="font-black text-[10px] leading-none">{user.name}</span>
                    <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest mt-1">Verified Master</span>
                  </div>
                </div>
                <button className={`p-3 rounded-2xl transition-all ${targetModel === 'sora2' ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`} title="Share Result">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
              <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-16 items-start pb-20">
                
                {/* Workbench Section */}
                <div className={`rounded-[3.5rem] p-10 md:p-12 border transition-all duration-700 relative overflow-hidden ${targetModel === 'sora2' ? 'bg-slate-950 border-white/10 shadow-2xl shadow-indigo-500/10' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
                  {targetModel === 'sora2' && <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Film className="w-64 h-64 text-white" /></div>}
                  
                  <div className="space-y-12 relative z-10">
                    <div className="flex justify-between items-end">
                      <div>
                        <h2 className={`text-3xl font-black mb-2 ${targetModel === 'sora2' ? 'text-white' : 'text-slate-900'}`}>模型架构 Workbench</h2>
                        <p className={`text-sm font-medium ${targetModel === 'sora2' ? 'text-slate-500' : 'text-slate-400'}`}>上传素材并定义您的视觉导演意图</p>
                      </div>
                      <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl ${targetModel === 'sora2' ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 'bg-slate-900 text-white shadow-slate-200'}`}>
                        {targetModel} v3.5 Stable
                      </div>
                    </div>

                    {/* Model Toggle */}
                    <div className={`grid grid-cols-2 gap-4 p-2.5 rounded-[2rem] transition-all shadow-inner ${targetModel === 'sora2' ? 'bg-white/5' : 'bg-slate-100'}`}>
                      <button onClick={() => setTargetModel('nano')} className={`py-5 rounded-[1.5rem] font-black text-xs flex items-center justify-center gap-3 transition-all ${targetModel === 'nano' ? 'bg-white text-indigo-600 shadow-2xl scale-100' : (targetModel === 'sora2' ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700')}`}>
                        <Cpu className="w-5 h-5" /> NANO 图像架构
                      </button>
                      <button onClick={() => setTargetModel('sora2')} className={`py-5 rounded-[1.5rem] font-black text-xs flex items-center justify-center gap-3 transition-all ${targetModel === 'sora2' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40' : 'text-slate-400 hover:text-slate-800'}`}>
                        <Film className="w-5 h-5" /> SORA 2 视频叙事
                      </button>
                    </div>

                    {/* Assets Grid */}
                    <div className="space-y-4">
                      <label className={`text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 ${targetModel === 'sora2' ? 'text-indigo-400' : 'text-slate-400'}`}>
                        <ImageIcon className="w-4 h-4" /> 视觉参考库 / Reference Assets
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                        {mediaList.map(item => (
                          <div key={item.id} className="relative aspect-square group">
                            <img src={item.url} className={`w-full h-full object-cover rounded-[2rem] border-2 transition-all group-hover:scale-105 group-hover:shadow-2xl ${targetModel === 'sora2' ? 'border-white/10' : 'border-white shadow-lg'}`} />
                            <button onClick={() => removeMedia(item.id)} className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all active:scale-90 z-20"><X className="w-4 h-4" /></button>
                          </div>
                        ))}
                        <label className={`aspect-square border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all ${targetModel === 'sora2' ? 'border-white/10 hover:border-indigo-500 hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-400' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600'}`}>
                          <Plus className="w-12 h-12 mb-2" />
                          <span className="text-[10px] font-black uppercase tracking-widest">导入资源</span>
                          <input type="file" className="hidden" multiple onChange={handleFileUpload} />
                        </label>
                      </div>
                    </div>

                    {/* Instruction Box */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className={`text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 ${targetModel === 'sora2' ? 'text-indigo-400' : 'text-slate-400'}`}>
                          <MessageSquareText className="w-4 h-4" /> 架构蓝图 / Architecture Blueprint
                        </label>
                        <Info className="w-4 h-4 text-slate-600 cursor-help" />
                      </div>
                      <textarea 
                        className={`w-full p-10 rounded-[2.5rem] text-sm font-bold outline-none border-2 transition-all h-56 resize-none shadow-inner leading-relaxed ${targetModel === 'sora2' ? 'bg-white/5 border-white/5 text-white focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/10' : 'bg-slate-50 border-slate-100 text-slate-800 focus:border-indigo-200 focus:ring-8 focus:ring-indigo-100/50'}`} 
                        placeholder={targetModel === 'nano' ? "请定义画面的像素深度、光源路径以及具体的物理材质属性标签..." : "请编写导演脚本：描述镜头的起止状态、关键动作的物理反馈以及环境的时间性演变..."}
                        value={fusionInstructions} 
                        onChange={e => setFusionInstructions(e.target.value)} 
                      />
                    </div>

                    <button 
                      onClick={handleAnalyze} 
                      disabled={mediaList.length === 0 || status.loading}
                      className={`group w-full py-7 rounded-full font-black text-xl flex items-center justify-center gap-5 transition-all active:scale-95 shadow-2xl relative overflow-hidden ${status.loading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : (targetModel === 'sora2' ? 'bg-indigo-600 text-white shadow-indigo-500/40 hover:bg-indigo-700' : 'bg-slate-900 text-white hover:bg-black')}`}
                    >
                      {status.loading ? <><RefreshCw className="w-7 h-7 animate-spin" />正在同步语义架构...</> : <><Zap className="w-7 h-7" />生成专业提示词</>}
                    </button>
                  </div>
                </div>

                {/* Analysis & Output Section */}
                <div className="space-y-10">
                  {!status.result && !status.loading ? (
                    <div className={`h-full min-h-[600px] border-4 border-dashed rounded-[4rem] flex flex-col items-center justify-center p-16 text-center transition-all ${targetModel === 'sora2' ? 'border-white/5 text-white/20' : 'border-slate-100 text-slate-200'}`}>
                      <div className="bg-slate-100/5 p-12 rounded-full mb-8"><Clapperboard className="w-24 h-24 opacity-20" /></div>
                      <h3 className="text-2xl font-black tracking-tight mb-4">待机中: 等待语义架构同步</h3>
                      <p className="text-sm font-medium opacity-60 max-w-sm leading-relaxed tracking-wide">
                        请在左侧 Workbench 选择您的目标模型并上传视觉参考，AI 专家将执行全方位的像素与叙事级解构。
                      </p>
                    </div>
                  ) : status.result ? (
                    <div className="space-y-10 animate-in slide-in-from-bottom-12 duration-1000 ease-out">
                      {/* Analysis Report Card */}
                      <div className={`p-12 rounded-[3.5rem] relative overflow-hidden shadow-2xl transition-all duration-700 ${targetModel === 'sora2' ? 'bg-gradient-to-br from-indigo-700 to-indigo-950 text-white border border-white/10' : 'bg-slate-900 text-white shadow-indigo-900/10'}`}>
                        <div className="absolute -bottom-10 -right-10 opacity-10 pointer-events-none rotate-12"><Cpu className="w-64 h-64" /></div>
                        <div className="flex justify-between items-center mb-8">
                          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400">Architecture Report</h3>
                          <div className="flex gap-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
                          </div>
                        </div>
                        <p className="text-3xl font-bold leading-tight mb-6 border-l-4 border-indigo-500 pl-8">{status.result.descriptionZh}</p>
                        <p className="text-xs opacity-60 font-mono italic leading-relaxed pl-8">{status.result.description}</p>
                      </div>

                      {/* Prompts Cards */}
                      <OutputCard title="Positive Prompt / 架构正向指令" content={status.result.positivePrompt} zh={status.result.positivePromptZh} type="pos" onCopy={copyToClipboard} copiedId={copiedId} targetModel={targetModel} />
                      <OutputCard title="Negative Guard / 视觉负向拦截" content={status.result.negativePrompt} zh={status.result.negativePromptZh} type="neg" onCopy={copyToClipboard} copiedId={copiedId} accentColor="text-rose-500" targetModel={targetModel} />

                      {/* Footer Actions */}
                      <div className="flex gap-4">
                         <button onClick={() => { setMediaList([]); setStatus({ ...status, result: null }); setFusionInstructions(''); }} className={`flex-1 py-6 font-black rounded-[2rem] text-[10px] uppercase tracking-[0.4em] transition-all border-2 ${targetModel === 'sora2' ? 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:border-white/20' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}>
                           Reset Laboratory
                         </button>
                         <button className={`p-6 rounded-[2rem] border-2 transition-all ${targetModel === 'sora2' ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                           <Share2 className="w-5 h-5" />
                         </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </main>
          </div>
        </>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setShowLoginModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[3.5rem] shadow-[0_0_100px_rgba(79,70,229,0.3)] p-12 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <ShieldCheck className="text-indigo-400 w-10 h-10" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">架构师身份认证</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Master Credentials Required</p>
            </div>
            
            <div className="space-y-4">
              <button onClick={() => finalizeLogin('wechat')} className="w-full py-5 px-8 bg-[#07C160] hover:bg-[#06ae56] text-white rounded-2xl font-black flex items-center justify-between transition-all active:scale-95 shadow-lg shadow-emerald-500/10">
                <div className="flex items-center gap-4"><MessageCircle className="w-6 h-6" /><span>微信一键授权</span></div>
                <ChevronRight className="w-4 h-4 opacity-40" />
              </button>
              <button onClick={() => finalizeLogin('google')} className="w-full py-5 px-8 bg-white border-2 border-slate-100 hover:border-slate-200 text-slate-700 rounded-2xl font-black flex items-center justify-between transition-all active:scale-95 shadow-sm">
                <div className="flex items-center gap-4"><Chrome className="w-6 h-6 text-blue-500" /><span>Google 账号授权</span></div>
                <ChevronRight className="w-4 h-4 opacity-40" />
              </button>
              <button onClick={() => setAuthStage('input')} className="w-full py-5 px-8 bg-slate-900 hover:bg-black text-white rounded-2xl font-black flex items-center justify-between transition-all active:scale-95 shadow-2xl shadow-slate-900/20">
                <div className="flex items-center gap-4"><Smartphone className="w-6 h-6" /><span>手机安全验证</span></div>
                <ChevronRight className="w-4 h-4 opacity-40" />
              </button>
            </div>
            
            <p className="mt-12 text-center text-slate-400 text-[9px] font-bold uppercase tracking-widest leading-relaxed">
              By accessing the lab, you agree to our <br/> Professional Code of Ethics & Privacy Protocol.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const OutputCard: React.FC<{title: string, content: string, zh: string, type: string, onCopy: (c: string, id: string) => void, copiedId: string | null, accentColor?: string, targetModel: TargetModel}> = ({ title, content, zh, type, onCopy, copiedId, accentColor="text-indigo-500", targetModel }) => (
  <div className={`rounded-[3.5rem] border shadow-2xl overflow-hidden group hover:-translate-y-1 transition-all duration-500 ${targetModel === 'sora2' ? 'bg-slate-950 border-white/10' : 'bg-white border-slate-200'}`}>
    <div className={`px-12 py-6 flex justify-between items-center ${targetModel === 'sora2' ? 'bg-white/5 border-b border-white/5' : 'bg-slate-50/50 border-b border-slate-100'}`}>
      <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${accentColor}`}>{title}</span>
      <div className="flex gap-3">
        {targetModel === 'sora2' ? <Film className="w-4 h-4 text-white/10" /> : <Cpu className="w-4 h-4 text-slate-200" />}
        <Globe className="w-4 h-4 text-slate-200 opacity-20" />
      </div>
    </div>
    <div className="p-12 space-y-12">
      <div className="relative group/field">
        <div className="flex justify-between items-center mb-6">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Binary className="w-4 h-4" /> Professional Syntax</span>
           <button onClick={() => onCopy(content, `${type}-en`)} className={`p-3 rounded-2xl transition-all hover:scale-110 active:scale-90 ${targetModel === 'sora2' ? 'bg-white/5 text-white/40 hover:text-indigo-400' : 'bg-indigo-50 text-indigo-500 hover:bg-indigo-100'}`}>
             {copiedId === `${type}-en` ? <Check className="w-6 h-6 text-emerald-500" /> : <Copy className="w-6 h-6" />}
           </button>
        </div>
        <div className={`p-10 rounded-[2.5rem] text-[13px] font-mono leading-[2] break-words shadow-inner border transition-all ${targetModel === 'sora2' ? 'bg-black text-indigo-300 border-white/5' : 'bg-slate-900 text-indigo-50 border-slate-800'}`}>
          {content}
        </div>
      </div>
      <div className={`pt-12 border-t ${targetModel === 'sora2' ? 'border-white/5' : 'border-slate-50'}`}>
        <div className="flex justify-between items-center mb-6">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Eye className="w-4 h-4" /> Semantic Logic</span>
           <button onClick={() => onCopy(zh, `${type}-zh`)} className={`p-3 rounded-2xl transition-all hover:scale-110 active:scale-90 ${targetModel === 'sora2' ? 'bg-white/5 text-white/40 hover:text-indigo-400' : 'bg-indigo-50 text-indigo-500 hover:bg-indigo-100'}`}>
             {copiedId === `${type}-zh` ? <Check className="w-6 h-6 text-emerald-500" /> : <Copy className="w-6 h-6" />}
           </button>
        </div>
        <p className={`text-base font-bold leading-[1.8] pl-6 border-l-4 transition-colors duration-500 ${targetModel === 'sora2' ? 'text-slate-300 border-indigo-500' : 'text-slate-600 border-indigo-200 hover:border-indigo-400'}`}>{zh}</p>
      </div>
    </div>
  </div>
);

export default App;
