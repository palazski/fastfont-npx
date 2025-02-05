const axios = require('axios');

async function parseGoogleFontUrl(url) {
    try {
        // Validate URL
        if (!url.includes('fonts.googleapis.com/css2')) {
            throw new Error('Invalid Google Fonts URL');
        }

        // Extract font family and settings
        const familyMatch = url.match(/family=([^&]+)/);
        if (!familyMatch) {
            throw new Error('Could not find font family in URL');
        }

        const [familyPart, settingsPart] = familyMatch[1].split(':');
        const family = decodeURIComponent(familyPart);

        // Parse weight ranges and styles
        const variants = [];

        if (settingsPart) {
            // Handle different format types
            if (settingsPart.startsWith('ital,wght@')) {
                // Format: ital,wght@0,100;0,200;1,100;1,200
                const variantSets = settingsPart.replace('ital,wght@', '').split(';');

                variantSets.forEach(set => {
                    const [italic, weight] = set.split(',');
                    const isItalic = italic === '1';

                    variants.push({
                        weight: weight,
                        style: isItalic ? 'italic' : 'normal'
                    });
                });
            } else if (settingsPart.startsWith('wght@')) {
                // Format: wght@100;200;300..900
                const weightSets = settingsPart.replace('wght@', '').split(';');

                weightSets.forEach(weight => {
                    if (weight.includes('..')) {
                        // Handle weight range (e.g., 100..900)
                        const [start, end] = weight.split('..').map(Number);
                        for (let w = start; w <= end; w += 100) {
                            variants.push({
                                weight: w.toString(),
                                style: 'normal'
                            });
                        }
                    } else {
                        variants.push({
                            weight: weight,
                            style: 'normal'
                        });
                    }
                });
            }
        }

        console.log('Parsed variants:', variants);

        // Fetch CSS to get font URLs and metadata
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        // Extract @font-face blocks with their metadata
        const fontFaceBlocks = response.data.match(/@font-face\s*{[^}]+}/g) || [];
        const fontFiles = [];

        fontFaceBlocks.forEach(block => {
            const urlMatch = block.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+\.woff2[^)]*)\)/);
            const weightMatch = block.match(/font-weight:\s*(\d+)/);
            const styleMatch = block.match(/font-style:\s*(\w+)/);

            if (urlMatch && weightMatch && styleMatch) {
                fontFiles.push({
                    url: urlMatch[1],
                    metadata: {
                        weight: weightMatch[1],
                        style: styleMatch[1]
                    }
                });
            }
        });

        if (fontFiles.length === 0) {
            throw new Error('No WOFF2 files found');
        }

        return {
            family,
            fontFiles,
            variants
        };
    } catch (error) {
        throw new Error(`Failed to parse Google Font URL: ${error.message}`);
    }
}

module.exports = { parseGoogleFontUrl };