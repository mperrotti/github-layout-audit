# GitHub Layout Audit - Screenshot Automation

A comprehensive Playwright-based tool for capturing consistent screenshots of GitHub pages across different viewport sizes for layout pattern auditing.

## Features

- 🖥️ **Multi-viewport screenshots** (1440px desktop, 375px mobile)
- 🎨 **Light/dark mode support**
- 🔒 **Authentication handling** for private pages
- 📸 **Full-page and above-the-fold** screenshots
- 🎯 **Component-specific** screenshots
- ⚡ **Parallel execution** for efficiency
- 🤖 **GitHub Actions integration**

## Quick Start

### 1. Installation

```bash
git clone <your-repo>
cd github-layout-audit
npm install
npm run install-browsers
```

### 2. Basic Usage

```bash
# Take screenshots of URLs in urls.txt
npm run screenshot

# Take full-page screenshots
npm run screenshot:full

# Take dark mode screenshots  
npm run screenshot:dark
```

### 3. Authentication Setup (Optional)

For private pages or authenticated views:

```bash
npm run auth
```

Follow the prompts to log in to GitHub. This saves your session for future runs.

## Configuration

### URLs List (`urls.txt`)

Add URLs to screenshot, one per line:

```
https://github.com/
https://github.com/primer/react
# Comments start with #
```

### Environment Variables

- `COLOR_SCHEME`: `light` or `dark` (default: `light`)
- `FULL_PAGE`: `true` or `false` (default: based on config)

### Viewport Configurations

Edit `src/screenshot.test.ts` to customize viewport sizes:

```typescript
const VIEWPORT_CONFIGS = [
  { width: 1440, height: 900, fullPage: true, colorScheme: 'light' },
  { width: 375, height: 667, fullPage: true, colorScheme: 'light' }
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

- `npm run screenshot` - Basic screenshot capture
- `npm run screenshot:full` - Full-page screenshots only
- `npm run screenshot:dark` - Dark mode screenshots
- `npm run auth` - Set up GitHub authentication
- `npm run clean` - Remove screenshot and test output directories

## GitHub Actions

The workflow supports:
- Manual triggering with color scheme selection
- Artifact upload for easy download
- Scheduled runs for regular audits

Trigger via GitHub Actions tab or API:

```bash
gh workflow run screenshots.yml -f color_scheme=dark -f full_page=true
```

## Troubleshooting

### Authentication Issues

If you encounter auth problems:
1. Delete `storageState.json`
2. Run `npm run auth` again
3. Ensure you're fully logged in before saving state

### Screenshot Inconsistencies

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

## Advanced Usage

### Custom Selectors

Modify `screenshot.test.ts` to capture specific components:

```typescript
await takeScreenshot(page, {
  outputDir,
  filename: 'custom-component.png',
  selector: '.your-component-selector'
});
```

### Batch Processing

For large audits, consider splitting `urls.txt` into smaller files and running multiple processes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see LICENSE file for details.