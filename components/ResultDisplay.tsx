import React from 'react';

interface ResultDisplayProps {
  generatedImageUrl: string;
  onRestart: () => void;
  onUploadNew: () => void;
  onRegenerate: () => void;
  disabled?: boolean;
  error?: string | null;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ generatedImageUrl, onRestart, onUploadNew, onRegenerate, disabled = false, error }) => {
  return (
    <div className="w-full max-w-4xl flex flex-col items-center">
       <h2 className="text-3xl font-bold text-center mb-2 text-cyan-300">Your Generated View</h2>
       {error && <p className="text-red-400 mb-4 font-semibold text-center">{error}</p>}
      <div className="w-full aspect-video bg-black rounded-lg overflow-hidden mb-6 shadow-2xl shadow-purple-500/30">
        <img src={generatedImageUrl} alt="Generated street view" className="w-full h-full object-contain" />
      </div>
      <div className="flex items-center space-x-4">
        <button onClick={onUploadNew} disabled={disabled} className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          Upload a New Map
        </button>
        <button onClick={onRestart} disabled={disabled} className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          Try a Different Spot
        </button>
        <button onClick={onRegenerate} disabled={disabled} className="px-8 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
          Regenerate
        </button>
      </div>
    </div>
  );
};

export default ResultDisplay;