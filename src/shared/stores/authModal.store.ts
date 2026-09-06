import { create } from "zustand";
type Mode = "login" | "signup";
export const useAuthModal = create<{
  isOpen: boolean;
  mode: Mode;
  openLogin: () => void;
  openSignup: () => void;
  close: () => void;
}>((set) => ({
  isOpen: false,
  mode: "login",
  openLogin: () => set({ isOpen: true, mode: "login" }),
  openSignup: () => set({ isOpen: true, mode: "signup" }),
  close: () => set({ isOpen: false }),
}));
