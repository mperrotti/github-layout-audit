import { Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

interface AuthConfig {
  githubToken?: string;
  authMethod?: "token" | "cookie";
}

export interface ScreenshotConfig {
  width: number;
  height: number;
  fullPage: boolean;
  colorScheme: "light" | "dark";
  deviceScaleFactor?: number;
  screenshotScale?: number; // Scale factor for final screenshot size (2 = 2x larger images)
}

export interface ScreenshotOptions {
  outputDir: string;
  filename: string;
  selector?: string;
  clip?: { x: number; y: number; width: number; height: number };
}

/**
 * Check if GitHub authentication state exists
 */
function hasGitHubAuth(): boolean {
  return fs.existsSync("github-auth-state.json");
}

/**
 * Prepare page for consistent screenshots with optional authentication
 */
export async function preparePage(
  page: Page,
  config: ScreenshotConfig
): Promise<void> {
  // Set up realistic browser headers to avoid being served basic HTML
  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    DNT: "1",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
  };

  await page.setExtraHTTPHeaders(headers);

  // Check for authentication state
  if (hasGitHubAuth()) {
    console.log("🔐 GitHub authentication available");
  } else {
    console.log(
      "ℹ️  No GitHub authentication (run `npm run auth` for authenticated pages)"
    );
  }

  // Set viewport dimensions (device scale factor is handled by playwright.config.ts)
  await page.setViewportSize({
    width: config.width,
    height: config.height,
  });

  // Set color scheme preference
  await page.emulateMedia({
    colorScheme: config.colorScheme,
  });

  // Emulate mobile characteristics for small screens
  if (config.width <= 768) {
    await page.emulateMedia({
      reducedMotion: "reduce",
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
    `,
  });
}

/**
 * Wait for page to be ready for screenshot
 */
export async function waitForPageReady(page: Page): Promise<void> {
  // Wait for DOM content to be loaded
  await page.waitForLoadState("domcontentloaded");

  // Wait for network to be mostly idle (important for CSS/JS loading)
  await page.waitForLoadState("networkidle");

  // Wait for fonts to load
  await page.evaluate(() => {
    return document.fonts.ready;
  });

  // Wait for CSS stylesheets to be fully loaded
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.styleSheets).map((stylesheet) => {
        try {
          // Try to access cssRules to ensure stylesheet is loaded
          return stylesheet.cssRules ? Promise.resolve() : Promise.reject();
        } catch (e) {
          // Stylesheet might still be loading
          return new Promise((resolve) => setTimeout(resolve, 100));
        }
      })
    );
  });

  // Wait for any images to load
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map(
          (img) =>
            new Promise((resolve) => {
              img.addEventListener("load", resolve);
              img.addEventListener("error", resolve);
              // Timeout for broken images
              setTimeout(resolve, 3000);
            })
        )
    );
  });

  // Additional wait for any remaining animations, lazy loading, or React hydration
  await page.waitForTimeout(2000);

  // Wait for any React/JS framework to be ready (GitHub uses React)
  await page.evaluate(() => {
    return new Promise((resolve) => {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(resolve);
      } else {
        setTimeout(resolve, 100);
      }
    });
  });
}

/**
 * Take screenshot with error handling
 */
export async function takeScreenshot(
  page: Page,
  options: ScreenshotOptions,
  config?: ScreenshotConfig
): Promise<void> {
  const { outputDir, filename, selector, clip } = options;

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  const screenshotPath = path.join(outputDir, filename);

  try {
    if (selector) {
      // Screenshot specific element
      const element = page.locator(selector);
      await element.screenshot({
        path: screenshotPath,
        type: "png",
        animations: "disabled",
      });
    } else {
      // Screenshot full page or viewport
      await page.screenshot({
        path: screenshotPath,
        fullPage: !clip,
        clip,
        type: "png",
        animations: "disabled",
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
    height,
  };
}
