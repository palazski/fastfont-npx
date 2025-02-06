import { parseGoogleFontUrl } from './parser.js';
import { downloadFonts } from './downloader.js';
import { generateCss } from './generator.js';
import { updateTailwindConfig } from './config.js';
import fs from 'fs-extra';
import path from 'path';

async function processFont(url, config = {}) {
    try {
        const {
            fontsDir = 'fonts',
            configFile = 'tailwind.config.js',
            includeWoff1 = false,
            verbose = false,
            onProgress = () => {}
        } = config;

        // Parse the Google Font URL and get font data
        const fontData = await parseGoogleFontUrl(url);
        const fontDirName = fontData.family.toLowerCase();
        
        // Create font-specific directories
        const fontBaseDir = path.join(fontsDir, fontDirName);
        const fontFilesDir = path.join(fontBaseDir, fontDirName);
        await fs.ensureDir(fontFilesDir);

        // Generate the font-specific CSS file path
        const fontCssFile = path.join(fontBaseDir, `${fontDirName}.css`);

        // Download font files
        const downloadedFiles = await downloadFonts(fontData, fontFilesDir, { includeWoff1, verbose, onProgress });

        // Generate and write CSS
        const cssContent = await generateCss(fontData, downloadedFiles, fontCssFile, { includeWoff1 });
        await fs.writeFile(fontCssFile, cssContent);

        // Update Tailwind config
        await updateTailwindConfig(fontData.family, configFile);

        return {
            cssFile: fontCssFile,
            fontDir: fontFilesDir,
            fontFamily: fontData.family
        };
    } catch (error) {
        throw new Error(`Failed to process font: ${error.message}`);
    }
}

export { processFont };