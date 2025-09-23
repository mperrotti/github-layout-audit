> [!CAUTION]
> **Do not use this** if I didn't send it to you directly and talk you through it.
> This was built as a throwaway tool to help Katie and I automate screenshots for one project. It is heavily Copilot-generated, and pretty janky. Not meant for general consumption (yet)!

# GitHub Layout Audit - Screenshot Automation

A Playwright-based tool for capturing consistent screenshots of GitHub pages across different viewport sizes for layout pattern auditing.

## Features

- 🖥️ **Multi-viewport screenshots** (1440px desktop, 375px mobile)
- 🎨 **Light/dark mode support**
- 🔒 **Authentication handling** for private pages
- 📸 **Full-page and above-the-fold** screenshots

## Quick Start

### 1. Installation

```bash
npm install
npm run install-browsers
```

### 2. Basic Usage

```bash
# Take screenshots of URLs in urls.txt
npm run screenshot

# Take only full-page screenshots
npm run screenshot:full

# Take only dark mode screenshots
npm run screenshot:dark
```

### 3. Authentication Setup (Optional)

For private pages or authenticated views:

```bash
npm run auth
```

Hubbers: when you log into GitHub you'll have to use your passkey from Microsoft Authenticator. YubiKey will not work, and Okta won't work either.

## Configuration

### URLs List (`urls.txt`)

Add URLs to screenshot, one per line:

```
https://github.com/
https://github.com/primer/react
```

### Environment Variables

- `COLOR_SCHEME`: `light` or `dark` (default: `light`)
- `FULL_PAGE`: `true` or `false` (default: based on config)

### Viewport Configurations

Edit `src/screenshot.test.ts` to customize viewport sizes:

```typescript
const VIEWPORT_CONFIGS = [
  { width: 1440, height: 900, fullPage: true, colorScheme: "light" },
  { width: 375, height: 667, fullPage: true, colorScheme: "light" },
];
```

## Output Structure

```
screenshots/
├── light/
│   ├── 1440x900/
│   │   ├── github_com_abc123_full.png
│   │   ├── github_com_abc123_fold.png
│   │   └── components/
│   │       └── github_com_abc123_header.png
│   └── 375x667/
└── dark/
    └── ...
```

## Scripts

- `npm run screenshot` - Basic screenshot capture (not logged in)
- `npm run screenshot:full` - Full-page screenshots only
- `npm run screenshot:dark` - Dark mode screenshots only
- `npm run auth` - Set up GitHub authentication
- `npm run clean` - Remove screenshot and test output directories

## Troubleshooting

### Authentication Issues

If you encounter auth problems:

1. Delete `auth-config.json`
2. Run `npm run auth` again

### Screenshot Inconsistencies

Run `npm run clean` before you run your `screenshot`/`screenshot:*` script.

The tool includes several consistency measures:

- Animation/transition disabling
- Font loading waits
- Network idle waiting
- Reduced motion preferences

### Memory Issues

For large URL lists:

- Reduce parallel workers in `playwright.config.ts`
- Process URLs in batches
- Increase system memory/swap

### Everything else

DM @mperrotti

## Advanced Usage

### Batch Processing

For large audits, consider splitting `urls.txt` into smaller files and running multiple processes.

## Contributing

I wouldn't recommend it. This is a throwaway (for now).
