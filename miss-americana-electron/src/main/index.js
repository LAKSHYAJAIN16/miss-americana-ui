const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');
const { version } = require('../../package.json');

const execAsync = promisify(exec);

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

const createWindow = () => {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    frame: false, // Matches Tauri's undecorated window
    show: false, // Don't show until ready-to-show
  });

  // Load the index.html file
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    // Open the DevTools in development mode
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Show window when ready to prevent flickering
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize(); // Match Tauri's maximized window
    mainWindow.show();
  });

  // Handle window controls via IPC
  ipcMain.on('window:minimize', () => {
    mainWindow.minimize();
  });

  ipcMain.on('window:maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on('window:close', () => {
    mainWindow.close();
  });
};

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('fs:readFile', async (_, path) => {
  try {
    return await fs.readFile(path, 'utf-8');
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
});

ipcMain.handle('fs:writeFile', async (_, path, contents) => {
  try {
    await fs.mkdir(path.dirname(path), { recursive: true });
    await fs.writeFile(path, contents);
    return true;
  } catch (error) {
    console.error('Error writing file:', error);
    throw error;
  }
});

ipcMain.handle('shell:open', (_, url) => {
  shell.openExternal(url);
});

ipcMain.handle('app:getVersion', () => {
  return version;
});

// Command execution handler
ipcMain.handle('command:execute', async (_, { command, args = [], options = {} }) => {
  try {
    const commandStr = [command, ...args].map(arg => 
      arg.includes(' ') ? `"${arg}"` : arg
    ).join(' ');
    
    const { stdout, stderr } = await execAsync(commandStr, {
      ...options,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024 // 10MB
    });
    
    return {
      code: 0,
      stdout: stdout || '',
      stderr: stderr || ''
    };
  } catch (error) {
    return {
      code: error.code || 1,
      stdout: error.stdout || '',
      stderr: error.stderr || error.message
    };
  }
});

// File system operations
ipcMain.handle('fs:exists', async (_, filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('fs:readFile', async (_, filePath) => {
  return await fs.readFile(filePath, 'utf-8');
});

ipcMain.handle('fs:writeFile', async (_, filePath, contents) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents, 'utf-8');
  return true;
});

// Application paths
ipcMain.handle('app:getPath', (_, name) => {
  const paths = {
    home: app.getPath('home'),
    appData: app.getPath('appData'),
    userData: app.getPath('userData'),
    temp: app.getPath('temp'),
    desktop: app.getPath('desktop'),
    documents: app.getPath('documents'),
    downloads: app.getPath('downloads'),
    music: app.getPath('music'),
    pictures: app.getPath('pictures'),
    videos: app.getPath('videos'),
    logs: app.getPath('logs')
  };
  
  return paths[name] || app.getPath('userData');
});

// Shell operations
ipcMain.handle('shell:open', (_, url) => {
  return shell.openExternal(url);
});

// Handle any other window creation from renderer
ipcMain.handle('window:create', (_, options) => {
  const win = new BrowserWindow({
    ...options,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  });
  
  if (options.url) {
    win.loadURL(options.url);
  }
  
  return win.id;
});
