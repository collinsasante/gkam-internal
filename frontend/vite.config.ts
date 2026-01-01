import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { execSync } from 'child_process'

// Plugin to copy src/assets to dist/src/assets and inject CSS links
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

      // Inject CSS links into index.html
      const indexPath = resolve(__dirname, 'dist/index.html');
      let html = readFileSync(indexPath, 'utf-8');

      // Add CSS links after Bootstrap Icons
      const cssLinks = `
    <!-- Metronic Theme Styles -->
    <link href="/src/assets/plugins/global/plugins.bundle.css" rel="stylesheet" type="text/css" />
    <link href="/src/assets/css/style.bundle.css" rel="stylesheet" type="text/css" />

    <!-- DataTables Plugin -->
    <link href="/src/assets/plugins/custom/datatables/datatables.bundle.css" rel="stylesheet" type="text/css" />

    <!-- Custom Color Tweaks -->
    <link href="/src/assets/css/custom-tweaks.css" rel="stylesheet" type="text/css" />
`;

      html = html.replace(
        '<!-- Metronic Theme Styles -->',
        cssLinks
      );

      writeFileSync(indexPath, html);
      console.log('✅ Injected CSS links into index.html');
    } catch (error) {
      console.error('❌ Failed to copy assets:', error);
    }
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyAssetsPlugin()],
})
