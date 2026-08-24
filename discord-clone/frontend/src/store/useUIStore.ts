import { create } from 'zustand';

type ModalType = 
  | 'createServer'
  | 'createChannel'
  | 'screenShare'
  | 'userSettings'
  | 'serverSettings'
  | 'userProfile'
  | null;

interface UIState {
  activeModal: ModalType;
  modalData: any; // Para guardar dados do modal aberto (ex: qual usuário clicou no userProfile)
  
  openModal: (type: ModalType, data?: any) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeModal: null,
  modalData: null,

  openModal: (type, data = null) => set({ activeModal: type, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
}));
