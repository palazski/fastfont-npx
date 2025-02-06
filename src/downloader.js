import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

async function downloadWithRetry(url, options = {}, maxRetries = 3) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await axios({
                url,
                method: 'GET',
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            return response;
        } catch (error) {
            lastError = error;
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            }
        }
    }
    throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}

function calculateHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function validateFontFile(buffer) {
    const isWoff2 = buffer.slice(0, 4).toString('hex') === '774f4632'; // 'wOF2'
    const isWoff = buffer.slice(0, 4).toString('hex') === '774f4646'; // 'wOFF'

    if (!isWoff2 && !isWoff) {
        throw new Error('Invalid font file format');
    }
    return true;
}

async function downloadFonts(fontData, fontsDir = 'fonts', options = {}) {
    const { includeWoff1 = false, verbose = false, onProgress = () => {} } = options;
    const downloads = [];

    for (const fontFile of fontData.fontFiles) {
        try {
            const filename = `${fontData.family}-${path.basename(fontFile.url)}`;
            const filepath = path.join(fontsDir, filename);
            const { weight, style } = fontFile.metadata;

            onProgress('start_variant', `${weight} ${style}`);

            const response = await downloadWithRetry(fontFile.url);
            const fileSize = Buffer.byteLength(response.data);
            const fileSizeKB = fileSize / 1024;
            onProgress('download_complete', fileSizeKB);

            await validateFontFile(response.data);
            const hash = calculateHash(response.data);
            await fs.writeFile(filepath, response.data);

            downloads.push({
                url: fontFile.url,
                filepath,
                metadata: {
                    weight,
                    style,
                    hash,
                    size: fileSize
                },
                format: 'woff2'
            });

            if (includeWoff1) {
                const woff1Url = fontFile.url.replace(/\.woff2$/, '.woff');
                const woff1Filename = filename.replace(/\.woff2$/, '.woff');
                const woff1Filepath = path.join(fontsDir, woff1Filename);

                try {
                    const woff1Response = await downloadWithRetry(woff1Url);
                    const woff1Size = Buffer.byteLength(woff1Response.data);
                    const woff1SizeKB = woff1Size / 1024;
                    onProgress('download_complete', woff1SizeKB);

                    await validateFontFile(woff1Response.data);
                    const woff1Hash = calculateHash(woff1Response.data);
                    await fs.writeFile(woff1Filepath, woff1Response.data);

                    downloads.push({
                        url: woff1Url,
                        filepath: woff1Filepath,
                        metadata: {
                            weight,
                            style,
                            hash: woff1Hash,
                            size: woff1Size
                        },
                        format: 'woff'
                    });
                } catch (error) {
                    if (verbose) {
                        console.log(`Note: WOFF1 format not available for ${weight} ${style}`);
                    }
                }
            }
        } catch (error) {
            throw new Error(`Failed to download font file: ${error.message}`);
        }
    }

    return downloads;
}

export { downloadFonts };