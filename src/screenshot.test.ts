import { test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { slugify } from "./utils/slugify";
import {
  preparePage,
  waitForPageReady,
  takeScreenshot,
  getAboveFoldClip,
  type ScreenshotConfig,
} from "./utils/screenshot-helpers";

// Configuration
const VIEWPORT_CONFIGS: ScreenshotConfig[] = [
  { width: 1440, height: 900, fullPage: true, colorScheme: "light" },
  { width: 375, height: 667, fullPage: true, colorScheme: "light" },
];

const OUTPUT_DIR = "screenshots";
const FULL_PAGE = process.env.FULL_PAGE === "true";
const COLOR_SCHEME = (process.env.COLOR_SCHEME as "light" | "dark") || "light";

// Load URLs from file
function loadUrls(): string[] {
  try {
    const urlsContent = fs.readFileSync("urls.txt", "utf8");
    return urlsContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
  } catch (error) {
    console.error("Failed to load urls.txt:", error);
    return ["https://github.com"]; // Fallback
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
          // Check if this URL needs authentication
          const needsAuth =
            url.includes("/settings") ||
            url.includes("/notifications") ||
            url.includes("github.com/dashboard");

          if (needsAuth) {
            if (fs.existsSync("github-auth-state.json")) {
              console.log(`🔐 Loading authentication for ${url}`);
              const authState = JSON.parse(
                fs.readFileSync("github-auth-state.json", "utf8")
              );
              await page.context().addCookies(authState.cookies);
            } else {
              console.log(
                `⚠️  ${url} requires authentication but no auth state found. Run 'npm run auth' first.`
              );
            }
          }

          // Prepare page
          console.log(`🔧 Preparing page for ${config.width}x${config.height}`);
          await preparePage(page, finalConfig);

          // Navigate to URL
          console.log(
            `📸 Capturing ${url} at ${config.width}x${config.height}`
          );

          // Try navigation with fallback wait strategies
          try {
            await page.goto(url, {
              waitUntil: "domcontentloaded",
              timeout: 30000,
            });
          } catch (error) {
            console.log(
              `⚠️  Initial navigation failed, retrying with load event...`
            );
            await page.goto(url, {
              waitUntil: "load",
              timeout: 30000,
            });
          }

          // Add a small wait for authentication to settle
          if (needsAuth) {
            await page.waitForTimeout(2000);
          }

          console.log(`⏳ Waiting for page ready...`);
          // Wait for page to be ready
          await waitForPageReady(page);

          // Debug info and auth verification
          const title = await page.title();
          const styleCount = await page.evaluate(
            () => document.styleSheets.length
          );

          if (needsAuth) {
            const authCheck = await page.evaluate(() => {
              const currentUrl = window.location.href;
              const isOnLogin = currentUrl.includes("/login");
              const hasSettingsContent =
                document.querySelector('input[name="user[name]"]') !== null;
              return {
                isAuthenticated:
                  !isOnLogin &&
                  (hasSettingsContent || currentUrl.includes("/settings")),
                currentUrl,
              };
            });
            console.log(
              `📄 Page: ${title}, Stylesheets: ${styleCount}, Auth: ${authCheck.isAuthenticated}`
            );

            if (!authCheck.isAuthenticated) {
              console.log(
                `⚠️  Authentication may have failed for ${url} - at ${authCheck.currentUrl}`
              );
            }
          } else {
            console.log(`📄 Page: ${title}, Stylesheets: ${styleCount}`);
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
              filename: `${baseFilename}_full.png`,
            });
          }

          // Take above-the-fold screenshot
          const clip = getAboveFoldClip(config.width, config.height);
          await takeScreenshot(page, {
            outputDir,
            filename: `${baseFilename}_fold.png`,
            clip,
          });

          // Optional: Take header screenshot for layout analysis
          try {
            await takeScreenshot(page, {
              outputDir: path.join(outputDir, "components"),
              filename: `${baseFilename}_header.png`,
              selector: 'header, .Header, [role="banner"]',
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
  console.log("\n📁 Screenshot capture complete!");
  console.log(`Screenshots saved to: ${path.resolve(OUTPUT_DIR)}`);

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Optional: Create a summary report
  const summaryPath = path.join(OUTPUT_DIR, "summary.json");
  const summary = {
    timestamp: new Date().toISOString(),
    totalUrls: urls.length,
    viewports: VIEWPORT_CONFIGS.map((c) => `${c.width}x${c.height}`),
    colorScheme: COLOR_SCHEME,
    fullPage: FULL_PAGE,
  };

  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`📋 Summary saved to: ${summaryPath}`);
});
