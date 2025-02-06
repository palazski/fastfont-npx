# fastfont 🎨

Download Google Fonts locally and configure them with TailwindCSS in one command.
Entirely made by AI. React me at palazski@gmail.com

## Features

- 📦 Downloads font files locally with optimal directory structure
- 🔄 Supports variable fonts and all variants (weights, styles)
- 🌐 Preserves language subsets (latin, cyrillic, etc.)
- ⚡ Automatically configures TailwindCSS
- 🎯 Project-aware (detects Next.js, Vite, Vue, etc.)
- 💪 Handles complex font configurations

## Directory Structure

For a font named "Inter", fastfont will create:

```bash
fonts/
└── inter/
    ├── inter.css           # Font-specific CSS file
    └── inter/             # Font files directory
        ├── Inter-latin.woff2
        ├── Inter-cyrillic.woff2
        └── ...other variants
```

## Project Detection

Automatically detects your project type and uses appropriate paths:

- Next.js: `public/fonts`
- React/Vite: `public/fonts`
- Vue: `public/fonts`
- Angular: `src/assets/fonts`
- Generic: `fonts`

## After Installation

Add the generated CSS import to your main CSS file:

```css
import url("public/fonts/inter/inter.css");
```

Use the font in your HTML/JSX:

```html
<div class="font-inter">Hello World!</div>
```

## License

MIT