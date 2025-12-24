import React, { useState, useEffect } from 'react';
import { Modal, Input, Button } from './Shared';
import { generateContent } from '../services/geminiService';
import { MapPin, User, Briefcase, GraduationCap, Mic, Volume2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Language } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

// --- Resume Builder ---
export const ResumeModal: React.FC<{ isOpen: boolean; onClose: () => void; language: Language }> = ({ isOpen, onClose, language }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ name: '', location: '', skills: '', experience: '', education: '' });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const generateResume = async () => {
    setLoading(true);
    const prompt = `Create a professional resume summary for a rural worker based on this info: Name: ${data.name}, Location: ${data.location}, Skills: ${data.skills}, Experience: ${data.experience}, Education: ${data.education}. Format nicely with sections.`;
    const res = await generateContent(prompt, language);
    setResult(res);
    setLoading(false);
    setStep(1);
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setStep(0); setResult(''); }} title={t("Smart Resume Builder")}>
      {step === 0 ? (
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">{t("Resume Description")}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t("Full Name")} placeholder="" value={data.name} onChange={e => setData({...data, name: e.target.value})} icon={<User size={16}/>} />
            <Input label={t("Village / City")} placeholder="" value={data.location} onChange={e => setData({...data, location: e.target.value})} />
          </div>
          <Input label={t("Skills")} placeholder="" value={data.skills} onChange={e => setData({...data, skills: e.target.value})} />
          <Input label={t("Work Experience")} placeholder="" value={data.experience} onChange={e => setData({...data, experience: e.target.value})} />
          <Input label={t("Education")} placeholder="" value={data.education} onChange={e => setData({...data, education: e.target.value})} />
          <div className="pt-4">
            <Button onClick={generateResume} isLoading={loading} className="w-full">{t("Generate")}</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm whitespace-pre-wrap font-mono">
            {result}
          </div>
          <div className="flex gap-3">
             <Button variant="outline" onClick={() => setStep(0)} className="flex-1">{t("Edit Details")}</Button>
             <Button onClick={onClose} className="flex-1">{t("Download PDF")}</Button>
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
  const { t } = useLanguage();

  const findSchemes = async () => {
    setLoading(true);
    const prompt = `List 3 specific Indian government schemes for a ${data.age} year old ${data.gender} working as ${data.occupation} in ${data.state} with income ₹${data.income}. Return as a concise bulleted list.`;
    const res = await generateContent(prompt, language);
    setResult(res);
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setResult(null); }} title={t("Scheme Matcher")}>
       {!result ? (
         <div className="space-y-4">
           <p className="text-gray-600">{t("Scheme Description")}</p>
           <div className="grid grid-cols-2 gap-4">
             <Input label={t("Age")} type="number" placeholder="" value={data.age} onChange={e => setData({...data, age: e.target.value})} />
             <div className="flex flex-col gap-1">
               <label className="text-sm font-medium text-gray-700">{t("Gender")}</label>
               <select className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" value={data.gender} onChange={e => setData({...data, gender: e.target.value})}>
                 <option value="Male">Male</option>
                 <option value="Female">Female</option>
                 <option value="Other">Other</option>
               </select>
             </div>
           </div>
           <Input label={t("Occupation")} placeholder="" value={data.occupation} onChange={e => setData({...data, occupation: e.target.value})} />
           <Input label={t("Income")} placeholder="" value={data.income} onChange={e => setData({...data, income: e.target.value})} />
           <Input label={t("State / District")} placeholder="" value={data.state} onChange={e => setData({...data, state: e.target.value})} />
           <Button onClick={findSchemes} isLoading={loading} className="w-full mt-2">{t("Find My Schemes")}</Button>
         </div>
       ) : (
         <div className="space-y-4">
           <h3 className="font-semibold text-green-700">{t("Recommended")}:</h3>
           <div className="bg-green-50 p-4 rounded-lg text-gray-800 text-sm whitespace-pre-line">
             {result}
           </div>
           <Button onClick={() => setResult(null)} variant="outline" className="w-full">{t("Search Again")}</Button>
         </div>
       )}
    </Modal>
  );
};

// --- Mobility Planner ---
export const MobilityModal: React.FC<{ isOpen: boolean; onClose: () => void; language: Language }> = ({ isOpen, onClose, language }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ start: '', end: '', aid: 'None', time: '' });
  const { t } = useLanguage();

  const handleSearch = () => {
    setStep(1);
    setTimeout(() => setStep(2), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setStep(0); }} title={t("Mobility Planner")}>
      {step === 0 && (
        <div className="space-y-5">
           <p className="text-gray-600">{t("Mobility Description")}</p>
           <Input label={t("Start Location")} placeholder="" value={data.start} onChange={e => setData({...data, start: e.target.value})} icon={<MapPin size={16}/>} />
           <Input label={t("Destination")} placeholder="" value={data.end} onChange={e => setData({...data, end: e.target.value})} />
           <div className="grid grid-cols-2 gap-4">
             <div className="flex flex-col gap-1">
               <label className="text-sm font-medium text-gray-700">{t("Mobility Aid")}</label>
               <select className="px-4 py-2 border border-gray-300 rounded-lg" value={data.aid} onChange={e => setData({...data, aid: e.target.value})}>
                 <option value="None">None</option>
                 <option value="Wheelchair">Wheelchair</option>
                 <option value="Walking Stick">Walking Stick</option>
                 <option value="Crutches">Crutches</option>
               </select>
             </div>
             <Input label={t("Time")} type="time" value={data.time} onChange={e => setData({...data, time: e.target.value})} />
           </div>
           <Button onClick={handleSearch} className="w-full">{t("Find Safe Route")}</Button>
        </div>
      )}
      {step === 1 && (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-600">{t("Loading")}</p>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
             <ShieldCheck className="text-green-600 shrink-0 mt-1" />
             <div>
               <h4 className="font-bold text-green-800">Safe Route Found</h4>
               <p className="text-sm text-green-700 mt-1">This route is paved and well-lit. Avoids the rocky path near the canal.</p>
             </div>
          </div>
          <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
             [Map Visualization Placeholder]
          </div>
          <div className="flex justify-between items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
             <span>Est. Time: <strong>15 mins</strong></span>
             <span>Distance: <strong>1.2 km</strong></span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)} className="flex-1">{t("Plan Another")}</Button>
            <Button onClick={onClose} className="flex-1">{t("Close")}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
