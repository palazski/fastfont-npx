#!/usr/bin/env node

const { program } = require('commander');
const { processFont } = require('../src/index');
const path = require('path');
const fs = require('fs-extra');

async function detectProjectType() {
    // Check for common project configurations
    const hasPackageJson = await fs.pathExists('package.json');
    if (hasPackageJson) {
        const pkg = require(path.resolve('package.json'));
        if (pkg.dependencies?.['next'] || pkg.devDependencies?.['next']) return 'next';
        if (pkg.dependencies?.['react'] || pkg.devDependencies?.['react']) return 'react';
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
        case 'react':
            defaults.fontsDir = 'public/fonts';
            defaults.cssFile = 'src/styles/fonts.css';
            break;
    }

    return defaults;
}

async function main() {
    const { default: chalk } = await import('chalk');
    const ora = (await import('ora')).default;

    program
        .argument('<url>', 'Google Fonts URL')
        .option('-f, --fonts-dir <dir>', 'Directory to store font files')
        .option('-c, --css-file <file>', 'Path to generate the CSS file')
        .option('-t, --tailwind-config <file>', 'Path to Tailwind config file')
        .parse();

    const url = program.args[0];
    const options = program.opts();

    if (!url) {
        console.error(chalk.red('Error: Please provide a Google Fonts URL'));
        console.log(chalk.yellow('Usage: npx localfont@latest <google-fonts-url> [options]'));
        console.log('\nOptions:');
        console.log('  -f, --fonts-dir <dir>          Directory to store font files');
        console.log('  -c, --css-file <file>         Path to generate the CSS file');
        console.log('  -t, --tailwind-config <file>  Path to Tailwind config file');
        process.exit(1);
    }

    const spinner = ora('Processing Google Font').start();

    try {
        const defaults = await getDefaultPaths();
        const config = {
            fontsDir: options.fontsDir || defaults.fontsDir,
            cssFile: options.cssFile || defaults.cssFile,
            configFile: options.tailwindConfig || defaults.configFile
        };

        await processFont(url, config);

        spinner.succeed(chalk.green('Font files downloaded and configured successfully!'));
        console.log(chalk.blue('\nConfiguration used:'));
        console.log(`Fonts directory: ${config.fontsDir}`);
        console.log(`CSS file: ${config.cssFile}`);
        console.log(`Tailwind config: ${config.configFile}`);

        console.log(chalk.blue('\nNext steps:'));
        console.log(`1. Import the CSS file in your main CSS: ${config.cssFile}`);
        console.log('2. Use the font in your Tailwind classes');
    } catch (error) {
        spinner.fail(chalk.red('Error occurred'));
        console.error(chalk.red(error.message));
        process.exit(1);
    }
}

main().catch(console.error);