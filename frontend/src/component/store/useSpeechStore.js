import {create} from "zustand";

const useSpeechStore = create((set) => ({
  audio: null,
  blendshapes: null,
  speak: false,
  setAudio: (audio) => set({ audio }),
  setBlendshapes: (blendshapes) => set({ blendshapes }),
  setSpeak: (speak) => set({ speak }),
}));

export default useSpeechStore;

