const path = require('path');

function generateCss(fontData, downloadedFiles) {
    const cssContent = downloadedFiles.map(file => {
        const relativePath = path.relative('styles', file.filepath);

        // Extract weight and style from URL using improved patterns
        const isItalic = file.url.includes('italic');
        const weightMatch = file.url.match(/[,.](\d+)[,.]/);
        const weight = weightMatch ? weightMatch[1] : '400';

        // Find matching variant from fontData with more precise matching
        const variant = fontData.variants.find(v => 
            v.weight === weight && 
            v.style === (isItalic ? 'italic' : 'normal')
        );

        if (!variant) {
            console.warn(`Warning: No matching variant found for weight ${weight} and style ${isItalic ? 'italic' : 'normal'}`);
        }

        return `@font-face {
    font-family: '${fontData.family}';
    font-style: ${variant?.style || (isItalic ? 'italic' : 'normal')};
    font-weight: ${variant?.weight || weight};
    font-display: swap;
    src: url('../${relativePath}') format('woff2');
}`;
    }).join('\n\n');

    return cssContent;
}

module.exports = { generateCss };