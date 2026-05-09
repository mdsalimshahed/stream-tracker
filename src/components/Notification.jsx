// src/components/Notification.jsx
import React, { useEffect, useRef } from 'react';
import { Check, AlertCircle, X } from 'lucide-react';

export const Notification = ({ message, type, onClose }) => {
  const onCloseRef = useRef(onClose);

  // Keep the ref updated with the latest onClose callback
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onCloseRef.current) {
        onCloseRef.current();
      }
    }, 3000);
    
    // Only restart the timer if the message or type changes, 
    // rather than on every render cycle.
    return () => clearTimeout(timer);
  }, [message, type]);

  const colors = type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-emerald-600' : 'bg-blue-600';

  return (
    <div className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-lg shadow-2xl text-white font-medium text-sm flex items-center gap-2 animate-in slide-in-from-right-5 duration-200 ${colors}`}>
      {type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  );
};

export const ConfirmBanner = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.stopPropagation()}
    >
      <div 
        className="rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-white/80 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button 
            onClick={(e) => { e.stopPropagation(); onCancel(); }} 
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition flex items-center gap-2 text-white"
          >
            <X size={16} /> No
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onConfirm(); }} 
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition flex items-center gap-2 text-white"
          >
            <Check size={16} /> Yes
          </button>
        </div>
      </div>
    </div>
  );
};