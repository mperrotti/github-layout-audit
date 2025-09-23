const { chromium } = require("@playwright/test");

async function debugStyling() {
  console.log("🚀 Starting browser...");
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Set realistic headers
  await page.setExtraHTTPHeaders({
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  });

  console.log("📍 Navigating to GitHub...");
  await page.goto("https://github.com/primer/react");
  await page.waitForLoadState("networkidle");

  console.log("📄 Page title:", await page.title());

  const styleSheetCount = await page.evaluate(
    () => document.styleSheets.length
  );
  console.log("🎨 Stylesheets loaded:", styleSheetCount);

  const bgColor = await page.evaluate(
    () => window.getComputedStyle(document.body).backgroundColor
  );
  console.log("🎨 Body background:", bgColor);

  const headerExists = await page.evaluate(() => {
    const header = document.querySelector("header");
    return !!header;
  });
  console.log("🔍 Header exists:", headerExists);

  // Take a screenshot to debug
  await page.screenshot({ path: "debug-screenshot.png" });
  console.log("📸 Debug screenshot saved");

  // Wait a bit so we can see the browser
  console.log("⏳ Waiting 5 seconds...");
  await page.waitForTimeout(5000);

  await browser.close();
}

debugStyling().catch(console.error);
