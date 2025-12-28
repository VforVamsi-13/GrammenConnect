
import React, { useState, useContext, createContext, useEffect, useRef } from 'react';
import { User as UserIcon, LogOut, Eye, Globe, BookOpen, Wifi, WifiOff, BarChart3, Cloud, Briefcase, Landmark, Navigation, ShoppingCart, Heart, Shield, GraduationCap, X, Mic, MessageCircle, ChevronDown, Download, ArrowRight, Sparkles, HandHelping, Check, AlertCircle, Scan, Camera, Loader2, Languages, Activity, HelpingHand, Volume2, Sprout, UserPlus, Key } from 'lucide-react';
import { User, AppView, ModalType, LearningModule, Language, MarketItem } from './types';
import { Button, Card, Input, Modal } from './components/Shared';
import { ResumeModal, SchemeModal, MobilityModal } from './components/ToolModals';
import { GovernanceModal, ChatModal, VisionModal, KisanModal, GlobalChatModal, OfflineResourcesModal } from './components/ServiceModals';
import { LearningViewer } from './components/LearningModule';
import { useLanguage, LANGUAGES } from './contexts/LanguageContext';
import { generateVisionContent } from './services/geminiService';
import { speak } from './services/speechService';

// --- Context ---
interface AppContextType {
  elderMode: boolean;
  toggleElderMode: () => void;
  isOffline: boolean;
  toggleOffline: () => void;
}

const AppContext = createContext<AppContextType>({ 
  elderMode: false, 
  toggleElderMode: () => {}, 
  isOffline: false,
  toggleOffline: () => {},
});

const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all duration-300 group shadow-sm ${isOpen ? 'bg-green-50 border-green-200 ring-2 ring-green-100' : 'bg-white border-gray-100 hover:border-green-200'}`}
      >
        <div className="flex items-center gap-2">
           <span className="text-xl leading-none">{currentLang.flag}</span>
           <span className="text-sm font-black text-gray-800 tracking-tight">{currentLang.localName}</span>
        </div>
        <ChevronDown size={16} className={`text-gray-400 group-hover:text-green-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-300 py-3">
          <div className="px-6 py-3 border-b border-gray-50 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("Select Language")}</span>
            <Languages size={14} className="text-gray-300" />
          </div>
          <div className="max-h-[380px] overflow-y-auto custom-scrollbar px-2 space-y-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { 
                  setLanguage(lang.code); 
                  setIsOpen(false);
                  speak(lang.localName, lang.code);
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group ${language === lang.code ? 'bg-green-600 text-white shadow-xl shadow-green-100' : 'text-gray-700 hover:bg-green-50 hover:text-green-700'}`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl group-hover:scale-110 transition-transform">{lang.flag}</span>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-sm font-black uppercase tracking-tight">{lang.localName}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${language === lang.code ? 'text-green-100' : 'text-gray-400 group-hover:text-green-500'}`}>{lang.name}</span>
                  </div>
                </div>
                {language === lang.code && <Check size={18} className="text-white" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Face Authentication Component ---
const FaceAuth: React.FC<{ onSuccess: (name: string) => void; language: Language }> = ({ onSuccess, language }) => {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setActive(true);
    setError(null);
    setStatusText('');
    setIsSuccess(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setError("Camera Access Denied.");
      setActive(false);
    }
  };

  const captureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setLoading(true);
    setError(null);
    setStatusText(t('Loading'));
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) throw new Error("Canvas context failed");
      
      canvas.width = 480;
      canvas.height = 360;
      
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.6);
      const base64 = imageData.split(',')[1];

      const prompt = `
        Focus ONLY on the person in the foreground center. 
        IGNORE background shadows or objects.
        Is there one clear human face visible?
        Reply "YES" or "NO: [reason]".
      `;

      const result = await generateVisionContent(prompt, base64, "image/jpeg", language, true);
      const normalizedResult = result.toUpperCase();
      
      if (normalizedResult.includes("YES")) {
        setIsSuccess(true);
        setStatusText('Verified!');
        onSuccess("Verified Citizen");
      } else {
        const reason = result.includes("NO:") ? result.split("NO:")[1].trim() : "Ensure face is clear";
        setError(`Retry: ${reason.split('.')[0]}`);
        setStatusText('');
      }
    } catch (err) {
      setError("Connection error.");
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setActive(false);
    setStatusText('');
    setIsSuccess(false);
  };

  if (!active) {
    return (
      <button 
        onClick={startCamera}
        className="w-full flex items-center justify-center gap-3 bg-indigo-50 text-indigo-700 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all active:scale-95 shadow-sm"
      >
        <Scan size={18} /> Face Sign In
      </button>
    );
  }

  return (
    <div className="space-y-6 flex flex-col items-center animate-in zoom-in duration-300">
      <div className={`relative w-64 h-64 rounded-full overflow-hidden border-4 transition-all duration-300 shadow-2xl bg-black ${isSuccess ? 'border-green-500' : error ? 'border-red-500' : loading ? 'border-indigo-400' : 'border-gray-200'}`}>
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
        {!loading && !error && !isSuccess && <div className="animate-scan" />}
        {(loading || isSuccess) && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center z-20 ${isSuccess ? 'bg-green-500/20' : 'bg-black/40'}`}>
            {isSuccess ? <Check size={48} className="text-white animate-bounce" /> : <Loader2 size={40} className="text-white animate-spin" />}
          </div>
        )}
      </div>
      
      <div className="text-center min-h-[30px] px-4">
        {statusText && <p className="text-green-600 text-[10px] font-black uppercase tracking-widest">{statusText}</p>}
        {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest leading-tight">{error}</p>}
      </div>

      {!isSuccess && (
        <div className="flex gap-3 w-full">
           <Button onClick={captureAndVerify} isLoading={loading} disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 py-4 font-black text-[10px] uppercase tracking-widest shadow-xl">Scan</Button>
           <Button variant="outline" onClick={stopCamera} className="flex-1 py-4 font-black text-[10px] uppercase tracking-widest border-gray-200">Cancel</Button>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

const Header: React.FC<{ 
  user: User | null, 
  onViewChange: (v: AppView) => void, 
  onLogin: () => void, 
  onLogout: () => void,
  onVision: () => void 
}> = ({ user, onViewChange, onLogin, onLogout, onVision }) => {
  const { elderMode, toggleElderMode, isOffline, toggleOffline } = useContext(AppContext);
  const { t } = useLanguage();

  return (
    <header className={`bg-white/80 backdrop-blur-md border-b sticky top-0 z-40 shadow-sm transition-colors duration-500 ${isOffline ? 'border-amber-100' : 'border-green-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-all active:scale-95" onClick={() => onViewChange(AppView.LANDING)}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg transition-all duration-500 ${isOffline ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-200' : 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-200'}`}>G</div>
          <span className={`font-black text-gray-900 tracking-tighter transition-all ${elderMode ? 'text-3xl' : 'text-2xl'}`}>{t("GrameenConnect")}</span>
        </div>
        
        <div className="hidden lg:flex items-center gap-6">
          <nav className="flex items-center gap-5">
            <button onClick={() => onViewChange(AppView.LANDING)} className="text-gray-500 hover:text-green-600 font-black transition-colors text-[10px] uppercase tracking-widest">{t("Home")}</button>
            <button onClick={() => user ? onViewChange(AppView.PORTAL) : onLogin()} className="text-gray-500 hover:text-green-600 font-black transition-colors text-[10px] uppercase tracking-widest">{t("Portal")}</button>
          </nav>
          
          <div className="h-6 w-px bg-gray-200"></div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-2xl border border-green-100 text-green-700">
                <UserIcon size={16} />
                <span className="font-black text-[10px] uppercase tracking-widest">{user.name}</span>
              </div>
            )}

            <button 
              onClick={toggleOffline} 
              className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border flex items-center gap-2 ${isOffline ? 'bg-amber-600 text-white border-amber-700 shadow-xl shadow-amber-100' : 'bg-white text-gray-500 hover:text-green-600 border-gray-100 shadow-sm'}`}
            >
              {isOffline ? <WifiOff size={14} /> : <Wifi size={14} />}
              {isOffline ? t("Offline") : t("Online")}
            </button>

            {user && (
              <>
                <button 
                  onClick={onVision} 
                  disabled={isOffline}
                  className={`px-5 py-2.5 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border shadow-sm ${isOffline ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed opacity-50' : 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100'}`}
                >
                  <Eye size={14} /> {t("Vision")}
                </button>
                <button 
                  onClick={onLogout}
                  className="px-5 py-2.5 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-sm"
                >
                  <LogOut size={14} /> {t("Sign Out")}
                </button>
              </>
            )}
            
            <button onClick={toggleElderMode} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border ${elderMode ? 'bg-green-600 text-white border-green-700 shadow-xl shadow-green-100' : 'bg-white text-gray-500 hover:text-green-600 border-gray-100 shadow-sm'}`}>
              <UserIcon size={14} className="inline" /> {t("Elder Mode")}
            </button>
            <LanguageSelector />
          </div>
        </div>

        <div className="lg:hidden flex items-center gap-2">
          {user && (
             <button onClick={onLogout} className="p-3 rounded-2xl border border-red-100 bg-red-50 text-red-500 shadow-sm active:scale-95">
               <LogOut size={16} />
             </button>
          )}
          <LanguageSelector />
        </div>
      </div>
    </header>
  );
};

const LandingPage: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  const { elderMode, isOffline } = useContext(AppContext);
  const { t, language } = useLanguage();
  
  return (
    <div className="flex flex-col items-center w-full min-h-screen">
      <div className="w-full bg-gradient-to-b from-green-100/30 via-white to-white py-32 px-4 text-center flex flex-col items-center justify-center min-h-[80vh] pb-56">
        <div className={`inline-flex items-center gap-3 bg-white border px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-14 shadow-sm animate-in fade-in slide-in-from-top-6 duration-1000 ${isOffline ? 'text-amber-700 border-amber-100' : 'text-green-700 border-green-100'}`}>
          <Shield size={16} /> {t("Trusted by Thousands")}
        </div>
        
        <h1 className={`font-black text-gray-900 mb-10 leading-[1.05] tracking-tighter max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200 ${elderMode ? 'text-7xl md:text-[10rem]' : 'text-6xl md:text-9xl'}`}>
           {t("GrameenConnect")}
        </h1>
        
        <p className={`text-gray-500 max-w-3xl mx-auto mb-20 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-400 ${elderMode ? 'text-3xl' : 'text-2xl'}`}>
          {t("Empowering rural communities through digital access, education, and services.")}
        </p>
        
        <div className="animate-in fade-in zoom-in duration-1000 delay-600">
          <Button 
            onClick={onGetStarted} 
            className={`relative overflow-hidden group shadow-[0_20px_60px_-15px_rgba(16,185,129,0.3)] hover:scale-110 active:scale-95 transform transition-all duration-500 rounded-full flex items-center gap-5 text-white border-4 border-white ${isOffline ? 'from-amber-600 to-orange-600 shadow-amber-200 bg-gradient-to-r' : 'from-green-600 to-emerald-600 shadow-green-200 bg-gradient-to-r'} ${elderMode ? 'px-20 py-10 text-4xl' : 'px-16 py-8 text-2xl font-black uppercase tracking-[0.2em]'}`}
          >
            <span className="relative z-10 flex items-center gap-4">
               {t("Get Started")} <ArrowRight size={elderMode ? 40 : 32} className="group-hover:translate-x-3 transition-transform duration-500"/>
            </span>
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-32 grid grid-cols-1 md:grid-cols-3 gap-12 -mt-40 relative z-10">
        <Card className="border-t-4 border-t-green-500 shadow-3xl bg-white p-12 flex flex-col items-center md:items-start text-center md:text-left group hover:-translate-y-6 transition-all duration-700">
          <div className="bg-green-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-green-600 mb-10 group-hover:rotate-12 transition-transform duration-500"><BookOpen size={44} /></div>
          <h3 className="text-3xl font-black mb-6 text-gray-900 uppercase tracking-tight leading-none">{t("Citizen Portal")}</h3>
          <p className="text-gray-400 font-medium text-lg leading-relaxed">{t("Access all services from one high-contrast, easy portal.")}</p>
        </Card>
        <Card className={`border-t-4 shadow-3xl bg-white p-12 flex flex-col items-center md:items-start text-center md:text-left group hover:-translate-y-6 transition-all duration-700 ${isOffline ? 'border-t-amber-500' : 'border-t-blue-500'}`}>
          <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-10 group-hover:rotate-12 transition-transform duration-500 ${isOffline ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>{isOffline ? <WifiOff size={44} /> : <Wifi size={44} />}</div>
          <h3 className="text-3xl font-black mb-6 text-gray-900 uppercase tracking-tight leading-none">{t("Offline Ready")}</h3>
          <p className="text-gray-400 font-medium text-lg leading-relaxed">{t("No internet? No problem. Use our specialized offline tools.")}</p>
        </Card>
        <Card className="border-t-4 border-t-orange-500 shadow-3xl bg-white p-12 flex flex-col items-center md:items-start text-center md:text-left group hover:-translate-y-6 transition-all duration-700">
          <div className="bg-orange-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-orange-600 mb-10 group-hover:rotate-12 transition-transform duration-500"><BarChart3 size={44} /></div>
          <h3 className="text-3xl font-black mb-6 text-gray-900 uppercase tracking-tight leading-none">{t("Admin Help")}</h3>
          <p className="text-gray-400 font-medium text-lg leading-relaxed">{t("Assisting panchayats with data-driven governance tools.")}</p>
        </Card>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ 
  user: User, 
  onOpenTool: (t: ModalType) => void, 
  onOpenLearning: (m: LearningModule) => void
}> = ({ user, onOpenTool, onOpenLearning }) => {
  const { elderMode, isOffline } = useContext(AppContext);
  const { t, language } = useLanguage();
  
  const learningModules: LearningModule[] = [
    { id: '1', title: t('UPI Payments Basics'), category: t('Finance'), description: t('Learn how to use BHIM and PhonePe safely.'), icon: '💸' },
    { id: '2', title: t('Telehealth Consultation'), category: t('Health'), description: t('How to book and attend a doctor appointment online.'), icon: '🩺' },
    { id: '3', title: t('Government Crop Insurance'), category: t('Agriculture'), description: t('Step-by-step guide to apply for PMFBY.'), icon: '🌾' },
    { id: '4', title: t('Digital Literacy for Elders'), category: t('Education'), description: t('Simple guide to using smartphones and the internet.'), icon: '👵' },
    { id: '5', title: t('Modern Farming Techniques'), category: t('Agriculture'), description: t('Increase yield with smart soil and water management.'), icon: '🚜' },
    { id: '6', title: t('Basic First Aid & Emergency'), category: t('Health'), description: t('Essential medical steps for local emergencies.'), icon: '🩹' },
    { id: '7', title: t('Women Entrepreneurship'), category: t('Business'), description: t('Small business ideas and funding for rural women.'), icon: '👩‍💼' },
    { id: '8', title: t('Sustainable Living'), category: t('Environment'), description: t('Solar energy and water conservation at home.'), icon: '🌱' },
  ];

  const handleSpeak = (titleKey: string, descKey: string) => {
    const text = `${t(titleKey)}. ${t(descKey)}`;
    speak(text, language);
  };

  const handleOpenPlantAI = () => {
    window.open("https://plant-disease-prediction-using-cnn-q3ct.onrender.com/", "_blank");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 space-y-20 animate-in slide-in-from-bottom-12 duration-700">
      {/* Hero Banner */}
      <div className={`rounded-[3.5rem] p-12 md:p-20 text-white shadow-3xl relative overflow-hidden group transition-all duration-700 ${isOffline ? 'bg-gradient-to-br from-amber-600 via-orange-700 to-amber-900 shadow-amber-200' : 'bg-gradient-to-br from-green-600 via-emerald-700 to-green-900 shadow-green-200'}`}>
        <div className="relative z-10 max-w-4xl">
          <div className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 inline-block border border-white/20">
            {isOffline ? t("Working Offline") : t("Portal Access Granted")}
          </div>
          <div className="flex items-center gap-4 mb-6">
             <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md border border-white/30">
               <UserIcon size={40} className="text-white" />
             </div>
             <div className="flex flex-col">
               <span className="text-xs font-black uppercase tracking-[0.2em] text-white/70">{t("Welcome Back")}</span>
               <h2 className={`font-black tracking-tighter leading-none ${elderMode ? 'text-6xl md:text-8xl' : 'text-4xl md:text-6xl'}`}>{user.name}</h2>
             </div>
          </div>
          <p className="text-white text-xl md:text-2xl opacity-80 leading-relaxed font-medium max-w-xl">{t("Explore government schemes, health aids, and local marketplaces.")}</p>
        </div>
        <div className="absolute right-[-5%] bottom-[-5%] opacity-10 group-hover:scale-110 transition-transform duration-1000">
           <Landmark size={320} />
        </div>
      </div>

      {/* Essential Services Section - 4 Columns Layout */}
      <section>
        <div className="flex items-center gap-5 mb-12">
          <div className={`w-3 h-10 rounded-full transition-colors ${isOffline ? 'bg-amber-500 shadow-lg shadow-amber-100' : 'bg-green-500 shadow-lg shadow-green-100'}`}></div>
          <h3 className={`font-black text-gray-900 uppercase tracking-tighter ${elderMode ? 'text-5xl' : 'text-3xl'}`}>{t("Essential Services")}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card onClick={() => onOpenTool(ModalType.MARKET)} className="group bg-white border-2 border-gray-50 rounded-[2.5rem] p-8 hover:border-green-300 transition-all relative">
             <button onClick={(e) => { e.stopPropagation(); handleSpeak("Kisan Mandi", "Market Description"); }} className="absolute top-6 right-6 p-2 rounded-full bg-gray-50 text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all"><Volume2 size={20}/></button>
             <div className="bg-green-50 w-16 h-16 rounded-2xl flex items-center justify-center text-green-600 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-inner"><ShoppingCart size={28}/></div>
             <h4 className="font-black text-gray-900 text-lg uppercase tracking-tight mb-3">{t("Kisan Mandi")}</h4>
             <p className="text-sm text-gray-400 font-medium leading-relaxed">{t("Market Description")}</p>
          </Card>
          <Card onClick={handleOpenPlantAI} className="group bg-white border-2 border-gray-50 rounded-[2.5rem] p-8 hover:border-emerald-400 transition-all relative">
             <button onClick={(e) => { e.stopPropagation(); handleSpeak("Plant Health AI", "Scan crops for diseases."); }} className="absolute top-6 right-6 p-2 rounded-full bg-gray-50 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"><Volume2 size={20}/></button>
             <div className="bg-emerald-50 w-16 h-16 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-inner"><Sprout size={28}/></div>
             <h4 className="font-black text-gray-900 text-lg uppercase tracking-tight mb-3">{t("Plant Health AI")}</h4>
             <p className="text-sm text-gray-400 font-medium leading-relaxed">{t("Scan crops for diseases.")}</p>
          </Card>
          <Card onClick={() => onOpenTool(ModalType.HEALTH_CHAT)} className="group bg-white border-2 border-gray-50 rounded-[2.5rem] p-8 hover:border-pink-300 transition-all relative">
             <button onClick={(e) => { e.stopPropagation(); handleSpeak("Swasthya Saathi", "Health Description"); }} className="absolute top-6 right-6 p-2 rounded-full bg-gray-50 text-gray-400 hover:text-pink-600 hover:bg-pink-50 transition-all"><Volume2 size={20}/></button>
             <div className="bg-pink-50 w-16 h-16 rounded-2xl flex items-center justify-center text-pink-600 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-inner"><Heart size={28}/></div>
             <h4 className="font-black text-gray-900 text-lg uppercase tracking-tight mb-3">{t("Swasthya Saathi")}</h4>
             <p className="text-sm text-gray-400 font-medium leading-relaxed">{t("Health Description")}</p>
          </Card>
          <Card onClick={() => onOpenTool(ModalType.VISION)} className="group bg-white border-2 border-gray-50 rounded-[2.5rem] p-8 hover:border-purple-300 transition-all relative">
             <button onClick={(e) => { e.stopPropagation(); handleSpeak("Vision Helper", "Analyze surroundings via camera."); }} className="absolute top-6 right-6 p-2 rounded-full bg-gray-50 text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all"><Volume2 size={20}/></button>
             <div className="bg-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-inner"><Eye size={28}/></div>
             <h4 className="font-black text-gray-900 text-lg uppercase tracking-tight mb-3">{t("Vision Helper")}</h4>
             <p className="text-sm text-gray-400 font-medium leading-relaxed">{t("Analyze surroundings via camera.")}</p>
          </Card>
        </div>
      </section>

      {/* Tools Section */}
      <section>
        <div className="flex items-center gap-5 mb-12">
          <div className={`w-3 h-10 rounded-full transition-colors ${isOffline ? 'bg-amber-500 shadow-lg shadow-amber-100' : 'bg-blue-500 shadow-lg shadow-blue-100'}`}></div>
          <h3 className={`font-black text-gray-900 uppercase tracking-tighter ${elderMode ? 'text-5xl' : 'text-3xl'}`}>{t("Tools")}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card onClick={() => onOpenTool(ModalType.RESUME)} className={`group bg-white border-2 border-gray-50 rounded-[2.5rem] p-8 transition-all relative ${isOffline ? 'opacity-50 grayscale pointer-events-none' : 'hover:border-blue-300'}`}>
             {!isOffline && <button onClick={(e) => { e.stopPropagation(); handleSpeak("Smart Resume Builder", "Resume Description"); }} className="absolute top-6 right-6 p-2 rounded-full bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Volume2 size={20}/></button>}
             <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center text-blue-600 mb-6 shadow-inner"><Briefcase size={28}/></div>
             <h4 className="font-black text-gray-900 text-lg uppercase tracking-tight mb-3">{t("Smart Resume Builder")}</h4>
             <p className="text-sm text-gray-400 font-medium leading-relaxed">{t("Resume Description")}</p>
          </Card>
          <Card onClick={() => onOpenTool(ModalType.SCHEMES)} className={`group bg-white border-2 border-gray-50 rounded-[2.5rem] p-8 transition-all relative ${isOffline ? 'opacity-50 grayscale pointer-events-none' : 'hover:border-orange-300'}`}>
             {!isOffline && <button onClick={(e) => { e.stopPropagation(); handleSpeak("Scheme Matcher", "Scheme Description"); }} className="absolute top-6 right-6 p-2 rounded-full bg-gray-50 text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-all"><Volume2 size={20}/></button>}
             <div className="bg-orange-50 w-16 h-16 rounded-2xl flex items-center justify-center text-orange-600 mb-6 shadow-inner"><Landmark size={28}/></div>
             <h4 className="font-black text-gray-900 text-lg uppercase tracking-tight mb-3">{t("Scheme Matcher")}</h4>
             <p className="text-sm text-gray-400 font-medium leading-relaxed">{t("Scheme Description")}</p>
          </Card>
          <Card onClick={() => onOpenTool(ModalType.MOBILITY)} className={`group bg-white border-2 border-gray-50 rounded-[2.5rem] p-8 transition-all relative hover:border-purple-300`}>
             <button onClick={(e) => { e.stopPropagation(); handleSpeak("Mobility Planner", "Mobility Description"); }} className="absolute top-6 right-6 p-2 rounded-full bg-gray-50 text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all"><Volume2 size={20}/></button>
             <div className="bg-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center text-purple-600 mb-6 shadow-inner"><Navigation size={28}/></div>
             <h4 className="font-black text-gray-900 text-lg uppercase tracking-tight mb-3">{t("Mobility Planner")}</h4>
             <p className="text-sm text-gray-400 font-medium leading-relaxed">{t("Mobility Description")}</p>
          </Card>
          <Card onClick={() => onOpenTool(ModalType.GOVERNANCE)} className={`group bg-white border-2 border-gray-50 rounded-[2.5rem] p-8 transition-all relative ${isOffline ? 'opacity-50 grayscale pointer-events-none' : 'hover:border-red-300'}`}>
             {!isOffline && <button onClick={(e) => { e.stopPropagation(); handleSpeak("Governance Aid", "Governance Description"); }} className="absolute top-6 right-6 p-2 rounded-full bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"><Volume2 size={20}/></button>}
             <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center text-red-600 mb-6 shadow-inner"><Mic size={28}/></div>
             <h4 className="font-black text-gray-900 text-lg uppercase tracking-tight mb-3">{t("Governance Aid")}</h4>
             <p className="text-sm text-gray-400 font-medium leading-relaxed">{t("Governance Description")}</p>
          </Card>
        </div>
      </section>

      {/* Learning Modules */}
      <section className="pb-24">
        <div className="flex items-center gap-5 mb-12">
          <div className={`w-3 h-10 rounded-full transition-colors ${isOffline ? 'bg-amber-400 shadow-lg shadow-amber-100' : 'bg-yellow-400 shadow-lg shadow-yellow-100'}`}></div>
          <h3 className={`font-black text-gray-900 uppercase tracking-tighter ${elderMode ? 'text-5xl' : 'text-3xl'}`}>{t("Learning Modules")}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
           {learningModules.map(module => (
             <div key={module.id} className="bg-white border-2 border-gray-50 rounded-[3rem] p-8 transition-all flex flex-col h-full group hover:shadow-2xl hover:border-green-100 relative">
               <button onClick={(e) => { e.stopPropagation(); handleSpeak(module.title, module.description); }} className="absolute top-8 right-8 p-2 rounded-full bg-gray-50 text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all"><Volume2 size={20}/></button>
               <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-8 bg-gray-50 border border-gray-100">{module.icon}</div>
               <h4 className="font-black mb-4 text-xl uppercase tracking-tight text-gray-900">{module.title}</h4>
               <p className="text-gray-400 text-base mb-10 flex-grow font-medium leading-relaxed">{module.description}</p>
               <Button onClick={() => onOpenLearning(module)} variant='secondary' className="w-full text-[10px] font-black uppercase tracking-widest py-4 rounded-xl">{t("Start Learning")}</Button>
             </div>
           ))}
        </div>
      </section>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [user, setUser] = useState<User | null>(null);
  const [modal, setModal] = useState<ModalType>(ModalType.NONE);
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [elderMode, setElderMode] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [healthQuery, setHealthQuery] = useState<string>('');
  const [mobilityInitialData, setMobilityInitialData] = useState<{ start?: string; end?: string } | undefined>(undefined);
  
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  
  const [nameInput, setNameInput] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const toggleElderMode = () => setElderMode(!elderMode);
  const toggleOffline = () => setIsOffline(!isOffline);
  const { t, language } = useLanguage();

  // Initialize Local Auth Simulation
  useEffect(() => {
    const savedName = localStorage.getItem('grameen_user_name');
    if (savedName) {
      setUser({ name: savedName, email: `${savedName.toLowerCase()}@local.com` });
      setView(AppView.PORTAL);
    }
  }, []);

  useEffect(() => {
    const handleStatusChange = () => {
      if (!navigator.onLine) setIsOffline(true);
    };
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  const handleLogin = async (overrideName?: string) => {
    const finalName = overrideName || nameInput;
    if (!finalName.trim()) {
      setLoginError("Please enter your name.");
      return;
    }
    
    setLoginLoading(true);
    setLoginError(null);

    // Simulate network delay
    setTimeout(() => {
      localStorage.setItem('grameen_user_name', finalName);
      setUser({ name: finalName, email: `${finalName.toLowerCase()}@local.com` });
      setModal(ModalType.NONE);
      setView(AppView.PORTAL);
      
      // Personalized registration speech confirmation
      speak(`Welcome ${finalName}, your voice command name is now registered.`, language);
      
      setLoginLoading(false);
    }, 800);
  };

  const handleLogout = () => {
    localStorage.removeItem('grameen_user_name');
    setUser(null);
    setView(AppView.LANDING);
  };

  // Logic to handle SAHAYAK AI intent triggers
  const handleSahayakAction = (intent: any) => {
    const targetMap: Record<string, ModalType> = {
      'kisan_mandi': ModalType.MARKET,
      'swasthya_saathi': ModalType.HEALTH_CHAT,
      'resume_builder': ModalType.RESUME,
      'mobility_planner': ModalType.MOBILITY,
      'vision_helper': ModalType.VISION,
      'schemes': ModalType.SCHEMES
    };

    const target = targetMap[intent.target] || ModalType.NONE;

    if (intent.action === 'plan_mobility') {
      setMobilityInitialData({ start: intent.source_location, end: intent.destination_location });
      setModal(ModalType.MOBILITY);
    } else if (intent.action === 'type_health_input') {
      setHealthQuery(intent.text || '');
      setModal(ModalType.HEALTH_CHAT);
    } else if (target !== ModalType.NONE) {
      setModal(target);
    }
  };

  return (
    <AppContext.Provider value={{ elderMode, toggleElderMode, isOffline, toggleOffline }}>
      <div className={`min-h-screen flex flex-col bg-white font-sans ${elderMode ? 'text-lg' : 'text-base'}`}>
        <Header 
          user={user} 
          onViewChange={setView} 
          onLogin={() => setModal(ModalType.LOGIN)} 
          onLogout={handleLogout}
          onVision={() => setModal(ModalType.VISION)}
        />
        
        <main className="flex-grow">
          {view === AppView.LANDING && (
            <LandingPage onGetStarted={() => user ? setView(AppView.PORTAL) : setModal(ModalType.LOGIN)} />
          )}
          
          {view === AppView.PORTAL && user && (
            <Dashboard 
              user={user} 
              onOpenTool={setModal} 
              onOpenLearning={(m) => { setSelectedModule(m); setView(AppView.LEARNING_DETAIL); }}
            />
          )}

          {view === AppView.LEARNING_DETAIL && selectedModule && (
            <LearningViewer module={selectedModule} onBack={() => setView(AppView.PORTAL)} language={language} isOffline={isOffline} />
          )}

          {user && !isOffline && (
            <div className="fixed bottom-12 right-12 z-40">
              <button onClick={() => setModal(ModalType.GLOBAL_CHAT)} className="bg-green-600 hover:bg-green-700 text-white px-10 py-6 rounded-full shadow-[0_20px_60px_-15px_rgba(16,185,129,0.5)] transition-all hover:scale-110 active:scale-95 flex items-center gap-4 group border-4 border-white">
                <MessageCircle size={32} className="fill-current" />
                <span className="font-black uppercase tracking-widest hidden md:inline text-sm">{t("Sahayak AI")}</span>
              </button>
            </div>
          )}
        </main>
        
        <footer className="bg-gray-900 text-gray-400 py-16 text-center">
           <div className="max-w-7xl mx-auto px-4">
              <span className="font-black text-white text-2xl tracking-tighter mb-4 block">GrameenConnect</span>
              <p className="text-sm font-medium opacity-60">© 2024 GRAMEENCONNECT INITIATIVE.</p>
           </div>
        </footer>

        <Modal isOpen={modal === ModalType.LOGIN} onClose={() => { setModal(ModalType.NONE); setLoginError(null); }} title={t("Join GrameenConnect")} maxWidth="max-w-md">
          <div className="space-y-6">
            <div className="bg-indigo-50 p-6 rounded-3xl flex flex-col items-center gap-4 border border-indigo-100 mb-2 text-center">
               <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-xl shadow-indigo-100"><UserIcon size={32}/></div>
               <div>
                 <h4 className="font-black text-xs uppercase tracking-[0.2em] text-indigo-700 mb-1">{t("What is your name?")}</h4>
                 <p className="text-xs font-bold text-indigo-500 opacity-70">{t("Enter your name to start using the portal.")}</p>
               </div>
            </div>
            
            <Input 
              label={t("Your Name")} 
              placeholder="e.g. Rajesh Kumar" 
              value={nameInput} 
              onChange={e => setNameInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              autoFocus
            />
            
            {loginError && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-2 text-red-600 text-xs font-bold animate-in zoom-in duration-300">
                <AlertCircle size={16} />
                <span>{loginError}</span>
              </div>
            )}
            
            <Button onClick={() => handleLogin()} isLoading={loginLoading} className="w-full py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-green-100 bg-green-600 text-white">
               {t("Join Portal")} <ArrowRight size={20}/>
            </Button>
            
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
              <span className="bg-white px-4 relative">OR</span>
            </div>
            
            <FaceAuth onSuccess={(name) => handleLogin(name)} language={language} />
          </div>
        </Modal>

        <ResumeModal isOpen={modal === ModalType.RESUME} onClose={() => setModal(ModalType.NONE)} language={language} />
        <SchemeModal isOpen={modal === ModalType.SCHEMES} onClose={() => setModal(ModalType.NONE)} language={language} />
        <MobilityModal isOpen={modal === ModalType.MOBILITY} onClose={() => setModal(ModalType.NONE)} language={language} initialData={mobilityInitialData} />
        <GovernanceModal isOpen={modal === ModalType.GOVERNANCE} onClose={() => setModal(ModalType.NONE)} language={language} />
        <ChatModal isOpen={modal === ModalType.HEALTH_CHAT} onClose={() => { setModal(ModalType.NONE); setHealthQuery(''); }} language={language} initialInput={healthQuery} />
        <GlobalChatModal isOpen={modal === ModalType.GLOBAL_CHAT} onClose={() => setModal(ModalType.NONE)} language={language} onActionTrigger={handleSahayakAction} />
        <KisanModal isOpen={modal === ModalType.MARKET} onClose={() => setModal(ModalType.NONE)} language={language} items={marketItems} setItems={setMarketItems} />
        <VisionModal isOpen={modal === ModalType.VISION} onClose={() => setModal(ModalType.NONE)} language={language} />
        <OfflineResourcesModal isOpen={modal === ModalType.OFFLINE_RESOURCES} onClose={() => setModal(ModalType.NONE)} language={language} />
      </div>
    </AppContext.Provider>
  );
}
