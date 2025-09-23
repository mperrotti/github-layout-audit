const { chromium } = require("@playwright/test");

async function testAuth() {
  console.log("Testing browser launch...");

  try {
    const browser = await chromium.launch({ headless: false });
    console.log("✅ Browser launched successfully");

    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("https://github.com");
    console.log("✅ Navigated to GitHub");

    // Wait a bit then close
    await new Promise((resolve) => setTimeout(resolve, 3000));

    await browser.close();
    console.log("✅ Browser closed");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testAuth();
