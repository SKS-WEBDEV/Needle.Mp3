"use client";
import { CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';

export default function DownloadProgress({ downloadState, onClose }) {
    if (!downloadState) return null;

    const { songName, progress, status, error } = downloadState;

    return (
        <div className="fixed bottom-24 right-6 z-50 w-80 p-4 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white truncate max-w-[200px]">
                    {songName || 'Downloading...'}
                </span>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition">
                    <X size={16} />
                </button>
            </div>

            {status === 'downloading' && (
                <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="flex items-center gap-1.5">
                            <Loader2 size={12} className="animate-spin text-indigo-400" /> Downloading MP3...
                        </span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                            className="bg-indigo-500 h-full transition-all duration-200" 
                            style={{ width: `${progress}%` }} 
                        />
                    </div>
                </div>
            )}

            {status === 'completed' && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 size={16} />
                    <span>Download complete!</span>
                </div>
            )}

            {status === 'error' && (
                <div className="flex items-center gap-2 text-xs text-red-400 font-medium">
                    <AlertCircle size={16} />
                    <span>{error || 'Download failed'}</span>
                </div>
            )}
        </div>
    );
}
