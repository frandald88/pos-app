// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const startUrl = app.isPackaged
    ? `file://${path.join(__dirname, 'frontend', 'build', 'index.html')}`
    : 'http://localhost:3000';

  mainWindow.loadURL(startUrl);

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (backendProcess) backendProcess.kill();
  });
}

app.whenReady().then(() => {
  // Lanzar backend
  backendProcess = spawn('node', ['backend/server.js'], {
    stdio: 'inherit',
    shell: true,
    env: process.env,  // ✅ Mantiene acceso a las variables del sistema
  });

  backendProcess.on('error', (err) => {
    console.error('Error al iniciar backend:', err);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (backendProcess) backendProcess.kill();
    app.quit();
  }
});
