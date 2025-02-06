import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

async function detectProjectType() {
    const hasPackageJson = await fs.pathExists('package.json');
    const hasNextConfig = await fs.pathExists('next.config.js') || await fs.pathExists('next.config.mjs');
    const hasViteConfig = await fs.pathExists('vite.config.js') || await fs.pathExists('vite.config.ts');
    const hasGatsbyConfig = await fs.pathExists('gatsby-config.js');

    if (hasPackageJson) {
        const pkgContent = await fs.readFile(path.resolve('package.json'), 'utf8');
        const pkg = JSON.parse(pkgContent);

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
        configFile: 'tailwind.config.js'
    };

    switch (projectType) {
        case 'next':
            defaults.fontsDir = 'public/fonts';
            break;
        case 'gatsby':
            defaults.fontsDir = 'static/fonts';
            break;
        case 'react':
        case 'vite':
            defaults.fontsDir = 'public/fonts';
            break;
        case 'vue':
            defaults.fontsDir = 'public/fonts';
            break;
        case 'angular':
            defaults.fontsDir = 'src/assets/fonts';
            break;
    }

    return defaults;
}

export { getDefaultPaths };
