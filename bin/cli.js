#!/usr/bin/env node

import { Command } from "commander";
import { processFont } from "../src/index.js";
import { getDefaultPaths } from "./paths.js";
import chalk from "chalk";
import ora from "ora";
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = require(path.join(__dirname, '../package.json'));

const program = new Command();

program
    .name('fastfont')
    .description(pkg.description)
    .version(pkg.version)
    .argument("<url>", "Google Fonts URL (e.g., https://fonts.googleapis.com/css2?family=Inter:wght@400..700)")
    .option("-f, --fonts-dir <dir>", "Directory to store font files (default: public/fonts)")
    .option("-t, --tailwind-config <file>", "Path to Tailwind config file (default: tailwind.config.js)")
    .option("--include-woff1", "Include WOFF1 format for better browser compatibility")
    .option("--verbose", "Show detailed progress information")
    .option("--dry-run", "Preview actions without executing them")
    .addHelpText('after', `
Examples:
  $ npx fastfont "https://fonts.googleapis.com/css2?family=Inter:wght@400..700"
  $ npx fastfont "https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;1,400" --fonts-dir=src/fonts
  $ npx fastfont "https://fonts.googleapis.com/css2?family=Poppins:wght@400..900" --verbose

For more information, visit: https://github.com/palazski/fastfont-npx`);

// Show help if no arguments provided
if (process.argv.length === 2) program.help();

program.parse();

const url = program.args[0];
const options = program.opts();

if (!url) {
    console.error(chalk.red("Error: Please provide a Google Fonts URL"));
    console.log(
        "\nUsage: npx fastfont@latest <google-fonts-url> [options]",
    );
    process.exit(1);
}

const spinner = ora().start();
let totalVariants = 0;
let fontFamily = "";
let totalSize = 0;
let downloadedFiles = 0;

try {
    const defaults = await getDefaultPaths();
    const config = {
        fontsDir: options.fontsDir || defaults.fontsDir,
        configFile: options.tailwindConfig || defaults.configFile,
        includeWoff1: options.includeWoff1 || false,
        verbose: options.verbose || false,
        dryRun: options.dryRun || false,
        onProgress: (stage, detail) => {
            switch (stage) {
                case "font_family":
                    fontFamily = detail;
                    spinner.text = `Processing ${fontFamily}`;
                    break;
                case "total_variants":
                    totalVariants = detail;
                    spinner.text = `Processing ${fontFamily}`;
                    break;
                case "start_variant":
                    const [weight, style] = detail.split(" ");
                    if (options.verbose) {
                        spinner.suffixText = chalk.gray(
                            `${weight} ${style}`,
                        );
                    }
                    break;
                case "download_complete":
                    downloadedFiles++;
                    const size = parseFloat(detail);
                    totalSize += size;

                    // Calculate progress based on expected total files
                    const totalExpectedFiles = config.includeWoff1
                        ? totalVariants * 2
                        : totalVariants;
                    const progress = Math.round(
                        (downloadedFiles / totalExpectedFiles) * 100,
                    );

                    if (options.verbose) {
                        spinner.text = `Downloading ${fontFamily} [${progress}%]`;
                        spinner.suffixText = chalk.gray(
                            `${size.toFixed(1)}KB`,
                        );
                    } else {
                        spinner.text = `Downloading ${fontFamily}`;
                    }
                    break;
            }
        },
    };

    if (config.dryRun) {
        spinner.info("Dry run mode - no files will be modified");
        process.exit(0);
    }

    const result = await processFont(url, config);
    const displayFontFamily = fontFamily || result.fontFamily;

    const successMessage = options.verbose
        ? `Downloaded ${displayFontFamily} (${totalSize.toFixed(1)}KB)`
        : `Downloaded ${displayFontFamily}`;

    spinner.succeed(chalk.green(successMessage));

    console.log(chalk.blue("\nFiles created:"));
    console.log(`📁 Font files: ${chalk.cyan(result.fontDir)}`);
    console.log(`📄 CSS file: ${chalk.cyan(result.cssFile)}`);
    
    console.log(chalk.blue("\nNext steps:"));
    console.log(`1. Add this line at the top of your CSS file:`);
    console.log(chalk.cyan(`   @import url("${result.cssFile.replace(/\\/g, '/')}");`));
    console.log(`2. Use the font in Tailwind classes: ${chalk.cyan(`font-${displayFontFamily.toLowerCase()}`)}`);

} catch (error) {
    spinner.fail(chalk.red("Error occurred"));
    console.error(chalk.red(error.message));
    if (options.verbose) {
        console.error(chalk.gray("\nStack trace:"));
        console.error(chalk.gray(error.stack));
    }
    process.exit(1);
}
