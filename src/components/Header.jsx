import React from 'react';
import { Video, Clock, BookOpen, Plus, Database } from 'lucide-react';

const NavButton = ({ view, current, onClick, icon, label }) => {
  const active = current === view;
  return (
    <button 
      onClick={() => onClick(view)}
      className={`px-5 py-2 text-xs font-bold transition-all flex items-center gap-2 ${active ? 'bg-slate-700 text-white shadow-inner ring-1 ring-slate-600' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
    >
      {icon} <span>{label}</span>
    </button>
  );
};

const Header = ({ currentView, onViewChange }) => (
  <header className="bg-slate-900 text-white p-5 shadow-md border-b border-slate-800 sticky top-0 z-40 font-arial">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className="bg-purple-600 p-2 shadow-lg">
          <Video size={20} className="text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">StreamManager</h1>
      </div>
      
      <div className="flex flex-wrap items-center justify-center gap-1 bg-slate-800 p-1 border border-slate-700">
        <NavButton view="dashboard" current={currentView} onClick={onViewChange} icon={<Clock size={16}/>} label="History" />
        <NavButton view="library" current={currentView} onClick={onViewChange} icon={<BookOpen size={16}/>} label="Library" />
        <NavButton view="search" current={currentView} onClick={onViewChange} icon={<Plus size={16}/>} label="Add Game" />
        <NavButton view="data" current={currentView} onClick={onViewChange} icon={<Database size={16}/>} label="Storage" />
      </div>
    </div>
  </header>
);

export default Header;