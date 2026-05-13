// src/components/Header.jsx
import React from 'react';
import { Clock, BookOpen, Plus, Settings, Upload, Download, BarChart3 } from 'lucide-react';

export default function Header({ currentView, onViewChange, onImport, onExport }) {
  const fileInputRef = React.useRef(null);

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        onImport(json);
      } catch (err) {
        console.error('Invalid JSON file', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="sticky top-0 z-40 bg-transparent pointer-events-none border-b border-white/5 shrink-0 w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3 w-full">
        
        {/* Left Side Glass Pod (Mobile Title + Actions) */}
        <div className="pointer-events-auto w-full md:w-auto bg-black/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/10 px-4 py-2 flex justify-between items-center shrink-0">
          <button onClick={() => onViewChange('library')} className="flex items-center gap-2.5 hover:opacity-80 transition">
            <img src="/favicon.svg" alt="StreamTracker Logo" className="w-7 h-7 drop-shadow-md" />
            <h1 className="text-lg font-semibold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              StreamTracker
            </h1>
          </button>

          {/* Mobile Import/Export Icons */}
          <div className="flex md:hidden items-center gap-2">
            <button onClick={handleImportClick} className="p-1.5 bg-white/5 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition" title="Import">
              <Download size={16} />
            </button>
            <button onClick={onExport} className="p-1.5 bg-white/5 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition" title="Export">
              <Upload size={16} />
            </button>
          </div>
        </div>

        {/* Right Side Glass Pod (Wrapping Nav) */}
        <div className="pointer-events-auto w-full md:w-auto max-w-full bg-black/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/10 p-2 flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-3">
          
          {/* Desktop Import/Export */}
          <div className="hidden md:flex items-center justify-center gap-2 px-2 sm:border-r border-white/10 shrink-0">
            <button
              onClick={handleImportClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-white/5 hover:bg-white/10 transition text-white/80 hover:text-white whitespace-nowrap"
            >
              <Download size={14} /> Import
            </button>
            <button
              onClick={onExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-white/5 hover:bg-white/10 transition text-white/80 hover:text-white whitespace-nowrap"
            >
              <Upload size={14} /> Export
            </button>
          </div>

          {/* Wrapping Nav for all screens */}
          <nav className="flex flex-wrap justify-center items-center w-full gap-1.5 sm:gap-2">
            {[
              { id: 'dashboard', label: 'History', icon: Clock },
              { id: 'library', label: 'Library', icon: BookOpen },
              { id: 'search', label: 'Add', icon: Plus },
              { id: 'data', label: 'Styles', icon: Settings },
              { id: 'stats', label: 'Stats', icon: BarChart3 },
              { id: 'insights', label: 'Insights', icon: BarChart3 } // <-- ADD THIS LINE
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onViewChange(id)}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  currentView === id
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
      </div>
    </header>
  );
}