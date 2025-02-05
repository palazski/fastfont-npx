#!/usr/bin/env node

const { program } = require('commander');
const { processFont } = require('../src/index');
const path = require('path');
const fs = require('fs-extra');
const { getDefaultPaths } = require('./paths');

async function main() {
    const chalk = (await import('chalk')).default;
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
        console.log('\nUsage: npx localfont@latest <google-fonts-url> [options]');
        process.exit(1);
    }

    const spinner = ora().start();
    let totalVariants = 0;
    let fontFamily = '';
    let totalSize = 0;
    let downloadedVariants = 0;

    try {
        const defaults = await getDefaultPaths();
        const config = {
            fontsDir: options.fontsDir || defaults.fontsDir,
            cssFile: options.cssFile || defaults.cssFile,
            configFile: options.tailwindConfig || defaults.configFile,
            includeWoff1: options.includeWoff1 || false,
            verbose: options.verbose || false,
            dryRun: options.dryRun || false,
            onProgress: (stage, detail) => {
                switch (stage) {
                    case 'font_family':
                        fontFamily = detail;
                        spinner.text = `Processing ${fontFamily}`;
                        break;
                    case 'total_variants':
                        totalVariants = detail;
                        spinner.text = `Processing ${fontFamily}`;
                        break;
                    case 'start_variant':
                        const [weight, style] = detail.split(' ');
                        if (options.verbose) {
                            spinner.suffixText = chalk.gray(`${weight} ${style}`);
                        }
                        break;
                    case 'download_complete':
                        const size = parseFloat(detail);
                        totalSize += size;
                        downloadedVariants++;
                        const progress = Math.round((downloadedVariants / (totalVariants * (config.includeWoff1 ? 2 : 1))) * 100);

                        if (options.verbose) {
                            spinner.text = `Downloading ${fontFamily} [${progress}%]`;
                            spinner.suffixText = chalk.gray(`${size.toFixed(1)}KB`);
                        } else {
                            spinner.text = `Downloading ${fontFamily}`;
                        }
                        break;
                }
            }
        };

        if (config.dryRun) {
            spinner.info('Dry run mode - no files will be modified');
            process.exit(0);
        }

        await processFont(url, config);

        const successMessage = options.verbose 
            ? `✓ Downloaded ${fontFamily} (${totalSize.toFixed(1)}KB)`
            : `✓ Downloaded ${fontFamily}`;

        spinner.succeed(chalk.green(successMessage));

        console.log(chalk.blue('\nNext steps:'));
        console.log(`1. Import the CSS file: ${chalk.cyan(config.cssFile)}`);
        console.log(`2. Use the font in Tailwind classes: ${chalk.cyan(`font-${fontFamily.toLowerCase()}`)}`);

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

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});