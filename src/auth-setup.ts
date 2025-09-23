import { chromium } from "@playwright/test";
import path from "node:path";
import * as readline from "readline";
import * as fs from "fs";

/**
 * Setup GitHub authentication using browser session
 * Run with: npm run auth
 */
async function setupAuth() {
  console.log("🔐 Setting up GitHub authentication...");
  console.log("");
  console.log("We'll capture your browser session for authenticated pages.");
  console.log("This works better than tokens for web page screenshots.");
  console.log("");
  console.log("Steps:");
  console.log("1. A browser will open to GitHub");
  console.log("2. Log in normally (2FA/YubiKey will work)");
  console.log("3. We'll save your session cookies");
  console.log("4. Future screenshots will use your authenticated session");
  console.log("");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const browser = await chromium.launch({
    headless: false,
    args: ["--no-first-run", "--no-default-browser-check"],
  });

  try {
    console.log("🚀 Opening browser...");
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to GitHub
    await page.goto("https://github.com/login");

    console.log("👆 Please log in to GitHub in the browser window.");
    console.log(
      "   Complete any 2FA steps with your YubiKey or authenticator."
    );
    console.log("");

    // Wait for user to complete login
    await new Promise((resolve) => {
      rl.question(
        "Press Enter when you're logged in and see your GitHub dashboard: ",
        () => {
          resolve(undefined);
        }
      );
    });

    // Verify we're logged in by checking for authenticated content
    console.log("🔍 Verifying authentication...");

    try {
      // First, let's just save the state and test it works
      console.log("💾 Saving authentication state...");
      await context.storageState({ path: "github-auth-state.json" });

      // Test authentication with a longer timeout
      console.log("🔍 Testing access to settings page...");
      await page.goto("https://github.com/settings/profile", {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      // Wait a bit for the page to load
      await page.waitForTimeout(2000);

      // Check if we're authenticated (multiple ways)
      const authCheck = await page.evaluate(() => {
        const currentUrl = window.location.href;
        const title = document.title;
        const hasUserMenu =
          document.querySelector(
            '[data-target="react-app.accountSwitcher"]'
          ) !== null;
        const hasSettingsContent =
          document.querySelector('[data-target="react-app.embeddedData"]') !==
          null;
        const isOnSettingsPage = currentUrl.includes("/settings");
        const notOnLogin = !currentUrl.includes("/login");

        return {
          url: currentUrl,
          title: title,
          hasUserMenu,
          hasSettingsContent,
          isOnSettingsPage,
          notOnLogin,
          isAuthenticated: notOnLogin && (isOnSettingsPage || hasUserMenu),
        };
      });

      console.log(`📍 Current URL: ${authCheck.url}`);
      console.log(`📄 Page title: ${authCheck.title}`);

      if (authCheck.isAuthenticated) {
        console.log("✅ Authentication successful!");
        console.log("✅ Session saved to github-auth-state.json");
        console.log("");
        console.log(
          "Your screenshots will now include your authenticated session."
        );
        console.log(
          "⚠️  Keep github-auth-state.json secure and never commit it!"
        );
      } else {
        console.log("⚠️  Authentication unclear. Saving session anyway...");
        console.log(
          "   If you were logged in, the session should work for screenshots."
        );
        console.log("   You can test by running: npm run screenshot");
      }
    } catch (error) {
      console.log(
        "⚠️  Could not fully verify authentication, but session has been saved."
      );
      console.log(
        "   If you were logged in to GitHub, it should work for screenshots."
      );
      console.log("   Test with: npm run screenshot");
      console.log(
        "Error details:",
        error instanceof Error ? error.message : String(error)
      );
    }
  } catch (error) {
    console.error("❌ Failed to setup authentication:", error);
  } finally {
    await browser.close();
    rl.close();
  }
}

// Run if called directly
if (require.main === module) {
  setupAuth().catch(console.error);
}

export { setupAuth };
