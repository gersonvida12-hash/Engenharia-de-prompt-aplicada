"use strict";
const { contextBridge, ipcRenderer } = require('electron');
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    checkOllama: () => ipcRenderer.invoke('check-ollama'),
    startOllama: () => ipcRenderer.invoke('start-ollama'),
    showErrorDialog: (title, content) => ipcRenderer.invoke('show-error-dialog', title, content),
    showInfoDialog: (title, content) => ipcRenderer.invoke('show-info-dialog', title, content),
});
