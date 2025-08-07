/**
 * Tauri Compatibility Layer for Electron
 * Provides drop-in replacements for Tauri APIs
 */

// File System
export const BaseDirectory = {
  Audio: 'audio',
  App: 'app',
  Config: 'config',
  Data: 'data'
};

export const fs = {
  async readTextFile(path, options = {}) {
    const fullPath = await window.electronAPI.invoke('fs:resolvePath', { path, dir: options.dir || BaseDirectory.App });
    return window.electronAPI.readFile(fullPath);
  },
  
  async writeTextFile(path, contents, options = {}) {
    const fullPath = await window.electronAPI.invoke('fs:resolvePath', { 
      path, 
      dir: options.dir || BaseDirectory.App 
    });
    return window.electronAPI.writeFile(fullPath, contents);
  },
  
  readFile: (path, options) => this.readTextFile(path, options),
  writeFile: (path, contents, options) => this.writeTextFile(path, contents, options)
};

// HTTP Client
export const http = {
  async fetch(url, options = {}) {
    const response = await fetch(url, options);
    return {
      ok: response.ok,
      status: response.status,
      json: () => response.json(),
      text: () => response.text()
    };
  }
};

// Shell
export const shell = {
  open: (url) => window.electronAPI.openExternal(url),
  
  Command: class Command {
    constructor(command, args = []) {
      this.command = command;
      this.args = Array.isArray(args) ? args : [args];
    }
    
    async execute() {
      const result = await window.electronAPI.invoke('command:execute', {
        command: this.command,
        args: this.args
      });
      
      return {
        code: result.code,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }
  }
};

// App Info
export const app = {
  getVersion: () => window.electronAPI.getAppVersion(),
  getName: () => 'Miss Americana'
};

// Window Management
export const window = {
  getCurrent: () => ({
    minimize: () => window.electronAPI.minimizeWindow(),
    maximize: () => window.electronAPI.maximizeWindow(),
    close: () => window.electronAPI.closeWindow()
  })
};
