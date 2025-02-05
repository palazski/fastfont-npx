const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

async function downloadFonts(fontData) {
    const downloads = [];

    for (const url of fontData.urls) {
        try {
            const filename = `${fontData.family}-${path.basename(url)}`;
            const filepath = path.join('fonts', filename);

            // Extract weight and style information from URL
            const isItalic = url.toLowerCase().includes('italic');

            // Extract weight using multiple patterns specific to Google Fonts
            let weight = null;
            const patterns = [
                // Match patterns like /wght@400/ or /wght,400/
                /wght[@,](\d+)/,
                // Match patterns like -400- or .400.
                /[-.](\d+)[-.]/, 
                // Match patterns in the filename like w400
                /w(\d+)/
            ];

            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match) {
                    weight = match[1];
                    break;
                }
            }

            // Use weight from variant list if we couldn't extract it from URL
            if (!weight) {
                const style = isItalic ? 'italic' : 'normal';
                const matchingVariant = fontData.variants.find(v => v.style === style);
                weight = matchingVariant ? matchingVariant.weight : '400';
            }

            // Download the font file
            const response = await axios({
                url,
                method: 'GET',
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            await fs.writeFile(filepath, response.data);

            console.log(`Processing font: ${filename}`);
            console.log(`Weight: ${weight}, Style: ${isItalic ? 'italic' : 'normal'}`);

            downloads.push({
                url,
                filepath,
                metadata: {
                    weight,
                    style: isItalic ? 'italic' : 'normal'
                }
            });
        } catch (error) {
            throw new Error(`Failed to download font file: ${error.message}`);
        }
    }

    return downloads;
}

module.exports = { downloadFonts };