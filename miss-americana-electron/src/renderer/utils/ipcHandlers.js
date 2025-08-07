/**
 * IPC Handlers for Electron
 * This file provides a clean interface for renderer processes to communicate with the main process
 */

/**
 * Execute a shell command
 * @param {string} command - The command to execute
 * @param {string[]} args - Command line arguments
 * @param {Object} options - Additional options
 * @returns {Promise<{code: number, stdout: string, stderr: string}>}
 */
export const executeCommand = async (command, args = [], options = {}) => {
  if (!window.electronAPI) {
    console.warn('Electron API not available - running in browser mode');
    // Fallback for browser environment (for development)
    return {
      code: 0,
      stdout: '',
      stderr: 'Electron API not available in browser mode'
    };
  }

  try {
    return await window.electronAPI.invoke('command:execute', {
      command,
      args,
      options: {
        ...options,
        // Default options can be set here
        env: process.env,
        cwd: process.cwd(),
        shell: true
      }
    });
  } catch (error) {
    console.error('Command execution failed:', error);
    return {
      code: 1,
      stdout: '',
      stderr: error.message || 'Command execution failed'
    };
  }
};

/**
 * File system operations
 */
export const fileSystem = {
  /**
   * Read a file as text
   * @param {string} path - Path to the file
   * @param {Object} options - Options
   * @returns {Promise<string>} File contents
   */
  readFile: async (path, options = {}) => {
    if (window.electronAPI) {
      return window.electronAPI.invoke('fs:readFile', path);
    }
    // Fallback for browser
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to read file: ${path}`);
    return response.text();
  },

  /**
   * Write text to a file
   * @param {string} path - Path to the file
   * @param {string} contents - File contents
   * @returns {Promise<void>}
   */
  writeFile: async (path, contents) => {
    if (window.electronAPI) {
      return window.electronAPI.invoke('fs:writeFile', path, contents);
    }
    // Fallback for browser (limited functionality)
    const blob = new Blob([contents], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = path.split('/').pop() || 'file.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Check if a file exists
   * @param {string} path - Path to check
   * @returns {Promise<boolean>}
   */
  exists: async (path) => {
    if (window.electronAPI) {
      return window.electronAPI.invoke('fs:exists', path);
    }
    // Fallback for browser
    try {
      await fetch(path, { method: 'HEAD' });
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Application utilities
 */
export const app = {
  /**
   * Get application version
   * @returns {Promise<string>}
   */
  getVersion: async () => {
    if (window.electronAPI) {
      return window.electronAPI.invoke('app:getVersion');
    }
    return process.env.REACT_APP_VERSION || '0.1.0';
  },

  /**
   * Get application path
   * @param {string} name - Path name (e.g., 'userData', 'temp')
   * @returns {Promise<string>}
   */
  getPath: async (name) => {
    if (window.electronAPI) {
      return window.electronAPI.invoke('app:getPath', name);
    }
    // Fallback for browser
    return '';
  },

  /**
   * Open URL in default browser
   * @param {string} url - URL to open
   * @returns {Promise<void>}
   */
  openExternal: async (url) => {
    if (window.electronAPI) {
      return window.electronAPI.invoke('shell:open', url);
    }
    // Fallback for browser
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

/**
 * Window management
 */
export const windowManager = {
  /**
   * Minimize the window
   */
  minimize: () => {
    if (window.electronAPI) {
      window.electronAPI.invoke('window:minimize');
    }
  },

  /**
   * Maximize or restore the window
   */
  toggleMaximize: () => {
    if (window.electronAPI) {
      window.electronAPI.invoke('window:maximize');
    }
  },

  /**
   * Close the window
   */
  close: () => {
    if (window.electronAPI) {
      window.electronAPI.invoke('window:close');
    }
  },

  /**
   * Check if window is maximized
   * @returns {Promise<boolean>}
   */
  isMaximized: async () => {
    if (window.electronAPI) {
      return window.electronAPI.invoke('window:isMaximized');
    }
    return false;
  }
};

// Export all utilities
export default {
  executeCommand,
  fileSystem,
  app,
  window: windowManager
};
