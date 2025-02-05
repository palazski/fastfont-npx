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
            configFile = 'tailwind.config.js',
            includeWoff1 = false,
            verbose = false,
            onProgress = () => {}
        } = config;

        // Create necessary directories
        await fs.ensureDir(fontsDir);
        await fs.ensureDir(path.dirname(cssFile));

        // Parse the Google Font URL and get font data
        const fontData = await parseGoogleFontUrl(url);
        onProgress('font_family', fontData.family);
        onProgress('total_variants', fontData.totalVariants);

        // Download font files to specified directory
        const downloadedFiles = await downloadFonts(fontData, fontsDir, { includeWoff1, verbose, onProgress });

        // Generate CSS with correct paths
        const cssContent = await generateCss(fontData, downloadedFiles, cssFile, { includeWoff1 });
        await fs.writeFile(cssFile, cssContent);

        // Update Tailwind config at specified path
        await updateTailwindConfig(fontData.family, configFile);

        return true;
    } catch (error) {
        throw new Error(`Failed to process font: ${error.message}`);
    }
}

module.exports = { processFont };