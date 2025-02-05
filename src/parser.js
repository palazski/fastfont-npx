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
        const weightRanges = [];
        const styles = new Set();

        if (settingsPart) {
            const settings = settingsPart.split(';');
            settings.forEach(setting => {
                const [key, value] = setting.split('@');
                if (key === 'ital') {
                    const [isItalic, weights] = value.split(',');
                    if (weights.includes('..')) {
                        const [start, end] = weights.split('..');
                        for (let weight = parseInt(start); weight <= parseInt(end); weight += 100) {
                            weightRanges.push({ weight, isItalic: isItalic === '1' });
                            styles.add(isItalic === '1' ? 'italic' : 'normal');
                        }
                    } else {
                        weights.split(',').forEach(weight => {
                            weightRanges.push({ weight: parseInt(weight), isItalic: isItalic === '1' });
                            styles.add(isItalic === '1' ? 'italic' : 'normal');
                        });
                    }
                } else if (key === 'wght') {
                    if (value.includes('..')) {
                        const [start, end] = value.split('..');
                        for (let weight = parseInt(start); weight <= parseInt(end); weight += 100) {
                            weightRanges.push({ weight, isItalic: false });
                            styles.add('normal');
                        }
                    } else {
                        value.split(',').forEach(weight => {
                            weightRanges.push({ weight: parseInt(weight), isItalic: false });
                            styles.add('normal');
                        });
                    }
                }
            });
        }

        // Fetch CSS to get font URLs
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        // Extract WOFF2 URLs
        const woff2Urls = response.data.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+\.woff2[^)]*)\)/g)
            ?.map(url => url.slice(4, -1)) || [];

        if (woff2Urls.length === 0) {
            throw new Error('No WOFF2 files found');
        }

        return {
            family,
            urls: woff2Urls,
            variants: weightRanges.map(({ weight, isItalic }) => ({
                weight: weight.toString(),
                style: isItalic ? 'italic' : 'normal'
            }))
        };
    } catch (error) {
        throw new Error(`Failed to parse Google Font URL: ${error.message}`);
    }
}

module.exports = { parseGoogleFontUrl };