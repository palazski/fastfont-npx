#!/usr/bin/env node

const { program } = require('commander');
const { processFont } = require('../src/index');
const path = require('path');
const fs = require('fs-extra');

async function detectProjectType() {
    // Check for common project configurations
    const hasPackageJson = await fs.pathExists('package.json');
    const hasNextConfig = await fs.pathExists('next.config.js') || await fs.pathExists('next.config.mjs');
    const hasViteConfig = await fs.pathExists('vite.config.js') || await fs.pathExists('vite.config.ts');
    const hasGatsbyConfig = await fs.pathExists('gatsby-config.js');

    if (hasPackageJson) {
        const pkg = require(path.resolve('package.json'));

        // Check for specific frameworks
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

async function main() {
    const { default: chalk } = await import('chalk');
    const ora = (await import('ora')).default;

    program
        .argument('<url>', 'Google Fonts URL')
        .option('-f, --fonts-dir <dir>', 'Directory to store font files')
        .option('-c, --css-file <file>', 'Path to generate the CSS file')
        .option('-t, --tailwind-config <file>', 'Path to Tailwind config file')
        .option('--include-woff1', 'Include WOFF1 format for better browser compatibility')
        .option('--verbose', 'Show detailed progress information')
        .option('--dry-run', 'Preview actions without executing them')
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
        console.log('  --include-woff1               Include WOFF1 format for better browser compatibility');
        console.log('  --verbose                     Show detailed progress information');
        console.log('  --dry-run                     Preview actions without executing them');
        process.exit(1);
    }

    const spinner = ora('Processing Google Font').start();
    const log = options.verbose ? console.log : () => {};

    try {
        const defaults = await getDefaultPaths();
        const config = {
            fontsDir: options.fontsDir || defaults.fontsDir,
            cssFile: options.cssFile || defaults.cssFile,
            configFile: options.tailwindConfig || defaults.configFile,
            includeWoff1: options.includeWoff1 || false,
            verbose: options.verbose || false,
            dryRun: options.dryRun || false
        };

        if (config.dryRun) {
            spinner.info(chalk.blue('Dry run mode - no files will be modified'));
            console.log('\nWould process with configuration:');
            console.log(`Fonts directory: ${config.fontsDir}`);
            console.log(`CSS file: ${config.cssFile}`);
            console.log(`Tailwind config: ${config.configFile}`);
            console.log(`Include WOFF1: ${config.includeWoff1}`);
            process.exit(0);
        }

        await processFont(url, config);

        spinner.succeed(chalk.green('Font files downloaded and configured successfully!'));

        if (config.verbose) {
            console.log(chalk.blue('\nConfiguration used:'));
            console.log(`Fonts directory: ${config.fontsDir}`);
            console.log(`CSS file: ${config.cssFile}`);
            console.log(`Tailwind config: ${config.configFile}`);
            console.log(`Include WOFF1: ${config.includeWoff1}`);
        }

        console.log(chalk.blue('\nNext steps:'));
        console.log(`1. Import the CSS file in your main CSS: ${config.cssFile}`);
        console.log('2. Use the font in your Tailwind classes');
    } catch (error) {
        spinner.fail(chalk.red('Error occurred'));
        console.error(chalk.red(error.message));
        if (options.verbose) {
            console.error(chalk.gray('\nStack trace:'));
            console.error(chalk.gray(error.stack));
        }
        process.exit(1);
    }
}

main().catch(console.error);