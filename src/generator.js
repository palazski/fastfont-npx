const path = require('path');

function generateCss(fontData, downloadedFiles, cssFile, options = {}) {
    const { includeWoff1 = false } = options;

    // Group files by weight and style
    const groupedFiles = downloadedFiles.reduce((acc, file) => {
        const key = `${file.metadata.weight}-${file.metadata.style}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(file);
        return acc;
    }, {});

    const cssContent = Object.entries(groupedFiles).map(([key, files]) => {
        const { weight, style } = files[0].metadata;

        // Calculate relative paths for each format
        const sources = files
            .sort((a, b) => (b.format === 'woff2' ? 1 : -1)) // WOFF2 first
            .map(file => {
                const relativePath = path.relative(path.dirname(cssFile), file.filepath).replace(/\\/g, '/');
                return `url('${relativePath}') format('${file.format}')`;
            })
            .join(',\n       ');

        return `@font-face {
    font-family: '${fontData.family}';
    font-style: ${style};
    font-weight: ${weight};
    font-display: swap;
    src: ${sources};
}`;
    }).join('\n\n');

    return cssContent;
}

module.exports = { generateCss };