const { spawn } = require('child_process');
const path = require('path');
const electron = require('electron');
const waitOn = require('wait-on');

// Start Vite dev server
const vite = spawn('vite', ['--config', 'vite.electron.config.js', '--host'], { 
  stdio: 'inherit',
  shell: true
});

// Wait for Vite dev server to be ready
waitOn({
  resources: ['http://localhost:1420'],
  timeout: 30000
}).then(() => {
  // Start Electron
  const electronProcess = spawn(electron, ['.'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
      VITE_DEV_SERVER_URL: 'http://localhost:1420'
    }
  });

  // Handle Electron process exit
  electronProcess.on('close', (code) => {
    console.log(`Electron process exited with code ${code}`);
    process.exit(code);
  });

  // Handle script termination
  process.on('SIGTERM', () => {
    electronProcess.kill();
    vite.kill();
    process.exit(0);
  });

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    electronProcess.kill();
    vite.kill();
    process.exit(0);
  });
}).catch((err) => {
  console.error('Failed to start dev server:', err);
  process.exit(1);
});
