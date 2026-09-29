import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, RotateCcw, Pause, Sparkles } from 'lucide-react';
import { speakConfirmation, stopSpeech } from '../utils/speechRecognition';

export default function AudioFeedbackPlayer({ 
  text, 
  language = 'en-US', 
  autoPlay = false,
  title = "Voice Audio Confirmation" 
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.95);

  useEffect(() => {
    if (autoPlay && text && !hasPlayedOnce) {
      handlePlay();
      setHasPlayedOnce(true);
    }
    return () => {
      stopSpeech();
    };
  }, [text, autoPlay]);

  const handlePlay = () => {
    if (!text) return;
    stopSpeech();
    setIsPlaying(true);

    speakConfirmation(text, language, {
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false)
    });
  };

  const handleStop = () => {
    stopSpeech();
    setIsPlaying(false);
  };

  const handleReplay = () => {
    handleStop();
    setTimeout(() => {
      handlePlay();
    }, 150);
  };

  if (!text) return null;

  return (
    <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl ${isPlaying ? 'bg-hospital-600 text-white animate-pulse' : 'bg-hospital-100 text-hospital-700'}`}>
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>{title}</span>
              <span className="text-[10px] font-semibold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full uppercase">
                {language}
              </span>
            </h4>
            <p className="text-xs text-slate-600 mt-0.5 max-w-md line-clamp-2">
              "{text}"
            </p>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center space-x-2">
          {isPlaying ? (
            <button
              type="button"
              onClick={handleStop}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePlay}
              className="flex items-center gap-1.5 px-4 py-2 bg-hospital-600 hover:bg-hospital-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Listen</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleReplay}
            title="Replay from beginning"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white/80 rounded-xl border border-slate-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Playing Visualizer Bar */}
      {isPlaying && (
        <div className="mt-3 pt-3 border-t border-sky-100 flex items-center justify-between text-xs text-hospital-700">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-3 bg-hospital-600 rounded-full animate-bounce" />
            <span className="w-1.5 h-5 bg-hospital-600 rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-4 bg-hospital-600 rounded-full animate-bounce [animation-delay:0.4s]" />
            <span className="w-1.5 h-2 bg-hospital-600 rounded-full animate-bounce [animation-delay:0.1s]" />
            <span className="ml-2 font-medium">Vocalizing clinical confirmation in patient's native tongue...</span>
          </div>
        </div>
      )}
    </div>
  );
}
