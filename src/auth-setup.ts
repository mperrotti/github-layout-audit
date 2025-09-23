import { chromium } from '@playwright/test';
import path from 'node:path';

/**
 * Interactive script to set up GitHub authentication
 * Run with: npm run auth
 */
async function setupAuth() {
  console.log('🔐 Setting up GitHub authentication...');
  console.log('A browser will open. Please log in to GitHub and complete any 2FA steps.');
  console.log('Press Enter in this terminal when you\'re fully logged in...');
  
  // Wait for user to press Enter
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to GitHub
    await page.goto('https://github.com');
    
    console.log('Please complete your login in the browser window...');
    console.log('When you see your GitHub dashboard, press Enter here to save the session.');
    
    // Wait for user confirmation
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
    // Save the authentication state
    await context.storageState({ path: 'storageState.json' });
    
    console.log('✅ Authentication saved to storageState.json');
    console.log('You can now run authenticated screenshots!');
    console.log('');
    console.log('To enable authentication in your tests:');
    console.log('1. Uncomment the storageState line in playwright.config.ts');
    console.log('2. Add authenticated URLs to urls.txt');
    
  } catch (error) {
    console.error('❌ Failed to save authentication:', error);
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  setupAuth().catch(console.error);
}

export { setupAuth };