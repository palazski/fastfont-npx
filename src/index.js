const { parseGoogleFontUrl } = require('./parser');
const { downloadFonts } = require('./downloader');
const { generateCss } = require('./generator');
const { updateTailwindConfig } = require('./config');
const fs = require('fs-extra');
const path = require('path');

async function processFont(url) {
    try {
        // Create necessary directories
        await fs.ensureDir('fonts');
        await fs.ensureDir('styles');

        // Parse the Google Font URL
        const fontData = await parseGoogleFontUrl(url);

        // Download font files
        const downloadedFiles = await downloadFonts(fontData);

        // Generate CSS
        const cssContent = await generateCss(fontData, downloadedFiles);
        await fs.writeFile('styles/fonts.css', cssContent);

        // Update Tailwind config
        await updateTailwindConfig(fontData.family);

        return true;
    } catch (error) {
        throw new Error(`Failed to process font: ${error.message}`);
    }
}

module.exports = { processFont };
