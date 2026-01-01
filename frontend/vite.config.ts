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
      console.log('📁 Copying assets from:', srcAssets);
      console.log('📁 Copying assets to:', distAssets);
      execSync(`cp -r "${srcAssets}" "${resolve(__dirname, 'dist/src/')}"`);
      console.log('✅ Successfully copied src/assets to dist/src/assets');

      // Verify CSS files were copied
      const cssFiles = execSync(`find "${distAssets}/css" -name "*.css" 2>/dev/null || echo "none"`).toString().trim();
      console.log('✅ CSS files in dist:', cssFiles.split('\n').filter(f => f && f !== 'none'));
    } catch (error) {
      console.error('❌ Failed to copy assets:', error);
    }
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyAssetsPlugin()],
})
