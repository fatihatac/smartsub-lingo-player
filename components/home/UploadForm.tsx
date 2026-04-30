import React, { useState } from 'react';
import { FileVideo, FileText, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface UploadFormProps {
  onStart: (vid: File | Blob, sub: File | Blob, sLang: string, tLang: string, save: boolean, name: string, secSub?: File | null) => void;
  showToast: (msg: string) => void;
  videoFile: File | null;
  subtitleFile: File | null;
  secSubtitleFile: File | null;
  onSetVideoFile: (f: File) => void;
  onSetSubtitleFile: (f: File) => void;
  onSetSecSubtitleFile: (f: File) => void;
}

export const UploadForm: React.FC<UploadFormProps> = ({ 
  onStart, 
  showToast, 
  videoFile, 
  subtitleFile,
  secSubtitleFile,
  onSetVideoFile, 
  onSetSubtitleFile,
  onSetSecSubtitleFile
}) => {
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Turkish');
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSource = e.target.value;
    setSourceLang(newSource);
    if (newSource === targetLang) {
      setTargetLang(newSource === 'English' ? 'Turkish' : 'English');
    }
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTarget = e.target.value;
    setTargetLang(newTarget);
    if (newTarget === sourceLang) {
      setSourceLang(newTarget === 'Turkish' ? 'English' : 'Turkish');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'subtitle') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'video') onSetVideoFile(e.target.files[0]);
      else onSetSubtitleFile(e.target.files[0]);
      showToast(`${type === 'video' ? 'Video' : 'Subtitle'} file selected`);
    }
  };

  const handleDemoClick = async () => {
    setIsLoadingDemo(true);
    try {
      const videoRes = await fetch('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4');
      if (!videoRes.ok) throw new Error("Failed to fetch video");
      
      const videoBlob = await videoRes.blob();
      const demoVideoFile = new File([videoBlob], "demo_joyrides.mp4", { type: "video/mp4" });

      const srtContent = `1\n00:00:00,500 --> 00:00:06,000\nThe rapid advancement of artificial intelligence is reshaping the way we perceive human creativity.\n\n2\n00:00:06,500 --> 00:00:12,000\nWhile some argue that machines can only mimic existing patterns, others believe that the synergy between human intuition and algorithmic precision will lead to an unprecedented era of innovation.\n\n3\n00:00:12,500 --> 00:00:18,000\nUltimately, the challenge lies not in competing with technology, but in learning how to harness its potential to solve the complex problems of the modern world.`;
      
      const subtitleBlob = new Blob([srtContent], { type: 'text/plain' });
      const demoSubtitleFile = new File([subtitleBlob], "demo_ai_text.srt", { type: "text/plain" });

      onStart(demoVideoFile, demoSubtitleFile, "English", "Turkish", false, "Demo: AI & Creativity");
    } catch (error) {
      console.error("Failed to load demo", error);
      showToast("Failed to load demo video. Please check connection.");
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const isReady = videoFile && subtitleFile;

  return (
    <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700 h-fit">
      <div className="flex justify-between items-start mb-2">
        <h1 className="text-3xl font-bold text-white">New Session</h1>
        <button 
          onClick={handleDemoClick}
          disabled={isLoadingDemo}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-lg text-sm font-medium transition-colors border border-indigo-500/20"
        >
          {isLoadingDemo ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          Try Demo
        </button>
      </div>
      <p className="text-slate-400 mb-8">Upload local files. They will be saved for offline use.</p>

      <div className="space-y-6">
        {/* Video Input */}
        <div className="relative group">
          <label className="block text-sm font-medium text-slate-300 mb-2">Video File</label>
          <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-colors cursor-pointer ${videoFile ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'}`}>
            <FileVideo className={`w-10 h-10 mb-3 ${videoFile ? 'text-indigo-400' : 'text-slate-500'}`} />
            <div className="text-center">
              {videoFile ? (
                <span className="text-indigo-300 font-medium truncate max-w-[200px] block">{videoFile.name}</span>
              ) : (
                <span className="text-slate-400">Click to select MP4, WEBM, MKV</span>
              )}
            </div>
            <input 
              type="file" 
              accept="video/*" 
              onChange={(e) => handleFileChange(e, 'video')} 
              className="absolute inset-0 opacity-0 cursor-pointer" 
            />
          </div>
        </div>

        {/* Subtitle Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative group">
            <label className="block text-sm font-medium text-slate-300 mb-2">Primary Subtitle (.srt, .vtt)</label>
            <div className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-colors cursor-pointer text-center h-32 ${subtitleFile ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'}`}>
                <FileText className={`w-6 h-6 mb-2 ${subtitleFile ? 'text-emerald-400' : 'text-slate-500'}`} />
                {subtitleFile ? (
                    <span className="text-emerald-300 font-medium truncate max-w-[150px] text-sm block">{subtitleFile.name}</span>
                ) : (
                    <span className="text-slate-400 text-sm">Select Primary (Eng)</span>
                )}
                <input 
                type="file" 
                accept=".srt,.vtt" 
                onChange={(e) => handleFileChange(e, 'subtitle')} 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                />
            </div>
            </div>

            <div className="relative group">
            <label className="block text-sm font-medium text-slate-300 mb-2">Target Subtitle (Optional)</label>
            <div className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-colors cursor-pointer text-center h-32 ${secSubtitleFile ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'}`}>
                <FileText className={`w-6 h-6 mb-2 ${secSubtitleFile ? 'text-blue-400' : 'text-slate-500'}`} />
                {secSubtitleFile ? (
                    <span className="text-blue-300 font-medium truncate max-w-[150px] text-sm block">{secSubtitleFile.name}</span>
                ) : (
                    <span className="text-slate-400 text-sm">Select Target (Tr)</span>
                )}
                <input 
                type="file" 
                accept=".srt,.vtt" 
                onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                       onSetSecSubtitleFile(e.target.files[0]);
                       showToast('Target subtitle selected');
                    }
                }} 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                />
            </div>
            </div>
        </div>

        {/* Language Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Source Language (Altyazı Dili)</label>
            <select 
              value={sourceLang}
              onChange={handleSourceChange}
              className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="English">English</option>
              <option value="Turkish">Turkish</option>
              <option value="Spanish" disabled>Spanish (Coming Soon)</option>
              <option value="German" disabled>German (Coming Soon)</option>
              <option value="French" disabled>French (Coming Soon)</option>
              <option value="Japanese" disabled>Japanese (Coming Soon)</option>
              <option value="Korean" disabled>Korean (Coming Soon)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Target Language (Çeviri Dili)</label>
            <select 
              value={targetLang}
              onChange={handleTargetChange}
              className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Turkish">Turkish</option>
              <option value="English">English</option>
              <option value="Spanish" disabled>Spanish (Coming Soon)</option>
              <option value="German" disabled>German (Coming Soon)</option>
              <option value="French" disabled>French (Coming Soon)</option>
              <option value="Japanese" disabled>Japanese (Coming Soon)</option>
              <option value="Korean" disabled>Korean (Coming Soon)</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => isReady && onStart(videoFile!, subtitleFile!, sourceLang, targetLang, true, videoFile!.name, secSubtitleFile)}
          disabled={!isReady}
          className={`w-full py-3.5 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 transition-all ${
            isReady 
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>Start Player</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
