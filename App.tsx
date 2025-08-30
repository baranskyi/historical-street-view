import React, { useState, useCallback } from 'react';
import { AppState } from './types';
import FileUpload from './components/FileUpload';
import MapMarker from './components/MapMarker';
import ResultDisplay from './components/ResultDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import { generateStreetView } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [lastMergedImage, setLastMergedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setMapImageUrl(result);
        setAppState(AppState.MARKING);
        setError(null);
        setGeneratedImageUrl(null);
      } else {
        setError('Failed to read the image file.');
      }
    };
    reader.onerror = () => {
      setError('Error reading file.');
    };
    reader.readAsDataURL(file);
  }, []);
  
  const handleGenerationStart = useCallback(async (mergedImageBase64: string) => {
    setLastMergedImage(mergedImageBase64);
    setAppState(AppState.GENERATING);
    setError(null);
    try {
      const generatedImage = await generateStreetView(mergedImageBase64);
      if (generatedImage) {
        setGeneratedImageUrl(generatedImage);
        setAppState(AppState.RESULT);
      } else {
        throw new Error('The AI model did not return an image. Please try again.');
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate view: ${errorMessage}`);
      setAppState(AppState.MARKING); 
    }
  }, []);

  const handleRegenerate = useCallback(async () => {
    if (!lastMergedImage) {
      setError("Cannot regenerate, previous image data is missing. Please try marking a spot again.");
      setAppState(AppState.MARKING);
      return;
    }
    setAppState(AppState.GENERATING);
    setError(null);
    try {
      const generatedImage = await generateStreetView(lastMergedImage);
      if (generatedImage) {
        setGeneratedImageUrl(generatedImage);
        setAppState(AppState.RESULT);
      } else {
        throw new Error('The AI model did not return an image. Please try again.');
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to regenerate view: ${errorMessage}`);
      setAppState(AppState.RESULT);
    }
  }, [lastMergedImage]);

  const handleRestart = useCallback(() => {
    setGeneratedImageUrl(null);
    setError(null);
    setAppState(AppState.MARKING);
  }, []);

  const handleUploadNew = useCallback(() => {
    setMapImageUrl(null);
    setGeneratedImageUrl(null);
    setLastMergedImage(null);
    setError(null);
    setAppState(AppState.UPLOAD);
  }, []);

  const renderContent = () => {
    switch (appState) {
      case AppState.UPLOAD:
        return <FileUpload onFileUpload={handleFileUpload} />;
      case AppState.MARKING:
        if (mapImageUrl) {
          return <MapMarker mapImageUrl={mapImageUrl} onGenerate={handleGenerationStart} error={error} onUploadNew={handleUploadNew} />;
        }
        return <FileUpload onFileUpload={handleFileUpload} />; // Fallback
      case AppState.GENERATING:
        if (generatedImageUrl) { // Regeneration case
          return (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
               <ResultDisplay 
                  generatedImageUrl={generatedImageUrl} 
                  onRestart={() => {}} 
                  onUploadNew={() => {}} 
                  onRegenerate={() => {}}
                  disabled={true} 
                />
               <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-20">
                  <LoadingSpinner />
                  <p className="text-white text-xl mt-4 animate-pulse">Regenerating your view...</p>
               </div>
            </div>
          );
        }
        return ( // Initial generation case
          <div className="relative w-full h-full flex flex-col items-center justify-center">
             {mapImageUrl && <MapMarker mapImageUrl={mapImageUrl} onGenerate={() => {}} disabled={true} error={null} onUploadNew={()=>{}} />}
             <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-20">
                <LoadingSpinner />
                <p className="text-white text-xl mt-4 animate-pulse">Generating your street view...</p>
             </div>
          </div>
        );
      case AppState.RESULT:
        if (generatedImageUrl) {
          return <ResultDisplay generatedImageUrl={generatedImageUrl} onRestart={handleRestart} onUploadNew={handleUploadNew} onRegenerate={handleRegenerate} error={error}/>;
        }
        return <p>Something went wrong.</p>; // Fallback
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 font-sans">
      <header className="w-full max-w-5xl text-center my-6">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-500">
          Historical Street View Generator
        </h1>
        <p className="text-gray-400 mt-2">Bring your maps to life with AI.</p>
      </header>
      <main className="w-full max-w-5xl flex-grow flex items-center justify-center">
        {renderContent()}
      </main>
      <footer className="w-full max-w-5xl text-center py-4 text-gray-500">
        <p>
          Made by{' '}
          <a
            href="https://t.me/denissexy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Denis Sexy IT
          </a>
        </p>
      </footer>
    </div>
  );
};

export default App;