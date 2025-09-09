import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The built directory structure
process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false, // Allow local file access for LLaMA
    },
    titleBarStyle: 'default',
    frame: true,
    show: false,
    backgroundColor: '#ffffff',
    title: 'Interface LLaMA Desktop',
  });

  // Load the app
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  // Show window when ready to prevent visual flash
  win.once('ready-to-show', () => {
    win?.show();
    
    // Open DevTools in development
    if (VITE_DEV_SERVER_URL) {
      win?.webContents.openDevTools();
    }
  });

  // Handle window closed
  win.on('closed', () => {
    win = null;
  });

  // Handle external links
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for LLaMA integration
ipcMain.handle('check-ollama', async () => {
  try {
    // Check if Ollama is running
    const response = await fetch('http://localhost:11434/api/tags');
    return response.ok;
  } catch (error) {
    return false;
  }
});

ipcMain.handle('start-ollama', async () => {
  try {
    // Attempt to start Ollama (Windows)
    if (process.platform === 'win32') {
      spawn('ollama', ['serve'], { 
        detached: true, 
        stdio: 'ignore',
        shell: true 
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to start Ollama:', error);
    return false;
  }
});

ipcMain.handle('show-error-dialog', async (_, title: string, content: string) => {
  if (win) {
    dialog.showErrorBox(title, content);
  }
});

ipcMain.handle('show-info-dialog', async (_, title: string, content: string) => {
  if (win) {
    return dialog.showMessageBox(win, {
      type: 'info',
      title,
      message: content,
      buttons: ['OK']
    });
  }
});

// Security: Prevent navigation to external websites
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (navigationEvent, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== VITE_DEV_SERVER_URL && !navigationUrl.startsWith('file://')) {
      navigationEvent.preventDefault();
    }
  });
});

// Prevent new window creation
app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});