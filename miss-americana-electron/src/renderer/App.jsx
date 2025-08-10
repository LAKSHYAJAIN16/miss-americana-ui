import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import './App.css';

// Import Tauri compatibility layer
import * as tauri from './compatibility/tauri-compat';

// Make Tauri APIs globally available for compatibility
if (!window.__TAURI__) {
  window.__TAURI__ = {
    ...tauri,
    fs: tauri.fs,
    http: tauri.http,
    shell: tauri.shell,
    app: tauri.app,
    window: tauri.window
  };
}

function App() {
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Check if running in Electron
    setIsElectron(window.electronAPI !== undefined);
    
    // Initialize app when running in Electron
    if (window.electronAPI) {
      // Add any Electron-specific initialization here
      console.log('Running in Electron environment');
    } else {
      console.warn('Not running in Electron environment - some features may be limited');
    }
  }, []);

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
