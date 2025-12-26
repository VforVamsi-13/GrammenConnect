
import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost', isLoading?: boolean }> = ({ 
  children, className = '', variant = 'primary', isLoading, ...props 
}) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg",
    secondary: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
    outline: "border-2 border-green-500 text-green-600 hover:bg-green-50",
    ghost: "text-gray-600 hover:bg-gray-100"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string; icon?: React.ReactNode; rightIcon?: React.ReactNode }> = ({ label, icon, rightIcon, className = '', ...props }) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}
      <input 
        className={`px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all w-full ${icon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`}
        {...props}
      />
      {rightIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {rightIcon}
        </div>
      )}
    </div>
  </div>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string }> = ({ 
  isOpen, onClose, title, children, maxWidth = "max-w-2xl"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            {title}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''} ${className}`}
  >
    {children}
  </div>
);
