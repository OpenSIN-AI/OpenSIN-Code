const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PLATFORM = process.platform;
const ARCH = process.arch;
const VERSION = '0.1.0';

function getBinaryName() {
  const ext = PLATFORM === 'win32' ? '.exe' : '';
  return `sincode${ext}`;
}

function getDownloadUrl() {
  const platformMap = {
    'darwin': { arm64: 'opencode-darwin-arm64', x64: 'opencode-darwin-x64' },
    'linux': { arm64: 'opencode-linux-arm64', x64: 'opencode-linux-x64' },
    'win32': { arm64: 'opencode-windows-arm64', x64: 'opencode-windows-x64' }
  };
  const pkg = platformMap[PLATFORM]?.[ARCH];
  if (!pkg) throw new Error(`Unsupported platform: ${PLATFORM}-${ARCH}`);
  return `https://github.com/OpenSIN-AI/OpenSIN-Code/releases/download/v${VERSION}/${pkg}.zip`;
}

const binDir = path.join(__dirname, 'bin');
const binPath = path.join(binDir, getBinaryName());

if (fs.existsSync(binPath)) {
  console.log('SIN Code binary already exists');
  process.exit(0);
}

fs.mkdirSync(binDir, { recursive: true });

// For now, use the locally built binary
const localBin = path.join(__dirname, '..', 'dist', `opencode-${PLATFORM}-${ARCH}`, 'bin', 'opencode');
if (fs.existsSync(localBin)) {
  fs.copyFileSync(localBin, binPath);
  fs.chmodSync(binPath, 0o755);
  console.log('SIN Code installed successfully from local build');
} else {
  console.log('No local binary found. Download from GitHub releases.');
}
