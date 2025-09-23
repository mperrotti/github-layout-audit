import { test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { slugify } from './utils/slugify';
import { 
  preparePage, 
  waitForPageReady, 
  takeScreenshot, 
  getAboveFoldClip,
  type ScreenshotConfig 
} from './utils/screenshot-helpers';

// Configuration
const VIEWPORT_CONFIGS: ScreenshotConfig[] = [
  { width: 1440, height: 900, fullPage: true, colorScheme: 'light' },
  { width: 375, height: 667, fullPage: true, colorScheme: 'light', deviceScaleFactor: 2 }
];

const OUTPUT_DIR = 'screenshots';
const FULL_PAGE = process.env.FULL_PAGE === 'true';
const COLOR_SCHEME = (process.env.COLOR_SCHEME as 'light' | 'dark') || 'light';

// Load URLs from file
function loadUrls(): string[] {
  try {
    const urlsContent = fs.readFileSync('urls.txt', 'utf8');
    return urlsContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  } catch (error) {
    console.error('Failed to load urls.txt:', error);
    return ['https://github.com']; // Fallback
  }
}

const urls = loadUrls();

// Generate tests for each URL and viewport combination
for (const url of urls) {
  test.describe(`Screenshots: ${url}`, () => {
    for (const config of VIEWPORT_CONFIGS) {
      const testName = `${config.width}x${config.height} (${COLOR_SCHEME})`;
      
      test(testName, async ({ page }) => {
        // Update config with environment color scheme
        const finalConfig = { ...config, colorScheme: COLOR_SCHEME };
        
        try {
          // Prepare page
          await preparePage(page, finalConfig);
          
          // Navigate to URL
          console.log(`📸 Capturing ${url} at ${config.width}x${config.height}`);
          await page.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
          });
          
          // Wait for page to be ready
          await waitForPageReady(page);
          
          // Generate filename and output directory
          const baseFilename = slugify(url);
          const outputDir = path.join(
            OUTPUT_DIR, 
            COLOR_SCHEME,
            `${config.width}x${config.height}`
          );
          
          // Take full page screenshot
          if (FULL_PAGE || finalConfig.fullPage) {
            await takeScreenshot(page, {
              outputDir,
              filename: `${baseFilename}_full.png`
            });
          }
          
          // Take above-the-fold screenshot
          const clip = getAboveFoldClip(config.width, config.height);
          await takeScreenshot(page, {
            outputDir,
            filename: `${baseFilename}_fold.png`,
            clip
          });
          
          // Optional: Take header screenshot for layout analysis
          try {
            await takeScreenshot(page, {
              outputDir: path.join(outputDir, 'components'),
              filename: `${baseFilename}_header.png`,
              selector: 'header, .Header, [role="banner"]'
            });
          } catch (error) {
            // Header selector might not exist, continue
            console.log(`ℹ️ No header found for ${url}`);
          }
          
        } catch (error) {
          console.error(`❌ Failed to screenshot ${url}:`, error);
          throw error;
        }
      });
    }
  });
}

// Cleanup test to organize screenshots
test.afterAll(async () => {
  console.log('\n📁 Screenshot capture complete!');
  console.log(`Screenshots saved to: ${path.resolve(OUTPUT_DIR)}`);
  
  // Optional: Create a summary report
  const summaryPath = path.join(OUTPUT_DIR, 'summary.json');
  const summary = {
    timestamp: new Date().toISOString(),
    totalUrls: urls.length,
    viewports: VIEWPORT_CONFIGS.map(c => `${c.width}x${c.height}`),
    colorScheme: COLOR_SCHEME,
    fullPage: FULL_PAGE
  };
  
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`📋 Summary saved to: ${summaryPath}`);
});