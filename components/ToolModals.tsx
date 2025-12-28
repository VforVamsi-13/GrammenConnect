import React, { useState, useEffect, useRef } from 'react';
import { Modal, Input, Button } from './Shared';
import { generateContent, getMobilityPlan, extractResumeDetails, extractSchemeDetails, extractMobilityDetails, geocodeLocation } from '../services/geminiService';
import { speak } from '../services/speechService';
import { MapPin, User, Briefcase, GraduationCap, Mic, Volume2, ShieldCheck, AlertTriangle, Navigation, ExternalLink, Sparkles, ChevronRight, ChevronLeft, Flag, Map as MapIcon } from 'lucide-react';
import { Language } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import ReactMarkdown from 'react-markdown';
import L from 'leaflet';

// Fix for Leaflet marker icons in modern environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SPEECH_LANG_MAP: Record<string, string> = {
  'en': 'en-IN', 'hi': 'hi-IN', 'bn': 'bn-IN', 'te': 'te-IN', 'mr': 'mr-IN', 'ta': 'ta-IN', 'ur': 'ur-PK', 'gu': 'gu-IN', 'kn': 'kn-IN', 'ml': 'ml-IN', 'pa': 'pa-IN', 'or': 'or-IN', 'as': 'as-IN' 
};

// --- Resume Builder ---
export const ResumeModal: React.FC<{ isOpen: boolean; onClose: () => void; language: Language }> = ({ isOpen, onClose, language }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ name: '', location: '', skills: '', experience: '', education: '' });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVoiceFilling, setIsVoiceFilling] = useState(false);
  const { t } = useLanguage();

  const generateResume = async () => {
    setLoading(true);
    const prompt = `Create a professional resume summary for a rural worker based on this info in ${language}: Name: ${data.name}, Location: ${data.location}, Skills: ${data.skills}, Experience: ${data.experience}, Education: ${data.education}. Format nicely with sections.`;
    const res = await generateContent(prompt, language);
    setResult(res);
    setLoading(false);
    setStep(1);
  };

  const handleVoiceFill = () => {
    if (!('webkitSpeechRecognition' in window)) return;
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = SPEECH_LANG_MAP[language] || 'en-IN';
    recognition.onstart = () => setIsVoiceFilling(true);
    recognition.onend = () => setIsVoiceFilling(false);
    recognition.onresult = async (event: any) => {
      const speech = event.results[0][0].transcript;
      const extracted = await extractResumeDetails(speech, language);
      setData(prev => ({ ...prev, ...extracted }));
    };
    recognition.start();
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setStep(0); setResult(''); }} title={t("Smart Resume Builder")}>
      {step === 0 ? (
        <div className="space-y-4">
          <div className="bg-green-50 p-5 rounded-3xl border border-green-100 flex items-center justify-between shadow-sm mb-4">
             <div className="flex items-center gap-4">
               <div className="bg-green-600 text-white p-2.5 rounded-2xl shadow-lg"><Sparkles size={20}/></div>
               <div>
                 <p className="text-xs font-black uppercase tracking-widest text-green-800">{t("Sahayak AI")}</p>
                 <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest mt-0.5">{isVoiceFilling ? t("Listening...") : t("Voice Fill Form")}</p>
               </div>
             </div>
             <button onClick={handleVoiceFill} className={`p-4 rounded-full transition-all shadow-lg active:scale-90 ${isVoiceFilling ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-green-600 hover:bg-green-50 border border-green-100'}`}><Mic size={24} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t("Full Name")} placeholder="" value={data.name} onChange={e => setData({...data, name: e.target.value})} icon={<User size={16}/>} />
            <Input label={t("Village / City")} placeholder="" value={data.location} onChange={e => setData({...data, location: e.target.value})} />
          </div>
          <Input label={t("Skills")} placeholder="" value={data.skills} onChange={e => setData({...data, skills: e.target.value})} />
          <Input label={t("Work Experience")} placeholder="" value={data.experience} onChange={e => setData({...data, experience: e.target.value})} />
          <Input label={t("Education")} placeholder="" value={data.education} onChange={e => setData({...data, education: e.target.value})} />
          <div className="pt-4"><Button onClick={generateResume} isLoading={loading} className="w-full py-4 font-black uppercase tracking-widest">{t("Generate")}</Button></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative group">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-sm whitespace-pre-wrap font-medium leading-relaxed">{result}</div>
            <button onClick={() => speak(result, language)} className="absolute top-4 right-4 p-3 bg-white text-green-600 rounded-full shadow-lg border border-gray-100 hover:bg-green-600 hover:text-white transition-all"><Volume2 size={20} /></button>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" onClick={() => setStep(0)} className="flex-1 py-4 font-black uppercase tracking-widest text-[10px]">{t("Edit Details")}</Button>
             <Button onClick={onClose} className="flex-1 py-4 font-black uppercase tracking-widest text-[10px]">{t("Close")}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

// --- Scheme Matcher ---
export const SchemeModal: React.FC<{ isOpen: boolean; onClose: () => void; language: Language }> = ({ isOpen, onClose, language }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [data, setData] = useState({ age: '', gender: 'Male', occupation: '', income: '', state: '' });
  const [isVoiceFilling, setIsVoiceFilling] = useState(false);
  const { t } = useLanguage();

  const handleVoiceFill = () => {
    if (!('webkitSpeechRecognition' in window)) return;
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = SPEECH_LANG_MAP[language] || 'en-IN';
    recognition.onstart = () => setIsVoiceFilling(true);
    recognition.onend = () => setIsVoiceFilling(false);
    recognition.onresult = async (event: any) => {
      const speech = event.results[0][0].transcript;
      const extracted = await extractSchemeDetails(speech, language);
      setData(prev => ({ ...prev, ...extracted }));
    };
    recognition.start();
  };

  const findSchemes = async () => {
    setLoading(true);
    const prompt = `List 3 government schemes for: Age ${data.age}, ${data.gender}, ${data.occupation}, ${data.state}, Income ${data.income}. Return names and brief benefits as bullet list in ${language}.`;
    const res = await generateContent(prompt, language, "Sarkari Scheme Assistant. Concise output.");
    setResult(res);
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setResult(null); }} title={t("Scheme Matcher")}>
       {!result ? (
         <div className="space-y-4">
           <div className="bg-green-50 p-5 rounded-3xl border border-green-100 flex items-center justify-between shadow-sm mb-4">
              <div className="flex items-center gap-4">
                <div className="bg-green-600 text-white p-2.5 rounded-2xl shadow-lg"><Sparkles size={20}/></div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-green-800">{t("Sahayak AI")}</p>
                  <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest mt-0.5">{isVoiceFilling ? t("Listening...") : t("Voice Fill Form")}</p>
                </div>
              </div>
              <button onClick={handleVoiceFill} className={`p-4 rounded-full transition-all shadow-lg active:scale-90 ${isVoiceFilling ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-green-600 hover:bg-green-50 border border-green-100'}`}><Mic size={24} /></button>
           </div>
           <div className="grid grid-cols-2 gap-4">
             <Input label={t("Age")} type="number" placeholder="" value={data.age} onChange={e => setData({...data, age: e.target.value})} />
             <div className="flex flex-col gap-1">
               <label className="text-sm font-medium text-gray-700">{t("Gender")}</label>
               <select className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 font-medium" value={data.gender} onChange={e => setData({...data, gender: e.target.value})}>
                 <option value="Male">Male</option>
                 <option value="Female">Female</option>
                 <option value="Other">Other</option>
               </select>
             </div>
           </div>
           <Input label={t("Occupation")} placeholder="" value={data.occupation} onChange={e => setData({...data, occupation: e.target.value})} />
           <Input label={t("Income")} placeholder="" value={data.income} onChange={e => setData({...data, income: e.target.value})} />
           <Input label={t("State / District")} placeholder="" value={data.state} onChange={e => setData({...data, state: e.target.value})} />
           <Button onClick={findSchemes} isLoading={loading} className="w-full mt-2 py-4 font-black uppercase tracking-widest">{t("Find My Schemes")}</Button>
         </div>
       ) : (
         <div className="space-y-4">
           <div className="relative group">
            <div className="bg-green-50 p-6 rounded-2xl text-gray-800 text-sm whitespace-pre-line font-medium leading-relaxed">{result}</div>
            <button onClick={() => speak(result || '', language)} className="absolute top-4 right-4 p-3 bg-white text-green-600 rounded-full shadow-lg border border-gray-100 hover:bg-green-600 hover:text-white transition-all"><Volume2 size={20} /></button>
           </div>
           <Button onClick={() => setResult(null)} variant="outline" className="w-full py-4 font-black uppercase tracking-widest">{t("Search Again")}</Button>
         </div>
       )}
    </Modal>
  );
};

// --- Mobility Planner ---
export const MobilityModal: React.FC<{ isOpen: boolean; onClose: () => void; language: Language; initialData?: { start?: string; end?: string } }> = ({ isOpen, onClose, language, initialData }) => {
  const [wizardStep, setWizardStep] = useState(1);
  const [data, setData] = useState({ start: '', end: '', aid: 'None' });
  const [planningResult, setPlanningResult] = useState<{ text: string; links: { title: string; uri: string }[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState<'start' | 'end' | null>(null);
  const [coords, setCoords] = useState<{ start: {lat: number, lng: number}, end: {lat: number, lng: number} } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (initialData && isOpen) {
      setData(prev => ({ ...prev, ...initialData }));
      if (initialData.start && initialData.end) setWizardStep(3);
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    let timer: any;
    let resizeTimer: any;
    
    if (wizardStep === 4 && isOpen && mapRef.current && coords) {
      timer = setTimeout(() => {
        if (!mapRef.current) return;
        
        try {
          if (leafletMap.current) {
            leafletMap.current.remove();
            leafletMap.current = null;
          }

          leafletMap.current = L.map(mapRef.current, { 
            zoomControl: true, 
            scrollWheelZoom: true,
            dragging: true,
            zoomAnimation: true
          }).setView([coords.start.lat, coords.start.lng], 12);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
            attribution: '&copy; OpenStreetMap' 
          }).addTo(leafletMap.current);
          
          const startIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div class="bg-emerald-600 text-white p-2 rounded-full shadow-lg border-2 border-white scale-125 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40]
          });

          const endIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div class="bg-red-600 text-white p-2 rounded-full shadow-lg border-2 border-white scale-125 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg></div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40]
          });

          const startMarker = L.marker([coords.start.lat, coords.start.lng], { icon: startIcon }).addTo(leafletMap.current).bindPopup(`<b>${t("Start")}:</b><br/>${data.start}`);
          const endMarker = L.marker([coords.end.lat, coords.end.lng], { icon: endIcon }).addTo(leafletMap.current).bindPopup(`<b>${t("Destination")}:</b><br/>${data.end}`);
          
          const group = new L.FeatureGroup([startMarker, endMarker]);
          leafletMap.current.fitBounds(group.getBounds().pad(0.5));

          // Ensure map container renders correctly within modal
          resizeTimer = setInterval(() => {
            if (leafletMap.current) {
              leafletMap.current.invalidateSize();
            }
          }, 400);
          
          setTimeout(() => clearInterval(resizeTimer), 4000);
        } catch (e) { 
          console.error("Leaflet initialization failed:", e); 
        }
      }, 800);
    }
    return () => {
      clearTimeout(timer);
      if (resizeTimer) clearInterval(resizeTimer);
      if (leafletMap.current) { 
        leafletMap.current.remove(); 
        leafletMap.current = null; 
      }
    };
  }, [wizardStep, coords, isOpen, t, data.start, data.end]);

  const handleVoiceInput = (field: 'start' | 'end') => {
    if (!('webkitSpeechRecognition' in window)) return;
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = SPEECH_LANG_MAP[language] || 'en-IN';
    recognition.onstart = () => setIsVoiceActive(field);
    recognition.onend = () => setIsVoiceActive(null);
    recognition.onresult = (event: any) => {
      const speech = event.results[0][0].transcript;
      setData(prev => ({ ...prev, [field]: speech }));
    };
    recognition.start();
  };

  const startPlanning = async (s: string, e: string, a: string) => {
    setLoading(true);
    const [startCoords, endCoords] = await Promise.all([
      geocodeLocation(s),
      geocodeLocation(e)
    ]);

    if (startCoords && endCoords && startCoords.lat) {
      setCoords({ start: startCoords, end: endCoords });
    } else {
      // General India coords if specific search fails
      setCoords({ start: { lat: 20.5937, lng: 78.9629 }, end: { lat: 21.1458, lng: 79.0882 } });
    }

    const plan = await getMobilityPlan(s, e, a, language);
    setPlanningResult(plan);
    setLoading(false);
  };

  const next = () => {
    if (wizardStep === 3) {
      setWizardStep(4);
      startPlanning(data.start, data.end, data.aid);
    } else setWizardStep(wizardStep + 1);
  };

  const prev = () => setWizardStep(wizardStep - 1);

  const openInGoogleMaps = () => {
    if (coords) {
      window.open(`https://www.google.com/maps/dir/${coords.start.lat},${coords.start.lng}/${coords.end.lat},${coords.end.lng}/`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/${encodeURIComponent(data.start)}/${encodeURIComponent(data.end)}/`, '_blank');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setWizardStep(1); setPlanningResult(null); setCoords(null); }} title={t("Mobility Planner")} maxWidth="max-w-4xl">
      <div className="flex flex-col space-y-6">
        {wizardStep < 4 && (
          <div className="flex justify-between items-center px-4 py-4 border-b border-gray-100 overflow-x-auto no-scrollbar">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex flex-col items-center gap-1 flex-1 min-w-[80px] relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all z-10 ${wizardStep >= s ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>{s}</div>
                <span className={`text-[8px] font-black uppercase tracking-widest text-center ${wizardStep === s ? 'text-green-600' : 'text-gray-300'}`}>
                  {s === 1 ? t("Start") : s === 2 ? t("Destination") : t("Aid")}
                </span>
                {s < 3 && <div className={`absolute top-4 left-1/2 w-full h-0.5 -z-0 ${wizardStep > s ? 'bg-green-600' : 'bg-gray-100'}`} />}
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 min-h-[300px]">
          {wizardStep === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 py-4">
               <div className="flex items-center justify-between">
                 <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">{t("Select Start")}</h3>
                 <button 
                  onClick={() => handleVoiceInput('start')} 
                  className={`p-3 rounded-full shadow-lg transition-all active:scale-90 ${isVoiceActive === 'start' ? 'bg-red-500 animate-pulse text-white' : 'bg-green-50 text-green-600 border border-green-100 hover:bg-green-100'}`}
                 >
                   <Mic size={20} />
                 </button>
               </div>
               <Input 
                placeholder={t("Enter village or town...")} 
                value={data.start} 
                onChange={e => setData({...data, start: e.target.value})} 
                icon={<MapPin size={20} className="text-green-500" />} 
                className="py-5 px-6 text-lg rounded-2xl border-2 focus:border-green-500" 
                autoFocus 
               />
               <div className="bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                    <span className="text-green-600">Tip:</span> Use the microphone to speak your village name.
                  </p>
               </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 py-4">
               <div className="flex items-center justify-between">
                 <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">{t("Select Destination")}</h3>
                 <button 
                  onClick={() => handleVoiceInput('end')} 
                  className={`p-3 rounded-full shadow-lg transition-all active:scale-90 ${isVoiceActive === 'end' ? 'bg-red-500 animate-pulse text-white' : 'bg-green-50 text-green-600 border border-green-100 hover:bg-green-100'}`}
                 >
                   <Mic size={20} />
                 </button>
               </div>
               <Input 
                placeholder={t("Enter destination...")} 
                value={data.end} 
                onChange={e => setData({...data, end: e.target.value})} 
                icon={<Flag size={20} className="text-red-500" />} 
                className="py-5 px-6 text-lg rounded-2xl border-2 focus:border-green-500" 
                autoFocus 
               />
            </div>
          )}

          {wizardStep === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 py-4">
               <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">{t("Select Aid")}</h3>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 {['None', 'Wheelchair', 'Walking Stick', 'Crutches'].map(aid => (
                    <button 
                      key={aid} 
                      onClick={() => setData({...data, aid})} 
                      className={`p-5 rounded-2xl border-4 transition-all flex flex-col items-center justify-center gap-2 h-28 ${data.aid === aid ? 'bg-green-50 border-green-500 text-green-700 shadow-xl scale-105' : 'bg-white border-gray-50 text-gray-400 hover:border-green-100'}`}
                    >
                       <span className="text-[10px] font-black uppercase tracking-widest leading-none">{t(aid)}</span>
                    </button>
                 ))}
               </div>
            </div>
          )}

          {wizardStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-500 py-2">
               {loading ? (
                 <div className="flex flex-col items-center justify-center py-20 gap-4">
                   <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
                   <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">{t("Calculating Path...")}</p>
                 </div>
               ) : planningResult && (
                 <div className="flex flex-col space-y-6">
                   <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] p-6 relative shadow-sm">
                     <button onClick={() => speak(planningResult.text, language)} className="absolute top-4 right-4 p-3 bg-white text-emerald-600 rounded-full shadow-lg border border-emerald-50 hover:bg-emerald-600 hover:text-white transition-all"><Volume2 size={20} /></button>
                     <h4 className="font-black text-emerald-800 uppercase tracking-tight mb-3 flex items-center gap-2 text-sm"><ShieldCheck size={20}/> {t("Safe Route Found")}</h4>
                     <div className="text-emerald-700 text-sm font-medium leading-relaxed pr-10">
                        {/* Fix: Wrapped ReactMarkdown in a div to apply className styles */}
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{planningResult.text}</ReactMarkdown>
                        </div>
                     </div>
                   </div>
                   
                   <div className="flex flex-wrap gap-3">
                     {planningResult.links.map((link, idx) => (
                       <a key={idx} href={link.uri} target="_blank" rel="noopener noreferrer" className="bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                         <ExternalLink size={14}/> {link.title}
                       </a>
                     ))}
                     <button onClick={openInGoogleMaps} className="bg-white text-emerald-600 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2 hover:bg-emerald-600 hover:text-white transition-all shadow-sm ml-auto">
                       <MapIcon size={14} /> {t("Google Maps")}
                     </button>
                   </div>

                   <div className="h-[40vh] min-h-[300px] w-full bg-gray-50 rounded-[2.5rem] overflow-hidden border-2 border-gray-100 shadow-inner relative z-0">
                      <div ref={mapRef} className="absolute inset-0 w-full h-full" />
                      {!coords && <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 z-10"><p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Geocoding places...</p></div>}
                   </div>
                   
                   <Button variant="outline" onClick={() => { setWizardStep(1); setPlanningResult(null); setCoords(null); }} className="w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs border-2">{t("Plan Another")}</Button>
                 </div>
               )}
            </div>
          )}
        </div>

        {wizardStep < 4 && (
          <div className="flex gap-4 pt-6 border-t border-gray-50 bg-white sticky bottom-0 z-20">
            {wizardStep > 1 && <Button variant="outline" onClick={prev} className="flex-1 py-4 font-black uppercase tracking-widest rounded-2xl text-xs border-2">{t("Previous")}</Button>}
            <Button onClick={next} disabled={(wizardStep === 1 && !data.start) || (wizardStep === 2 && !data.end)} className="flex-1 py-4 font-black uppercase tracking-widest rounded-2xl shadow-lg text-white text-xs">
              {wizardStep === 3 ? t("Find Safe Route") : t("Next")}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};