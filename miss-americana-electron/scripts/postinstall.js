const { spawn } = require('child_process');
const path = require('path');

console.log('Running postinstall script...');

// Install renderer dependencies
const installRenderer = spawn('npm', ['install'], {
  cwd: path.resolve(__dirname, '../'),
  stdio: 'inherit',
  shell: true
});

installRenderer.on('close', (code) => {
  if (code !== 0) {
    console.error('Failed to install dependencies');
    process.exit(code);
  }
  
  console.log('Postinstall completed successfully');
});
