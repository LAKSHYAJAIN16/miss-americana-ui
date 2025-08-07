import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Import Tauri compatibility layer
const { fs, shell } = window.__TAURI__ || {};

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if we have the required binaries
        await checkBinaries();
        setIsLoading(false);
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to initialize application. Please check the console for details.');
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const checkBinaries = async () => {
    if (!fs) {
      console.warn('File system not available - running in limited mode');
      return;
    }

    try {
      // Check for required binaries in the resources directory
      const resourcesPath = window.electronAPI.invoke('app:getPath', 'resources');
      const binPath = path.join(resourcesPath, 'bin');
      
      // Ensure binaries directory exists
      await fs.createDir(binPath, { recursive: true });
      
      // Check for required binaries
      const requiredBinaries = ['ytsearch', 'innersearch'];
      
      for (const bin of requiredBinaries) {
        try {
          await fs.access(path.join(binPath, bin), fs.constants.X_OK);
          console.log(`Found binary: ${bin}`);
        } catch (err) {
          console.warn(`Missing binary: ${bin}. Some features may not work.`);
        }
      }
    } catch (err) {
      console.error('Error checking binaries:', err);
      throw new Error('Failed to verify required binaries');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Miss Americana...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 max-w-md">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Miss Americana</h1>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <button 
                  onClick={() => navigate('/home')}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/login')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Login
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-700">Welcome to Miss Americana</h2>
            <p className="mt-2 text-gray-600">Your personal music player and library</p>
            
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Add your content here */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
