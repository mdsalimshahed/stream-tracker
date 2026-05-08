import React from 'react';
import { Video, Clock, BookOpen, Plus, Settings, Upload, Download, BarChart3 } from 'lucide-react';

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
        alert('Library imported successfully');
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="sticky top-0 z-40 bg-transparent pointer-events-none border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        
        {/* Left Side Glass Pod */}
        <div className="pointer-events-auto bg-black/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/10 px-4 py-2">
          <button onClick={() => onViewChange('library')} className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-1.5 rounded-lg shadow-md">
              <Video size={16} className="text-white" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              StreamTracker
            </h1>
          </button>
        </div>

        {/* Right Side Glass Pod */}
        <div className="pointer-events-auto bg-black/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/10 px-4 py-1.5 flex items-center gap-3">
          <button
            onClick={handleImportClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-white/5 hover:bg-white/10 transition text-white/80 hover:text-white"
            title="Import backup (JSON)"
          >
            <Download size={14} /> Import
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-white/5 hover:bg-white/10 transition text-white/80 hover:text-white"
            title="Export all data as JSON"
          >
            <Upload size={14} /> Export
          </button>

          <nav className="flex gap-1 ml-2 border-l border-white/10 pl-3">
            {[
              { id: 'dashboard', label: 'History', icon: Clock },
              { id: 'library', label: 'Library', icon: BookOpen },
              { id: 'search', label: 'Add Game', icon: Plus },
              { id: 'data', label: 'Styles', icon: Settings },
              { id: 'stats', label: 'Stats', icon: BarChart3 }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onViewChange(id)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  currentView === id
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-white/50 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
      </div>
    </header>
  );
}