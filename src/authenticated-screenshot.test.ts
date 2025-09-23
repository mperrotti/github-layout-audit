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

// Configuration - same as main screenshot test
const VIEWPORT_CONFIGS: ScreenshotConfig[] = [
  { width: 1440, height: 900, fullPage: true, colorScheme: 'light' },
  { width: 375, height: 667, fullPage: true, colorScheme: 'light' }
];

const OUTPUT_DIR = 'authenticated-screenshots';
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

// Generate tests for each URL and viewport combination with authentication
for (const url of urls) {
  test.describe(`Authenticated Screenshots: ${url}`, () => {
    for (const config of VIEWPORT_CONFIGS) {
      const testName = `${config.width}x${config.height} (${COLOR_SCHEME}) [AUTH]`;
      
      test(testName, async ({ page }) => {
        // Update config with environment color scheme
        const finalConfig = { ...config, colorScheme: COLOR_SCHEME };
        
        try {
          // ALWAYS load authentication for this script
          if (fs.existsSync('github-auth-state.json')) {
            console.log(`🔐 Loading authentication for ${url}`);
            const authState = JSON.parse(fs.readFileSync('github-auth-state.json', 'utf8'));
            await page.context().addCookies(authState.cookies);
          } else {
            console.log(`⚠️  No authentication state found. Run 'npm run auth' first.`);
            console.log(`   Proceeding without authentication...`);
          }
          
          // Prepare page with authentication
          console.log(`🔧 Preparing authenticated page for ${config.width}x${config.height}`);
          await preparePage(page, finalConfig);
          
          // Navigate to URL with robust error handling
          console.log(`📸 Capturing authenticated ${url} at ${config.width}x${config.height}`);
          
          try {
            await page.goto(url, {
              waitUntil: 'domcontentloaded',
              timeout: 30000,
            });
          } catch (error) {
            console.log(`⚠️  Initial navigation failed, retrying with load event...`);
            await page.goto(url, {
              waitUntil: 'load',
              timeout: 30000,
            });
          }
          
          // Wait for authentication to settle and page to be ready
          await page.waitForTimeout(2000);
          
          console.log(`⏳ Waiting for page ready...`);
          
          // Use a simplified page ready wait that avoids networkidle issues
          await page.waitForLoadState('domcontentloaded');
          
          // Wait for fonts
          await page.evaluate(() => document.fonts.ready);
          
          // Wait for images
          await page.evaluate(() => {
            return Promise.all(
              Array.from(document.images)
                .filter(img => !img.complete)
                .map(img => new Promise(resolve => {
                  img.addEventListener('load', resolve);
                  img.addEventListener('error', resolve);
                  setTimeout(resolve, 3000); // Timeout for broken images
                }))
            );
          });
          
          // Additional wait for any JS/React hydration
          await page.waitForTimeout(3000);

          // Check authentication status and get debug info
          const pageInfo = await page.evaluate(() => {
            const currentUrl = window.location.href;
            const title = document.title;
            const isOnLogin = currentUrl.includes('/login');
            const hasUserMenu = document.querySelector('[data-target="react-app.accountSwitcher"]') !== null;
            const hasSettingsContent = document.querySelector('input[name="user[name]"]') !== null;
            const styleSheetCount = document.styleSheets.length;
            
            // Determine if authenticated (multiple indicators)
            const authIndicators = {
              notOnLogin: !isOnLogin,
              hasUserMenu,
              hasSettingsContent: hasSettingsContent || currentUrl.includes('/settings'),
              urlOk: !currentUrl.includes('/login')
            };
            
            const isAuthenticated = authIndicators.notOnLogin && authIndicators.urlOk;
            
            return {
              url: currentUrl,
              title: title,
              styleSheetCount,
              authIndicators,
              isAuthenticated
            };
          });
          
          console.log(`📄 Page: ${pageInfo.title}`);
          console.log(`🎨 Stylesheets: ${pageInfo.styleSheetCount}`);
          console.log(`🔐 Authenticated: ${pageInfo.isAuthenticated}`);
          console.log(`📍 Final URL: ${pageInfo.url}`);
          
          if (!pageInfo.isAuthenticated && url.includes('/settings')) {
            console.log(`⚠️  Expected authentication for ${url} but got redirected to ${pageInfo.url}`);
          }

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
              filename: `${baseFilename}_full_auth.png`
            });
          }
          
          // Take above-the-fold screenshot
          const clip = getAboveFoldClip(config.width, config.height);
          await takeScreenshot(page, {
            outputDir,
            filename: `${baseFilename}_fold_auth.png`,
            clip
          });
          
          // Optional: Take header screenshot for layout analysis
          try {
            await takeScreenshot(page, {
              outputDir: path.join(outputDir, 'components'),
              filename: `${baseFilename}_header_auth.png`,
              selector: 'header, .Header, [role="banner"]'
            });
          } catch (error) {
            // Header selector might not exist, continue
            console.log(`ℹ️ No header found for ${url}`);
          }
          
        } catch (error) {
          console.error(`❌ Failed to screenshot authenticated ${url}:`, error);
          throw error;
        }
      });
    }
  });
}

// Cleanup test to organize screenshots
test.afterAll(async () => {
  console.log('\n📁 Authenticated screenshot capture complete!');
  console.log(`Screenshots saved to: ${path.resolve(OUTPUT_DIR)}`);
  
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  // Create a summary report
  const summaryPath = path.join(OUTPUT_DIR, 'auth-summary.json');
  const summary = {
    timestamp: new Date().toISOString(),
    totalUrls: urls.length,
    viewports: VIEWPORT_CONFIGS.map(c => `${c.width}x${c.height}`),
    colorScheme: COLOR_SCHEME,
    fullPage: FULL_PAGE,
    authenticationUsed: fs.existsSync('github-auth-state.json'),
    screenshotType: 'authenticated'
  };
  
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`📋 Summary saved to: ${summaryPath}`);
});
