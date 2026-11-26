import React, { createContext, useContext, useState } from 'react';
import { Howl } from 'howler';
import clickSound from '../assets/audio/click.mp3';

const AudioContext = createContext(null);
const clique = new Howl({ src: [clickSound], volume: 0.5, preload: false });

export function AudioProvider({ children }) {
  const [isMuted, setIsMuted] = useState(true);
  const toggleMute = () => {
    if (!isMuted) clique.stop();
    setIsMuted(!isMuted);
  };
  const playClick = () => { if (!isMuted) clique.play(); };

  return <AudioContext.Provider value={{ isMuted, toggleMute, playClick }}>{children}</AudioContext.Provider>;
}

export const useAudio = () => useContext(AudioContext);
