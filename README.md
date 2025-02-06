# fastfont

A CLI tool to download Google Fonts and serve them locally in your project with TailwindCSS integration.

## Features

- 📦 Downloads WOFF2 font files from Google Fonts
- 🎨 Generates local CSS with correct file paths
- ⚡ Automatically updates TailwindCSS configuration
- 🔍 Auto-detects project structure (Next.js, React, Vue, etc.)
- 🌐 Optional WOFF1 format support for better browser compatibility

## Installation

```bash
npx fastfont@latest "YOUR_GOOGLE_FONTS_URL"
```

## Usage

1. Copy your Google Fonts URL from Google Fonts website
2. Run the command:

```bash
npx fastfont@latest "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap"
```

### Options

```bash
Options:
  -f, --fonts-dir <dir>          Directory to store font files
  -c, --css-file <file>          Path to generate the CSS file
  -t, --tailwind-config <file>   Path to Tailwind config file
  --include-woff1                Include WOFF1 format for better compatibility
  --verbose                      Show detailed progress information
  --dry-run                      Preview actions without executing them
```

## What It Does

1. Downloads WOFF2 files from Google's servers
2. Creates a local CSS file with correct paths
3. Updates your TailwindCSS config to include the font family
4. Sets up everything for local font serving

## Default Paths

The tool automatically detects your project type and uses appropriate default paths:

- Next.js: `public/fonts` and `styles/fonts.css`
- React/Vite: `public/fonts` and `src/styles/fonts.css`
- Vue: `public/fonts` and `src/assets/styles/fonts.css`
- Angular: `src/assets/fonts` and `src/styles/fonts.css`
- Generic: `fonts` and `styles/fonts.css`

## After Installation

1. Import the generated CSS file in your project
2. Use the font in your Tailwind classes:
```jsx
<div className="font-roboto">Hello World!</div>
```

## License

MIT
