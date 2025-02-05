const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

async function downloadFonts(fontData, fontsDir = 'fonts', options = {}) {
    const { includeWoff1 = false, verbose = false } = options;
    const log = verbose ? console.log : () => {};
    const downloads = [];

    for (const fontFile of fontData.fontFiles) {
        try {
            const filename = `${fontData.family}-${path.basename(fontFile.url)}`;
            const filepath = path.join(fontsDir, filename);

            const { weight, style } = fontFile.metadata;

            // Find matching variant from parsed data
            const matchingVariant = fontData.variants.find(v => {
                if (v.weight.includes('..')) {
                    const [start, end] = v.weight.split('..').map(Number);
                    const currentWeight = parseInt(weight);
                    return currentWeight >= start && currentWeight <= end && v.style === style;
                }
                return v.weight === weight && v.style === style;
            });

            if (matchingVariant) {
                log(`Matched font variant - Weight: ${weight}, Style: ${style}`);
            } else {
                log(`Warning: No exact match found for Weight: ${weight}, Style: ${style}`);
            }

            log(`Processing font: ${filename}`);
            log(`Weight: ${weight}, Style: ${style}`);

            // Download the WOFF2 file
            const response = await axios({
                url: fontFile.url,
                method: 'GET',
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            await fs.writeFile(filepath, response.data);

            const downloadInfo = {
                url: fontFile.url,
                filepath,
                metadata: {
                    weight,
                    style
                },
                format: 'woff2'
            };

            downloads.push(downloadInfo);

            // If WOFF1 is requested, try to download it
            if (includeWoff1) {
                const woff1Url = fontFile.url.replace(/\.woff2$/, '.woff');
                const woff1Filename = filename.replace(/\.woff2$/, '.woff');
                const woff1Filepath = path.join(fontsDir, woff1Filename);

                try {
                    log(`Downloading WOFF1 format: ${woff1Filename}`);
                    const woff1Response = await axios({
                        url: woff1Url,
                        method: 'GET',
                        responseType: 'arraybuffer',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                        }
                    });

                    await fs.writeFile(woff1Filepath, woff1Response.data);

                    downloads.push({
                        url: woff1Url,
                        filepath: woff1Filepath,
                        metadata: {
                            weight,
                            style
                        },
                        format: 'woff'
                    });
                } catch (woff1Error) {
                    log(`Warning: WOFF1 format not available for ${filename}`);
                }
            }
        } catch (error) {
            throw new Error(`Failed to download font file: ${error.message}`);
        }
    }

    return downloads;
}

module.exports = { downloadFonts };