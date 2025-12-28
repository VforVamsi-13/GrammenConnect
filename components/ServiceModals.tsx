import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Input } from './Shared';
import { generateContent, generateVisionContent, chatWithBot, transliterateText, recognizeSahayakIntent, extractMandiItem } from '../services/geminiService';
import { getAllCachedItems } from '../services/cacheService';
import { speak } from '../services/speechService';
import { Mic, Send, Camera, Upload, Image as ImageIcon, Plus, AlertTriangle, MapPin, MessageCircle, FileText, Download, Check, Languages, Sparkles, User, Activity, ArrowRight, Phone, X, Key, Info, RefreshCw, ShoppingCart, HelpingHand, Stethoscope, Users, HandHeart, ShoppingBag, Volume2, VolumeX, ChevronLeft, Loader2 } from 'lucide-react';
import { MarketItem, Language, ModalType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import ReactMarkdown from 'react-markdown';

const SPEECH_LANG_MAP: Record<string, string> = {
  'en': 'en-IN', 'hi': 'hi-IN', 'bn': 'bn-IN', 'te': 'te-IN', 'mr': 'mr-IN', 'ta': 'ta-IN', 'ur': 'ur-PK', 'gu': 'gu-IN', 'kn': 'kn-IN', 'ml': 'ml-IN', 'pa': 'pa-IN', 'or': 'or-IN', 'as': 'as-IN' 
};

export const simulateDownload = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const PhoneticHelper: React.FC<{ text: string; setText: (v: string) => void; targetLang: Language }> = ({ text, setText, targetLang }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  if (targetLang === 'en') return null;
  const handleTransliterate = async () => {
    if (!text) return;
    setLoading(true);
    const result = await transliterateText(text, targetLang);
    setText(result);
    setLoading(false);
  };
  return (
    <button onClick={handleTransliterate} disabled={loading || !text} className="p-3 rounded-full bg-white text-green-600 border border-green-50 shadow-sm hover:shadow-lg hover:scale-110 transition-all">
       <Languages size={20} className={loading ? 'animate-spin' : ''} />
    </button>
  );
};

export const GovernanceModal: React.FC<{ isOpen: boolean; onClose: () => void; language: Language }> = ({ isOpen, onClose, language }) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: "Namaste! I am your Sarkari Saathi. I can help you understand government procedures, documents, and public services." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isOpen]);

  const handleSend = async (forcedText?: string) => {
    const textToSend = forcedText || input;
    if (!textToSend.trim() || loading) return;
    
    if (!forcedText) setInput('');
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setLoading(true);
    
    try {
        const response = await chatWithBot(messages, textToSend, "You are Sarkari Saathi, a professional yet accessible assistant helping Indian rural citizens with government-related queries like forms, RTI, and public services.", language);
        setMessages(prev => [...prev, { role: 'model', text: response }]);
        setLoading(false);
        
        if (autoSpeak) {
            speak(response.replace(/[#*`]/g, ''), language);
        }
    } catch (e) {
        setLoading(false);
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) return;
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = SPEECH_LANG_MAP[language] || 'en-IN';
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleSend(transcript);
    };
    recognition.start();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("Governance Aid")} maxWidth="max-w-md">
       <div className="flex flex-col h-[550px]">
         <div className="flex items-center justify-between px-2 mb-4">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${autoSpeak ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{autoSpeak ? t("Auto-Speak On") : t("Auto-Speak Off")}</span>
            </div>
            <button 
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`p-2 rounded-xl transition-all ${autoSpeak ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}
            >
                {autoSpeak ? <Volume2 size={16}/> : <VolumeX size={16}/>}
            </button>
         </div>

         <div className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar">
           {messages.map((m, i) => (
             <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium relative group ${m.role === 'user' ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-100 text-gray-800 shadow-sm'}`}>
                 {/* Fix: Wrapped ReactMarkdown in a div to apply className styles */}
                 <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                 </div>
                 {m.role === 'model' && (
                   <button 
                    onClick={() => speak(m.text.replace(/[#*`]/g, ''), language)}
                    className="absolute -right-10 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-md text-red-600 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                   >
                     <Volume2 size={14} />
                   </button>
                 )}
               </div>
             </div>
           ))}
           {loading && <div className="text-xs text-gray-400 font-black animate-pulse uppercase tracking-widest">Sarkari Saathi thinking...</div>}
           <div ref={bottomRef} />
         </div>

         <div className="pt-4 mt-4 border-t flex flex-col gap-3">
           <div className="flex gap-2">
             <PhoneticHelper text={input} setText={setInput} targetLang={language} />
             <div className="flex-1 relative">
               <input className="w-full bg-gray-50 border-2 border-transparent rounded-full px-5 py-3 outline-none focus:bg-white focus:border-red-500 font-medium text-sm pr-12" placeholder={t("Ask about services...")} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
               <button onClick={() => handleSend()} className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 shadow-md transition-all active:scale-90"><Send size={16} /></button>
             </div>
             <button onClick={startListening} className={`p-3 rounded-full shadow-lg transition-all active:scale-90 ${listening ? 'bg-red-500 animate-pulse text-white' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
               <Mic size={20} />
             </button>
           </div>
         </div>
       </div>
    </Modal>
  );
};

export const GlobalChatModal: React.FC<{ isOpen: boolean; onClose: () => void; language: Language; onActionTrigger?: (action: any) => void }> = ({ isOpen, onClose, language, onActionTrigger }) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: "Namaste! I am SAHAYAK AI. Speak to control GrameenConnect. Try: 'Open kisan mandi' or 'I have a fever'." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isOpen]);

  const handleSend = async (forcedText?: string) => {
    const textToSend = forcedText || input;
    if (!textToSend.trim() || loading) return;
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setLoading(true);

    try {
      const sahayakResult = await recognizeSahayakIntent(textToSend, language);
      if (sahayakResult && sahayakResult.action !== "unknown") {
        if (sahayakResult.text) {
          setMessages(prev => [...prev, { role: 'model', text: sahayakResult.text }]);
          speak(sahayakResult.text, language);
        }
        if (onActionTrigger) {
          setTimeout(() => onActionTrigger(sahayakResult), 1500);
        }
      } else {
        const text = sahayakResult.text || `I can help with Mandi, Health, Resume, and Mobility.`;
        setMessages(prev => [...prev, { role: 'model', text: text }]);
        speak(text, language);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble understanding. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) return;
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = SPEECH_LANG_MAP[language] || 'en-IN';
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event: any) => handleSend(event.results[0][0].transcript);
    recognition.start();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("Sahayak AI")} maxWidth="max-w-md">
       <div className="flex flex-col h-[550px]">
         <div className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar">
           {messages.map((m, i) => (
             <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium ${m.role === 'user' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-100 text-gray-800 shadow-sm'}`}>
                 {/* Fix: Wrapped ReactMarkdown in a div to apply className styles */}
                 <div className="prose prose-sm max-w-none prose-green">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                 </div>
               </div>
             </div>
           ))}
           {loading && <div className="text-xs text-gray-400 font-black animate-pulse uppercase tracking-widest">{t("SAHAYAK THINKING...")}</div>}
           <div ref={bottomRef} />
         </div>
         <div className="pt-4 mt-4 border-t flex flex-col gap-3">
           <div className="flex gap-2">
             <PhoneticHelper text={input} setText={setInput} targetLang={language} />
             <div className="flex-1 relative">
               <input className="w-full bg-gray-50 border-2 border-transparent rounded-full px-5 py-3 outline-none focus:bg-white focus:border-green-500 font-medium text-sm pr-12" placeholder="Tell Sahayak what to do..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
               <button onClick={() => handleSend()} className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-600 text-white p-2 rounded-full hover:bg-green-700 shadow-md transition-all active:scale-90"><Send size={16} /></button>
             </div>
             <button onClick={startListening} className={`p-3 rounded-full shadow-lg transition-all active:scale-90 ${listening ? 'bg-red-500 animate-pulse text-white' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
               {listening ? <Mic size={20} /> : <Sparkles size={20} />}
             </button>
           </div>
         </div>
       </div>
    </Modal>
  );
};

export const ChatModal: React.FC<{ isOpen: boolean; onClose: () => void; language: Language; initialInput?: string }> = ({ isOpen, onClose, language, initialInput }) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: "Namaste! I am Swasthya Saathi. Describe your symptoms." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (isOpen && initialInput && messages.length === 1) handleSend(initialInput); }, [isOpen, initialInput]);
  useEffect(() => { if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isOpen]);

  const handleSend = async (forcedText?: string) => {
    const textToSend = forcedText || input;
    if (!textToSend.trim() || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setLoading(true);
    const response = await chatWithBot(messages, textToSend, "Swasthya Saathi Health Assistant. Render your answers in Markdown. Focus on home remedies or advising doctors.", language);
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("Swasthya Saathi")} maxWidth="max-w-md">
       <div className="flex flex-col h-[550px]">
         <div className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar">
           <div className="bg-red-50 text-red-600 text-[10px] p-3 rounded-xl border border-red-100 font-black tracking-widest uppercase mb-4">{t("Disclaimer")}</div>
           {messages.map((m, i) => (
             <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium ${m.role === 'user' ? 'bg-pink-600 text-white shadow-lg' : 'bg-gray-100 text-gray-800 shadow-sm'}`}>
                 {/* Fix: Wrapped ReactMarkdown in a div to apply className styles */}
                 <div className="prose prose-sm max-w-none prose-pink">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                 </div>
               </div>
             </div>
           ))}
           <div ref={bottomRef} />
         </div>
         <div className="pt-4 mt-4 border-t flex gap-3 items-center">
           <PhoneticHelper text={input} setText={setInput} targetLang={language} />
           <div className="flex-1 relative">
             <input className="w-full bg-gray-50 border-2 border-transparent rounded-full px-5 py-3 outline-none focus:bg-white focus:border-pink-500 font-medium text-sm pr-12" placeholder="Describe symptoms..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
             <button onClick={() => handleSend()} className="absolute right-2 top-1/2 -translate-y-1/2 bg-pink-600 text-white p-2 rounded-full hover:bg-pink-700 shadow-md transition-all active:scale-90"><Send size={16} /></button>
           </div>
         </div>
       </div>
    </Modal>
  );
};

export const VisionModal: React.FC<{ isOpen: boolean; onClose: () => void; language: Language }> = ({ isOpen, onClose, language }) => {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const analyzeImage = async () => {
    if (!image) return;
    setLoading(true);
    const res = await generateVisionContent("Explain this image simply for a rural user.", image.split(',')[1], image.split(';')[0].split(':')[1], language);
    setResult(res);
    setLoading(false);
  };
  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setImage(null); setResult(null); }} title={t("Vision")}>
      <div className="flex flex-col items-center space-y-6">
        {!image ? (
          <button onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-green-100 bg-green-50 rounded-[3rem] p-20 w-full flex flex-col items-center gap-4 hover:bg-green-100 group transition-all">
             <Camera size={56} className="text-green-500 group-hover:scale-110" />
             <span className="font-black text-green-700 uppercase tracking-widest text-xs">{t("Upload Photo")}</span>
          </button>
        ) : (
          <div className="w-full space-y-6">
            <img src={image} className="max-h-64 mx-auto rounded-3xl object-contain shadow-2xl border-4 border-white" />
            {!result ? <Button onClick={analyzeImage} isLoading={loading} className="w-full py-4 font-black uppercase text-xs rounded-2xl">{t("Explain This")}</Button> : (
              <div className="bg-green-50 p-6 rounded-[2.5rem] border-2 border-green-100">
                {/* Fix: Wrapped ReactMarkdown in a div to apply className styles */}
                <div className="text-gray-700 font-medium leading-relaxed prose prose-green max-w-none">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
                <Button onClick={() => simulateDownload('Analysis.txt', result || '')} variant="outline" className="w-full mt-6 py-4 font-black text-xs rounded-2xl"><Download size={16} /> {t("Download Analysis")}</Button>
              </div>
            )}
          </div>
        )}
        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const r = new FileReader(); r.onloadend = () => setImage(r.result as string); r.readAsDataURL(file);
          }
        }} />
      </div>
    </Modal>
  );
};

// Simulation of initial market data
const INITIAL_MANDI_ITEMS: MarketItem[] = [
  { id: '1', name: 'Fresh Wheat', price: '₹22/kg', seller: 'Ramesh Singh', location: 'Village Belari', contact: '9876543210', image: 'https://images.unsplash.com/photo-1542740348-3946fdbbaa84?auto=format&fit=crop&q=80&w=400' },
  { id: '2', name: 'Mustard Oil', price: '₹140/L', seller: 'Saroj Devi', location: 'Village Kanpur', contact: '9876543211', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400' },
];

export const KisanModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  language: Language;
  items: MarketItem[];
  setItems: React.Dispatch<React.SetStateAction<MarketItem[]>>;
}> = ({ isOpen, onClose, language, items, setItems }) => {
  const [view, setView] = useState<'buy' | 'sell'>('buy');
  const [sellStep, setSellStep] = useState<0 | 1>(0);
  const [sellImage, setSellImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceFilling, setIsVoiceFilling] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', contact: '', location: 'My Village' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  // Local persistence simulation
  const fetchMarketItems = () => {
    setIsLoading(true);
    const saved = localStorage.getItem('grameen_market_items');
    if (saved) {
      setItems(JSON.parse(saved));
    } else {
      localStorage.setItem('grameen_market_items', JSON.stringify(INITIAL_MANDI_ITEMS));
      setItems(INITIAL_MANDI_ITEMS);
    }
    setIsLoading(false);
  };

  useEffect(() => { if (isOpen && view === 'buy') fetchMarketItems(); }, [isOpen, view]);

  const handlePost = () => {
    if (!sellImage || !newItem.name) return;
    setIsPosting(true);
    setTimeout(() => {
      const currentItems = JSON.parse(localStorage.getItem('grameen_market_items') || '[]');
      const item: MarketItem = {
        id: Date.now().toString(),
        name: newItem.name,
        price: newItem.price,
        contact: newItem.contact,
        location: newItem.location,
        image: sellImage,
        seller: localStorage.getItem('grameen_user_name') || 'Local Farmer'
      };
      const updated = [item, ...currentItems];
      localStorage.setItem('grameen_market_items', JSON.stringify(updated));
      setItems(updated);
      setSellImage(null);
      setNewItem({ name: '', price: '', contact: '', location: 'My Village' });
      setView('buy');
      setSellStep(0);
      setIsPosting(false);
    }, 1000);
  };

  const handleVoiceFill = () => {
    if (!('webkitSpeechRecognition' in window)) return;
    const rec = new (window as any).webkitSpeechRecognition();
    rec.lang = SPEECH_LANG_MAP[language] || 'en-IN';
    rec.onstart = () => setIsVoiceFilling(true);
    rec.onend = () => setIsVoiceFilling(false);
    rec.onresult = async (ev: any) => {
      const ext = await extractMandiItem(ev.results[0][0].transcript, language);
      setNewItem(prev => ({ ...prev, ...ext }));
      setSellStep(1);
    };
    rec.start();
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setView('buy'); setSellImage(null); }} title={t("Kisan Mandi")} maxWidth="max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">{view === 'buy' ? t("Kisan Mandi") : t("Sell Produce")}</h3>
        <button onClick={() => setView(view === 'buy' ? 'sell' : 'buy')} className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] border-2 ${view === 'buy' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-400 border-gray-100'}`}>
           {view === 'buy' ? t("Sell Produce") : t("Back to Market")}
        </button>
      </div>

      {view === 'buy' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-green-500" size={48} /></div> : items.map((item) => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden hover:shadow-xl transition-all relative group shadow-sm">
              <img src={item.image} className="w-full h-40 object-cover" />
              <button onClick={() => speak(`${item.name}, ${item.price}, seller ${item.seller}`, language)} className="absolute top-4 right-4 bg-white/95 p-3 rounded-full text-green-600 shadow-xl active:scale-90"><Volume2 size={20} /></button>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                   <h4 className="font-black uppercase tracking-tight text-gray-900">{item.name}</h4>
                   <span className="text-xs font-black text-green-600">{item.price}</span>
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                   <div className="flex items-center gap-1"><User size={12}/> {item.seller}</div>
                   <div className="flex items-center gap-1"><MapPin size={12}/> {item.location}</div>
                </div>
                <a href={`tel:${item.contact}`} className="w-full bg-green-50 text-green-700 py-3 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] border border-green-100 hover:bg-green-600 hover:text-white transition-all">
                   <Phone size={14}/> {t("Contact Seller")}
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          {sellStep === 0 ? (
            <div className="grid grid-cols-2 gap-6">
              <button onClick={handleVoiceFill} className="bg-green-600 p-10 rounded-[3rem] text-white flex flex-col items-center gap-4 active:scale-95 transition-all">
                <Mic size={48} className={isVoiceFilling ? 'animate-pulse text-red-300' : ''} />
                <h4 className="font-black uppercase text-sm">{t("Voice Describe")}</h4>
              </button>
              <button onClick={() => setSellStep(1)} className="bg-gray-50 p-10 rounded-[3rem] text-gray-500 flex flex-col items-center gap-4 active:scale-95 transition-all border border-gray-100">
                <Plus size={48} />
                <h4 className="font-black uppercase text-sm">{t("Manual Entry")}</h4>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {!sellImage ? (
                <div className="border-4 border-dashed border-gray-100 bg-gray-50 rounded-[3rem] p-10 text-center flex flex-col items-center gap-4">
                  <Camera size={48} className="text-gray-300" />
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline">{t("Choose Photo")}</Button>
                  <input type="file" ref={fileInputRef} hidden onChange={(e) => {
                    const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setSellImage(r.result as string); r.readAsDataURL(f); }
                  }} />
                </div>
              ) : (
                <div className="space-y-4">
                  <img src={sellImage} className="w-full h-48 object-cover rounded-3xl" />
                  <Input label={t("Item Name")} value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                  <Input label={t("Price")} value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
                  <Button onClick={handlePost} isLoading={isPosting} className="w-full py-4 rounded-2xl">{t("Post Listing")}</Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export const OfflineResourcesModal: React.FC<{ isOpen: boolean; onClose: () => void; language: Language }> = ({ isOpen, onClose, language }) => {
  const { t } = useLanguage();
  const cachedItems = getAllCachedItems();
  const keys = Object.keys(cachedItems);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("Offline Resources")}>
       <div className="space-y-4">
         {keys.length === 0 ? <div className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No saved resources.</div> : keys.map((key, idx) => (
           <div key={key} className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-lg"><FileText className="text-emerald-600" size={20} /></div>
                <span className="text-sm font-bold text-gray-800">{key.split('_')[1]?.substring(0, 30)}...</span>
              </div>
              <span className="text-[10px] font-black text-gray-300 uppercase">Saved</span>
           </div>
         ))}
       </div>
    </Modal>
  );
};