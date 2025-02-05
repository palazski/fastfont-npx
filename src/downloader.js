const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

async function downloadFonts(fontData) {
    const downloads = [];

    for (const url of fontData.urls) {
        const filename = `${fontData.family}-${path.basename(url)}`;
        const filepath = path.join('fonts', filename);

        try {
            const response = await axios({
                url,
                method: 'GET',
                responseType: 'arraybuffer'
            });

            await fs.writeFile(filepath, response.data);
            downloads.push({
                url,
                filepath
            });
        } catch (error) {
            throw new Error(`Failed to download font file: ${error.message}`);
        }
    }

    return downloads;
}

module.exports = { downloadFonts };
