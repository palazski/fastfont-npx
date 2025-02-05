const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

async function downloadFonts(fontData, fontsDir = 'fonts') {
    const downloads = [];

    for (const fontFile of fontData.fontFiles) {
        try {
            const filename = `${fontData.family}-${path.basename(fontFile.url)}`;
            const filepath = path.join(fontsDir, filename);

            const { weight, style } = fontFile.metadata;

            // Find matching variant from parsed data
            // For weight ranges, check if the weight falls within any range
            const matchingVariant = fontData.variants.find(v => {
                if (v.weight.includes('..')) {
                    const [start, end] = v.weight.split('..').map(Number);
                    const currentWeight = parseInt(weight);
                    return currentWeight >= start && currentWeight <= end && v.style === style;
                }
                return v.weight === weight && v.style === style;
            });

            if (matchingVariant) {
                console.log(`Matched font variant - Weight: ${weight}, Style: ${style}`);
            } else {
                console.log(`Warning: No exact match found for Weight: ${weight}, Style: ${style}`);
            }

            console.log(`Processing font: ${filename}`);
            console.log(`Weight: ${weight}, Style: ${style}`);

            // Download the font file
            const response = await axios({
                url: fontFile.url,
                method: 'GET',
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            await fs.writeFile(filepath, response.data);

            downloads.push({
                url: fontFile.url,
                filepath,
                metadata: {
                    weight,
                    style
                }
            });
        } catch (error) {
            throw new Error(`Failed to download font file: ${error.message}`);
        }
    }

    return downloads;
}

module.exports = { downloadFonts };