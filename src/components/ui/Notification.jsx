import React, { useEffect } from 'react';
import { AlertCircle, Check } from 'lucide-react';

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-emerald-600' : 'bg-blue-600';

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded shadow-2xl text-white font-bold text-sm flex items-center gap-4 animate-in slide-in-from-top duration-300 ${colors} font-arial`}>
       {type === 'success' ? <Check size={20}/> : <AlertCircle size={20}/>}
       {message}
    </div>
  );
};