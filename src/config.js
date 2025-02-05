const fs = require('fs-extra');
const path = require('path');

async function updateTailwindConfig(fontFamily, configPath = 'tailwind.config.js') {
    try {
        let config;

        // Check if config exists
        if (await fs.pathExists(configPath)) {
            // Read existing config
            const configContent = await fs.readFile(configPath, 'utf8');

            // If config already contains the font family, skip
            if (configContent.includes(fontFamily)) {
                return;
            }

            // Parse existing config
            config = require(path.resolve(configPath));
        } else {
            // Create new config
            config = {
                content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
                theme: {
                    extend: {}
                },
                plugins: []
            };
        }

        // Add font family to config
        if (!config.theme) config.theme = {};
        if (!config.theme.extend) config.theme.extend = {};
        if (!config.theme.extend.fontFamily) config.theme.extend.fontFamily = {};

        config.theme.extend.fontFamily[fontFamily.toLowerCase()] = [`'${fontFamily}'`, 'sans-serif'];

        // Write updated config
        const configContent = `module.exports = ${JSON.stringify(config, null, 2)}`;
        await fs.writeFile(configPath, configContent);

    } catch (error) {
        throw new Error(`Failed to update Tailwind config: ${error.message}`);
    }
}

module.exports = { updateTailwindConfig };