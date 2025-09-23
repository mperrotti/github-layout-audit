import { Page } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

export interface ScreenshotConfig {
  width: number;
  height: number;
  fullPage: boolean;
  colorScheme: 'light' | 'dark';
  deviceScaleFactor?: number;
}

export interface ScreenshotOptions {
  outputDir: string;
  filename: string;
  selector?: string;
  clip?: { x: number; y: number; width: number; height: number };
}

/**
 * Prepare page for consistent screenshots
 */
export async function preparePage(page: Page, config: ScreenshotConfig): Promise<void> {
  // Set viewport
  await page.setViewportSize({ 
    width: config.width, 
    height: config.height 
  });

  // Emulate mobile characteristics for small screens
  if (config.width <= 768) {
    await page.emulateMedia({ 
      reducedMotion: 'reduce'
    });
  }

  // Disable animations and transitions for consistency
  await page.addStyleTag({ 
    content: `
      *, *::before, *::after {
        animation-delay: -1ms !important;
        animation-duration: 1ms !important;
        animation-iteration-count: 1 !important;
        background-attachment: initial !important;
        scroll-behavior: auto !important;
        transition-duration: 0ms !important;
        transition-delay: 0ms !important;
      }
      
      /* Hide scrollbars for cleaner screenshots */
      ::-webkit-scrollbar {
        display: none;
      }
      
      /* Ensure consistent font rendering */
      * {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
    `
  });
}

/**
 * Wait for page to be ready for screenshot
 */
export async function waitForPageReady(page: Page): Promise<void> {
  // Wait for network to be mostly idle
  await page.waitForLoadState('networkidle');
  
  // Wait for fonts to load
  await page.evaluate(() => {
    return document.fonts.ready;
  });
  
  // Additional wait for any remaining animations or lazy loading
  await page.waitForTimeout(1000);
  
  // Wait for any images to load
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.images)
        .filter(img => !img.complete)
        .map(img => new Promise(resolve => {
          img.addEventListener('load', resolve);
          img.addEventListener('error', resolve);
        }))
    );
  });
}

/**
 * Take screenshot with error handling
 */
export async function takeScreenshot(
  page: Page, 
  options: ScreenshotOptions
): Promise<void> {
  const { outputDir, filename, selector, clip } = options;
  
  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });
  
  const screenshotPath = path.join(outputDir, filename);
  
  try {
    if (selector) {
      // Screenshot specific element
      const element = page.locator(selector);
      await element.screenshot({ path: screenshotPath });
    } else {
      // Screenshot full page or viewport
      await page.screenshot({
        path: screenshotPath,
        fullPage: !clip,
        clip
      });
    }
    
    console.log(`✓ Screenshot saved: ${screenshotPath}`);
  } catch (error) {
    console.error(`✗ Failed to take screenshot ${screenshotPath}:`, error);
    throw error;
  }
}

/**
 * Get above-the-fold clip dimensions
 */
export function getAboveFoldClip(width: number, height: number) {
  return {
    x: 0,
    y: 0,
    width,
    height
  };
}