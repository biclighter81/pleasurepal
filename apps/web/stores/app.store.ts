import { Socket } from "socket.io-client";
import { create } from "zustand";

export type AppStore = {
  socket: Socket | null;
  isProduction: boolean;
  profileSidebar: boolean;
  setProfileSidebar: (value: boolean) => void;
  menu: boolean;
  setMenu: (value: boolean) => void;
  mobileMenuComponent: React.ReactNode | null;
  setMobileMenuComponent: (value: React.ReactNode | null) => void;
};
export const useAppStore = create<AppStore>((set, get) => ({
  socket: null,
  isProduction: process.env.NEXT_PUBLIC_IS_PRODUCTION == "true" ? true : false,
  profileSidebar: false,
  menu: false,
  mobileMenuComponent: null,
  setMobileMenuComponent: (value: React.ReactNode | null) =>
    set((state) => ({ ...state, mobileMenuComponent: value })),

  setProfileSidebar: (value: boolean) =>
    set((state) => ({ ...state, profileSidebar: value })),
  setMenu: (value: boolean) => set((state) => ({ ...state, menu: value })),
}));
