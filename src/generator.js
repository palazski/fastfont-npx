const path = require('path');

function generateCss(fontData, downloadedFiles, cssFile) {
    const cssContent = downloadedFiles.map(file => {
        // Calculate relative path from CSS file to font file
        const relativePath = path.relative(path.dirname(cssFile), file.filepath).replace(/\\/g, '/');
        const { weight, style } = file.metadata;

        return `@font-face {
    font-family: '${fontData.family}';
    font-style: ${style};
    font-weight: ${weight};
    font-display: swap;
    src: url('${relativePath}') format('woff2');
}`;
    }).join('\n\n');

    return cssContent;
}

module.exports = { generateCss };