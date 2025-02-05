const fs = require('fs-extra');
const path = require('path');

async function detectProjectType() {
    const hasPackageJson = await fs.pathExists('package.json');
    const hasNextConfig = await fs.pathExists('next.config.js') || await fs.pathExists('next.config.mjs');
    const hasViteConfig = await fs.pathExists('vite.config.js') || await fs.pathExists('vite.config.ts');
    const hasGatsbyConfig = await fs.pathExists('gatsby-config.js');

    if (hasPackageJson) {
        const pkg = require(path.resolve('package.json'));

        if (hasNextConfig || pkg.dependencies?.['next'] || pkg.devDependencies?.['next']) return 'next';
        if (hasGatsbyConfig || pkg.dependencies?.['gatsby'] || pkg.devDependencies?.['gatsby']) return 'gatsby';
        if (hasViteConfig || pkg.dependencies?.['vite'] || pkg.devDependencies?.['vite']) return 'vite';
        if (pkg.dependencies?.['@angular/core'] || pkg.devDependencies?.['@angular/core']) return 'angular';
        if (pkg.dependencies?.['react'] || pkg.devDependencies?.['react']) return 'react';
        if (pkg.dependencies?.['vue'] || pkg.devDependencies?.['vue']) return 'vue';
        return 'node';
    }
    return 'unknown';
}

async function getDefaultPaths() {
    const projectType = await detectProjectType();
    const defaults = {
        fontsDir: 'fonts',
        cssFile: 'styles/fonts.css',
        configFile: 'tailwind.config.js'
    };

    switch (projectType) {
        case 'next':
            defaults.fontsDir = 'public/fonts';
            defaults.cssFile = 'styles/fonts.css';
            break;
        case 'gatsby':
            defaults.fontsDir = 'static/fonts';
            defaults.cssFile = 'src/styles/fonts.css';
            break;
        case 'react':
        case 'vite':
            defaults.fontsDir = 'public/fonts';
            defaults.cssFile = 'src/styles/fonts.css';
            break;
        case 'vue':
            defaults.fontsDir = 'public/fonts';
            defaults.cssFile = 'src/assets/styles/fonts.css';
            break;
        case 'angular':
            defaults.fontsDir = 'src/assets/fonts';
            defaults.cssFile = 'src/styles/fonts.css';
            break;
    }

    return defaults;
}

module.exports = { getDefaultPaths };
