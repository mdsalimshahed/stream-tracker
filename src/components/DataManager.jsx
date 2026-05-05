import React from 'react';
import { Upload, Download } from 'lucide-react';

const DataManager = ({ streamData, setStreamData }) => {
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        setStreamData(json);
      } catch (err) { alert("Error."); }
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    const dataStr = JSON.stringify(streamData, null, 4);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "livestream_info.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto mt-12 px-4 animate-in fade-in font-arial h-full overflow-y-auto custom-scrollbar pb-32">
      <div className="bg-slate-900 border border-slate-800 p-12 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-10 text-center">Storage Center</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <label className="cursor-pointer group flex-1">
            <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
            <div className="bg-slate-800 border border-slate-700 p-12 flex flex-col items-center justify-center hover:bg-blue-600 transition-all">
              <Upload className="text-blue-400 mb-2 h-10 w-10 group-hover:text-white" />
              <span className="text-sm font-bold text-blue-400 group-hover:text-white">Import JSON</span>
            </div>
          </label>
          <button onClick={handleDownload} className="flex-1">
            <div className="bg-slate-800 border border-slate-700 p-12 flex flex-col items-center justify-center hover:bg-emerald-600 transition-all h-full">
              <Download className="text-emerald-400 mb-2 h-10 w-10" />
              <span className="text-sm font-bold text-emerald-400">Export JSON</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataManager;
