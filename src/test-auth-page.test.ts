import { test } from "@playwright/test";
import fs from "node:fs";

test("Test authenticated settings page", async ({ page }) => {
  const url = "https://github.com/settings/profile";

  // Load authentication if available
  if (fs.existsSync("github-auth-state.json")) {
    console.log("🔐 Loading authentication...");
    const authState = JSON.parse(
      fs.readFileSync("github-auth-state.json", "utf8")
    );
    await page.context().addCookies(authState.cookies);
  }

  console.log("📍 Navigating to settings page...");
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });

  await page.waitForTimeout(2000);

  // Check if we're authenticated
  const authCheck = await page.evaluate(() => {
    const currentUrl = window.location.href;
    const title = document.title;
    const isOnLogin = currentUrl.includes("/login");
    const hasSettingsContent =
      document.querySelector('input[name="user[name]"]') !== null;

    return {
      url: currentUrl,
      title: title,
      isOnLogin,
      hasSettingsContent,
      isAuthenticated:
        !isOnLogin && (hasSettingsContent || currentUrl.includes("/settings")),
    };
  });

  console.log(`📍 URL: ${authCheck.url}`);
  console.log(`📄 Title: ${authCheck.title}`);
  console.log(`🔐 Authenticated: ${authCheck.isAuthenticated}`);

  if (authCheck.isAuthenticated) {
    console.log("✅ Authentication working!");

    // Take a test screenshot
    await page.screenshot({ path: "test-auth-screenshot.png" });
    console.log("📸 Test screenshot saved: test-auth-screenshot.png");
  } else {
    console.log(
      "❌ Authentication failed - redirected to login or no settings content"
    );
  }
});
