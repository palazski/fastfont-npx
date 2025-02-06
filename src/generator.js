import path from 'path';

function generateCss(fontData, downloadedFiles, cssFile, options = {}) {
    const { includeWoff1 = false } = options;

    const cssContent = downloadedFiles.map(file => {
        const filename = path.basename(file.filepath);
        const { weight, style, unicodeRange } = file.metadata;

        return `@font-face {
    font-family: '${fontData.family}';
    font-style: ${style};
    font-weight: ${weight};
    font-display: swap;
    src: url('${filename}') format('woff2');${unicodeRange ? `\n    unicode-range: ${unicodeRange};` : ''}
}`;
    }).join('\n\n');

    return cssContent;
}

export { generateCss };