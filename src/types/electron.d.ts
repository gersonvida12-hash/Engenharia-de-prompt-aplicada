// Define the API shape for TypeScript
declare global {
  interface Window {
    electronAPI?: {
      checkOllama: () => Promise<boolean>;
      startOllama: () => Promise<boolean>;
      showErrorDialog: (title: string, content: string) => Promise<void>;
      showInfoDialog: (title: string, content: string) => Promise<any>;
    };
  }
}

export {};