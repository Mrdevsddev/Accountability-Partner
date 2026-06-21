// D:/Accountiblity partner/src/renderer/global.d.ts
export interface IElectronAPI {
  unlockApp: () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
