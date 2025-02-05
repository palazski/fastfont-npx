const axios = require('axios');

function validateGoogleFontUrl(url) {
    if (!url) {
        throw new Error('URL is required');
    }

    try {
        const urlObj = new URL(url);
        if (!urlObj.hostname.endsWith('fonts.googleapis.com')) {
            throw new Error('Invalid Google Fonts domain');
        }
        if (!urlObj.pathname.includes('/css2')) {
            throw new Error('Invalid Google Fonts API version - use CSS2 endpoint');
        }
        if (!urlObj.searchParams.has('family')) {
            throw new Error('Font family parameter is missing');
        }
    } catch (error) {
        if (error.code === 'ERR_INVALID_URL') {
            throw new Error('Invalid URL format');
        }
        throw error;
    }
}

async function parseGoogleFontUrl(url) {
    try {
        validateGoogleFontUrl(url);

        const familyMatch = url.match(/family=([^&]+)/);
        if (!familyMatch) {
            throw new Error('Could not find font family in URL');
        }

        const [familyPart, settingsPart] = familyMatch[1].split(':');
        const family = decodeURIComponent(familyPart);
        const variants = [];

        if (settingsPart) {
            if (settingsPart.startsWith('ital,wght@')) {
                const variantSets = settingsPart.replace('ital,wght@', '').split(';');

                variantSets.forEach(set => {
                    const [italic, weight] = set.split(',');
                    if (!weight || isNaN(parseInt(weight))) {
                        throw new Error(`Invalid weight value in variant: ${set}`);
                    }
                    const isItalic = italic === '1';

                    variants.push({
                        weight: weight,
                        style: isItalic ? 'italic' : 'normal'
                    });
                });
            } else if (settingsPart.startsWith('wght@')) {
                const weightSets = settingsPart.replace('wght@', '').split(';');

                weightSets.forEach(weight => {
                    if (weight.includes('..')) {
                        const [start, end] = weight.split('..').map(Number);
                        if (isNaN(start) || isNaN(end)) {
                            throw new Error(`Invalid weight range: ${weight}`);
                        }
                        if (start > end) {
                            throw new Error(`Invalid weight range: start (${start}) is greater than end (${end})`);
                        }
                        for (let w = start; w <= end; w += 100) {
                            variants.push({
                                weight: w.toString(),
                                style: 'normal'
                            });
                        }
                    } else {
                        const w = parseInt(weight);
                        if (isNaN(w)) {
                            throw new Error(`Invalid weight value: ${weight}`);
                        }
                        variants.push({
                            weight: weight,
                            style: 'normal'
                        });
                    }
                });
            } else {
                throw new Error(`Unsupported font variant format: ${settingsPart}`);
            }
        }

        if (variants.length === 0) {
            variants.push({
                weight: '400',
                style: 'normal'
            });
        }

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const fontFaceBlocks = response.data.match(/@font-face\s*{[^}]+}/g);
        if (!fontFaceBlocks) {
            throw new Error('No @font-face blocks found in the CSS response');
        }

        const fontFiles = [];
        let hasValidFontFile = false;

        fontFaceBlocks.forEach(block => {
            const urlMatch = block.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+\.woff2[^)]*)\)/);
            const weightMatch = block.match(/font-weight:\s*(\d+)/);
            const styleMatch = block.match(/font-style:\s*(\w+)/);

            if (urlMatch && weightMatch && styleMatch) {
                hasValidFontFile = true;
                fontFiles.push({
                    url: urlMatch[1],
                    metadata: {
                        weight: weightMatch[1],
                        style: styleMatch[1]
                    }
                });
            }
        });

        if (!hasValidFontFile) {
            throw new Error('No valid WOFF2 files found in the CSS response');
        }

        return {
            family,
            fontFiles,
            variants,
            totalVariants: variants.length
        };
    } catch (error) {
        if (error.response?.status === 400) {
            throw new Error('Invalid Google Font URL or font family not found');
        } else if (error.response?.status === 403) {
            throw new Error('Access denied by Google Fonts API');
        } else if (error.response?.status === 404) {
            throw new Error('Font not found on Google Fonts');
        } else if (error.code === 'ENOTFOUND') {
            throw new Error('Network error: Could not connect to Google Fonts API');
        }
        throw new Error(`Failed to parse Google Font URL: ${error.message}`);
    }
}

module.exports = { parseGoogleFontUrl };