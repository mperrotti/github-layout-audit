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

// Single test configuration
const config: ScreenshotConfig = {
  width: 1440,
  height: 900,
  fullPage: true,
  colorScheme: "light",
};
const testUrl = "https://github.com/primer/react";

test("Test single URL styling", async ({ page }) => {
  console.log("🧪 Testing styling for:", testUrl);

  // Prepare page
  await preparePage(page, config);

  // Navigate with better logging
  console.log("📍 Navigating to URL...");
  await page.goto(testUrl, {
    waitUntil: "networkidle",
    timeout: 60000,
  });

  console.log("⏳ Waiting for page to be ready...");
  await waitForPageReady(page);

  // Log some debugging info
  const title = await page.title();
  console.log("📄 Page title:", title);

  const hasCSS = await page.evaluate(() => {
    return document.styleSheets.length > 0;
  });
  console.log(
    "🎨 Has stylesheets:",
    hasCSS,
    `(${await page.evaluate(() => document.styleSheets.length)} total)`
  );

  const bodyBgColor = await page.evaluate(() => {
    return window.getComputedStyle(document.body).backgroundColor;
  });
  console.log("🎨 Body background color:", bodyBgColor);

  // Take screenshot
  const outputDir = "test-screenshots";
  const filename = "test-styling.png";

  await takeScreenshot(page, {
    outputDir,
    filename,
  });

  console.log(`✅ Test screenshot saved to: ${outputDir}/${filename}`);
});
