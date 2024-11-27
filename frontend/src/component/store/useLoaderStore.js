import {create }from "zustand";

const useLoaderStore = create((set) => ({
  isLoading: true,
  setLoading: (loading) => set({ isLoading: loading }),
}));

export default useLoaderStore;
