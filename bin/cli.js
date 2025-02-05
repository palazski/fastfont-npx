#!/usr/bin/env node

async function main() {
    const { default: chalk } = await import('chalk');
    const ora = (await import('ora')).default;
    const { processFont } = require('../src/index');

    const url = process.argv[2];

    if (!url) {
        console.error(chalk.red('Error: Please provide a Google Fonts URL'));
        console.log(chalk.yellow('Usage: npx localfont@latest <google-fonts-url>'));
        process.exit(1);
    }

    const spinner = ora('Processing Google Font').start();

    try {
        await processFont(url);
        spinner.succeed(chalk.green('Font files downloaded and configured successfully!'));
        console.log(chalk.blue('\nNext steps:'));
        console.log('1. Import the generated CSS in your main CSS file');
        console.log('2. Use the font in your Tailwind classes');
    } catch (error) {
        spinner.fail(chalk.red('Error occurred'));
        console.error(chalk.red(error.message));
        process.exit(1);
    }
}

main().catch(console.error);