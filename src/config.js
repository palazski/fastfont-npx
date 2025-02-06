import fs from 'fs-extra';
import path from 'path';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper function to stringify without quotes on keys
function stringifyConfig(obj, indent = 2) {
    let str = JSON.stringify(obj, null, indent);
    
    // Remove quotes from keys
    str = str.replace(/"([^"]+)":/g, '$1:');
    
    // Replace escaped double quotes with single quotes
    str = str.replace(/\\\"/g, "'");
    
    // Make font family array definition more compact
    str = str.replace(/\[\n\s*(['"].*?['"])\s*,\n\s*(['"].*?['"])\s*\]/g, '[$1, $2]');
    
    return str;
}

async function readConfig(configPath) {
    try {
        const fileUrl = pathToFileURL(path.resolve(configPath)).href;
        const configModule = await import(fileUrl);
        return structuredClone(configModule.default);
    } catch {
        // Fallback to require if import fails
        return structuredClone(require(path.resolve(configPath)));
    }
}

async function updateTailwindConfig(fontFamily, configPath = 'tailwind.config.js') {
    let config;
    let isESM = false;
    let originalContent = '';

    try {
        if (await fs.pathExists(configPath)) {
            originalContent = await fs.readFile(configPath, 'utf8');
            
            // Skip if font family already exists
            if (originalContent.includes(fontFamily)) {
                return;
            }

            // Detect if it's an ESM config
            isESM = originalContent.includes('export default');

            try {
                config = await readConfig(configPath);
            } catch (error) {
                // If both import and require fail, create new config
                config = {
                    content: ['./src/**/*.{js,ts,jsx,tsx}'],
                    theme: { extend: {} },
                    plugins: []
                };
            }
        } else {
            config = {
                content: ['./src/**/*.{js,ts,jsx,tsx}'],
                theme: { extend: {} },
                plugins: []
            };
        }

        // Ensure theme.extend.fontFamily exists
        config.theme = config.theme || {};
        config.theme.extend = config.theme.extend || {};
        config.theme.extend.fontFamily = config.theme.extend.fontFamily || {};

        // Add font family definition
        config.theme.extend.fontFamily[fontFamily.toLowerCase()] = [`'${fontFamily}'`, 'sans-serif'];

        // Format the config for writing
        const indent = '    ';
        const fontFamilyStr = `${indent.repeat(2)}${fontFamily.toLowerCase()}: ["'${fontFamily}'", "sans-serif"]`;
        
        if (originalContent && originalContent.includes('extend: {')) {
            // Insert into existing config
            const parts = originalContent.split('extend: {');
            originalContent = parts[0] + 'extend: {\n' + 
                            (originalContent.includes('fontFamily: {') ? '' : `${indent}fontFamily: {\n`) +
                            fontFamilyStr + ',\n' + 
                            parts[1];
            await fs.writeFile(configPath, originalContent);
        } else {
            // Write new config
            const configString = isESM 
                ? `/** @type {import('tailwindcss').Config} */\n\nexport default ${JSON.stringify(config, null, 2)}`
                : `/** @type {import('tailwindcss').Config} */\n\nmodule.exports = ${JSON.stringify(config, null, 2)}`;
            await fs.writeFile(configPath, configString);
        }
    } catch (err) {
        throw new Error(`Failed to update Tailwind config: ${err.message}`);
    }
}

export { updateTailwindConfig };