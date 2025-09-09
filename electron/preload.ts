const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  checkOllama: () => ipcRenderer.invoke('check-ollama'),
  startOllama: () => ipcRenderer.invoke('start-ollama'),
  showErrorDialog: (title: string, content: string) => 
    ipcRenderer.invoke('show-error-dialog', title, content),
  showInfoDialog: (title: string, content: string) => 
    ipcRenderer.invoke('show-info-dialog', title, content),
});