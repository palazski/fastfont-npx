const path = require('path');

function generateCss(fontData, downloadedFiles) {
    const cssContent = downloadedFiles.map(file => {
        const relativePath = path.relative('styles', file.filepath);
        const { weight, style } = file.metadata;

        return `@font-face {
    font-family: '${fontData.family}';
    font-style: ${style};
    font-weight: ${weight};
    font-display: swap;
    src: url('../${relativePath}') format('woff2');
}`;
    }).join('\n\n');

    return cssContent;
}

module.exports = { generateCss };