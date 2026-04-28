import { copyFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const extensionRoot = resolve(import.meta.dirname, '..');
const distDir = resolve(extensionRoot, 'dist');
const outputZip = resolve(extensionRoot, 'extension.zip');

copyFileSync(resolve(extensionRoot, 'manifest.json'), resolve(distDir, 'manifest.json'));
rmSync(outputZip, { force: true });

try {
  execFileSync('zip', ['-r', outputZip, '.'], {
    cwd: distDir,
    stdio: 'inherit',
  });
} catch (error) {
  if (process.platform !== 'win32') {
    throw error;
  }

  execFileSync(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      `Compress-Archive -Path * -DestinationPath ${JSON.stringify(outputZip)} -Force`,
    ],
    {
      cwd: distDir,
      stdio: 'inherit',
    }
  );
}
