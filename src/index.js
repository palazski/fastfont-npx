const { parseGoogleFontUrl } = require('./parser');
const { downloadFonts } = require('./downloader');
const { generateCss } = require('./generator');
const { updateTailwindConfig } = require('./config');
const fs = require('fs-extra');
const path = require('path');

async function processFont(url, config = {}) {
    try {
        const {
            fontsDir = 'fonts',
            cssFile = 'styles/fonts.css',
            configFile = 'tailwind.config.js'
        } = config;

        // Create necessary directories
        await fs.ensureDir(fontsDir);
        await fs.ensureDir(path.dirname(cssFile));

        // Parse the Google Font URL
        const fontData = await parseGoogleFontUrl(url);

        // Download font files to specified directory
        const downloadedFiles = await downloadFonts(fontData, fontsDir);

        // Generate CSS with correct paths
        const cssContent = await generateCss(fontData, downloadedFiles, cssFile);
        await fs.writeFile(cssFile, cssContent);

        // Update Tailwind config at specified path
        await updateTailwindConfig(fontData.family, configFile);

        return true;
    } catch (error) {
        throw new Error(`Failed to process font: ${error.message}`);
    }
}

module.exports = { processFont };