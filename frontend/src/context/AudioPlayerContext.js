import React, { createContext, useContext, useRef, useCallback } from "react";

const AudioPlayerContext = createContext(null);

export function AudioPlayerProvider({ children }) {
  // Tracks the currently playing audio element
  const currentAudioRef = useRef(null);

  // Call this when a new audio starts playing.
  // It stops whichever audio was previously playing.
  const registerPlay = useCallback((audioEl) => {
    if (currentAudioRef.current && currentAudioRef.current !== audioEl) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }
    currentAudioRef.current = audioEl;
  }, []);

  const unregister = useCallback((audioEl) => {
    if (currentAudioRef.current === audioEl) {
      currentAudioRef.current = null;
    }
  }, []);

  return (
    <AudioPlayerContext.Provider value={{ registerPlay, unregister }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  return useContext(AudioPlayerContext);
}
