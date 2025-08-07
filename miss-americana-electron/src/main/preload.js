const { contextBridge, ipcRenderer, shell } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  
  // File system operations
  readFile: (path) => ipcRenderer.invoke('fs:readFile', path),
  writeFile: (path, contents) => ipcRenderer.invoke('fs:writeFile', path, contents),
  
  // Shell operations
  openExternal: (url) => ipcRenderer.invoke('shell:open', url),
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  
  // Custom IPC
  invoke: (channel, ...args) => {
    // Whitelist channels to prevent security issues
    const validChannels = [
      'fs:readFile',
      'fs:writeFile',
      'shell:open',
      'app:getVersion'
    ];
    
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    
    return Promise.reject(new Error(`Invalid channel: ${channel}`));
  },
  
  // Window management
  createWindow: (options) => ipcRenderer.invoke('window:create', options)
});

// Expose a safe version of the shell API
contextBridge.exposeInMainWorld('shell', {
  openExternal: (url) => shell.openExternal(url)
});
