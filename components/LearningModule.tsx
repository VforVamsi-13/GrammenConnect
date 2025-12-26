
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Share2, Printer, CheckCircle, Download, WifiOff, Volume2 } from 'lucide-react';
import { LearningModule, Language } from '../types';
import { generateContent } from '../services/geminiService';
import { speak } from '../services/speechService';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../contexts/LanguageContext';
import { simulateDownload } from './ServiceModals';

interface Props {
  module: LearningModule;
  onBack: () => void;
  language: Language;
  isOffline?: boolean;
}

export const LearningViewer: React.FC<Props> = ({ module, onBack, language, isOffline }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [downloaded, setDownloaded] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchContent = async () => {
      if (isOffline) {
        setContent(`
# ${module.title} (Offline Version)
You are currently viewing a downloaded version.

## Key Points
- Essential safety information.
- Basic steps to follow.
- Local contact numbers.
        `);
        setLoading(false);
        return;
      }
      setLoading(true);
      const prompt = `Create a high-quality, comprehensive educational guide about "${module.title}" for a rural Indian audience. 
      Use Markdown formatting. Use # for Title, ## for Sections.
      Include Introduction, Benefits, Steps, and Safety Tips.
      Structure it with these sections:
      - # ${module.title}
      - ## Introduction
      - ## Guide
      - ## Precautions`;
      const res = await generateContent(prompt, language, "Expert Educator. Perfect markdown.");
      setContent(res);
      setLoading(false);
    };
    fetchContent();
  }, [module, language, isOffline]);

  const handleDownload = () => {
      simulateDownload(`${module.title.replace(/\s+/g, '_')}.txt`, content);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
  };

  const handleSpeak = () => {
    const textToSpeak = `${module.title}. ${content.replace(/[#*`]/g, '')}`;
    speak(textToSpeak, language);
  };

  return (
    <div className={`min-h-screen p-6 animate-in fade-in transition-colors duration-500 ${isOffline ? 'bg-amber-50/30' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-green-600 mb-6 transition-colors font-black uppercase tracking-widest text-[10px]">
          <ArrowLeft size={16} /> {t("Back to Portal")}
        </button>

        <div className={`bg-white rounded-[3rem] shadow-2xl overflow-hidden border-4 transition-all duration-500 ${isOffline ? 'border-amber-100 shadow-amber-100' : 'border-white shadow-gray-100'}`}>
          <div className={`p-12 text-white transition-colors duration-500 relative ${isOffline ? 'bg-amber-600' : 'bg-green-600'}`}>
            <button onClick={handleSpeak} className="absolute top-10 right-10 p-4 bg-white/20 hover:bg-white/40 rounded-full transition-all text-white"><Volume2 size={24} /></button>
            <div className="flex items-center gap-3 opacity-90 text-[10px] font-black uppercase tracking-widest mb-4">
              <span className="bg-white/20 px-3 py-1 rounded-full">{t("Learning Modules")}</span>
              {isOffline && <span className="bg-white/20 px-3 py-1 rounded-full flex items-center gap-2"><WifiOff size={14} /> {t("Offline")}</span>}
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tighter uppercase">{module.title}</h1>
            <p className="opacity-90 font-medium text-lg leading-relaxed max-w-2xl">{module.description}</p>
          </div>

          <div className="p-12">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-6">
                <div className={`animate-spin rounded-full h-16 w-16 border-4 border-t-transparent ${isOffline ? 'border-amber-500' : 'border-green-500'}`}></div>
                <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs animate-pulse">{t("Generating Content...")}</p>
              </div>
            ) : (
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown 
                    components={{
                        h1: ({node, ...props}) => <h1 className={`text-4xl font-black uppercase tracking-tighter mb-10 transition-colors ${isOffline ? 'text-amber-700' : 'text-gray-900'}`} {...props} />,
                        h2: ({node, ...props}) => <h2 className={`text-2xl font-black uppercase tracking-tight mt-12 mb-6 flex items-center gap-3 transition-colors ${isOffline ? 'text-amber-600' : 'text-green-700'}`} {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-4 text-gray-600 font-medium" {...props} />,
                        p: ({node, ...props}) => <p className="text-gray-500 leading-relaxed mb-6 font-medium text-lg" {...props} />,
                    }}
                >
                    {content}
                </ReactMarkdown>
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-8 border-t border-gray-100 flex justify-between items-center">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("Generated by AI")}</span>
             <button onClick={handleDownload} className="flex items-center gap-2 text-green-700 hover:text-green-800 transition-colors font-black uppercase tracking-widest text-[10px]">
                {downloaded ? <CheckCircle size={16} className="text-green-600"/> : <Download size={16}/>} 
                {downloaded ? t("Saved") : t("Save for Offline")}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
