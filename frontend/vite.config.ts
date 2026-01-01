import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdirSync, existsSync } from 'fs'
import { resolve } from 'path'
import { execSync } from 'child_process'

// Plugin to copy src/assets to dist/src/assets
const copyAssetsPlugin = () => ({
  name: 'copy-assets',
  closeBundle() {
    const srcAssets = resolve(__dirname, 'src/assets');
    const distAssets = resolve(__dirname, 'dist/src/assets');

    // Create dist/src/assets directory structure
    if (!existsSync(distAssets)) {
      mkdirSync(distAssets, { recursive: true });
    }

    // Copy files using shell command
    try {
      execSync(`cp -r "${srcAssets}" "${resolve(__dirname, 'dist/src/')}"`);
      console.log('✅ Copied src/assets to dist/src/assets');
    } catch (error) {
      console.error('❌ Failed to copy assets:', error);
    }
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyAssetsPlugin()],
})
