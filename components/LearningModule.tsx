
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Share2, Printer, CheckCircle, Download, WifiOff } from 'lucide-react';
import { LearningModule, Language } from '../types';
import { generateContent } from '../services/geminiService';
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
        // Simulated offline content
        setContent(`
# ${module.title} (Offline Version)
You are currently viewing a downloaded version of this guide.

## Introduction
This is a pre-loaded guide to help you with ${module.title}. Accessing full details and updates requires an internet connection.

## Key Points
- **Point 1**: Essential safety information.
- **Point 2**: Basic steps to follow.
- **Point 3**: Local contact numbers.

## Safety Tips
Always consult with a local professional if you are unsure about technical steps.
        `);
        setLoading(false);
        return;
      }

      setLoading(true);
      const prompt = `Create a simple, easy-to-understand educational guide about "${module.title}" for a rural audience in India. 
      Structure it with: 
      1. Introduction 
      2. Benefits 
      3. Step-by-Step Guide 
      4. Safety Tips. 
      Use bolding for key terms. Keep language simple.`;
      
      const res = await generateContent(prompt, language);
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

  return (
    <div className={`min-h-screen p-6 animate-in fade-in slide-in-from-bottom-4 transition-colors duration-500 ${isOffline ? 'bg-amber-50/30' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-green-600 mb-6 transition-colors font-black uppercase tracking-widest text-[10px]">
          <ArrowLeft size={16} /> {t("Back to Portal")}
        </button>

        <div className={`bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-4 transition-all duration-500 ${isOffline ? 'border-amber-100 shadow-amber-100' : 'border-white shadow-gray-100'}`}>
          <div className={`p-10 text-white transition-colors duration-500 ${isOffline ? 'bg-amber-600' : 'bg-green-600'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 opacity-90 text-[10px] font-black uppercase tracking-widest">
                <span className="bg-white/20 px-3 py-1 rounded-full">{t("Learning Modules")}</span>
              </div>
              {isOffline && (
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <WifiOff size={14} /> {t("Offline")}
                </div>
              )}
            </div>
            <h1 className="text-4xl font-black mb-4 tracking-tighter uppercase">{module.title}</h1>
            <p className="opacity-90 font-medium text-lg leading-relaxed">{module.description}</p>
          </div>

          <div className="p-10">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-6">
                <div className={`animate-spin rounded-full h-16 w-16 border-4 border-t-transparent ${isOffline ? 'border-amber-500' : 'border-green-500'}`}></div>
                <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs animate-pulse">{t("Loading")}</p>
              </div>
            ) : (
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown 
                    components={{
                        h1: ({node, ...props}) => <h1 className={`text-3xl font-black uppercase tracking-tighter mb-8 transition-colors ${isOffline ? 'text-amber-700' : 'text-gray-900'}`} {...props} />,
                        h2: ({node, ...props}) => <h2 className={`text-xl font-black uppercase tracking-tight mt-10 mb-4 flex items-center gap-3 transition-colors ${isOffline ? 'text-amber-600' : 'text-green-700'}`} {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-3 text-gray-600 font-medium" {...props} />,
                        li: ({node, ...props}) => <li className="pl-2" {...props} />,
                        p: ({node, ...props}) => <p className="text-gray-500 leading-[1.8] mb-6 font-medium" {...props} />,
                        strong: ({node, ...props}) => <strong className={`font-black uppercase tracking-wide ${isOffline ? 'text-amber-800' : 'text-gray-900'}`} {...props} />,
                    }}
                >
                    {content}
                </ReactMarkdown>
              </div>
            )}
          </div>

          <div className="bg-gray-50/50 p-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-6">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("Generated by AI")}</span>
             <div className="flex gap-6">
                <button 
                    onClick={handleDownload}
                    className="flex items-center gap-2 text-green-700 hover:text-green-800 transition-colors font-black uppercase tracking-widest text-[10px]"
                >
                    {downloaded ? <CheckCircle size={16} className="text-green-600"/> : <Download size={16}/>} 
                    {downloaded ? t("Downloaded") : t("Save for Offline")}
                </button>
                <button className="flex items-center gap-2 text-gray-400 hover:text-green-600 transition-colors font-black uppercase tracking-widest text-[10px] hidden sm:flex"><Printer size={16}/> {t("Print")}</button>
                <button className="flex items-center gap-2 text-gray-400 hover:text-green-600 transition-colors font-black uppercase tracking-widest text-[10px] hidden sm:flex"><Share2 size={16}/> {t("Share")}</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
