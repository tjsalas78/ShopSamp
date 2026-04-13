import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import fs from 'fs-extra';

dotenv.config();

const POSHMARK_EMAIL = process.env.POSHMARK_EMAIL;
const POSHMARK_PASSWORD = process.env.POSHMARK_PASSWORD;
const HEADLESS = process.env.HEADLESS !== 'false';

const networkLog = [];

async function researchPoshmark() {
  let browser;
  try {
    console.log('🚀 Starting Poshmark API Research...\n');

    browser = await puppeteer.launch({
      headless: HEADLESS,
      args: ['--disable-blink-features=AutomationControlled'],
    });

    const page = await browser.newPage();

    // Set up network request logging
    page.on('request', (request) => {
      const data = {
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData(),
        resourceType: request.resourceType(),
      };
      networkLog.push(data);

      // Log API calls (not images/stylesheets)
      if (request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
        console.log(`📡 [${request.method()}] ${request.url()}`);
        if (request.postData()) {
          console.log(`   Payload: ${request.postData().substring(0, 100)}...`);
        }
      }
    });

    page.on('response', (response) => {
      if (response.request().resourceType() === 'xhr' || response.request().resourceType() === 'fetch') {
        console.log(`   ✓ Status: ${response.status()}`);
      }
    });

    // Navigate to Poshmark
    console.log('📍 Navigating to Poshmark...\n');
    await page.goto('https://poshmark.com/login', {
      waitUntil: 'networkidle2',
    });

    // Log in
    console.log('🔐 Logging in...\n');
    await page.type('input[name="login_id"]', POSHMARK_EMAIL);
    await page.type('input[name="password"]', POSHMARK_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {
      console.warn('⚠️  Navigation timeout (may be expected if 2FA is enabled)');
    });

    // Check if logged in
    const loggedIn = await page.evaluate(() => {
      return !!document.querySelector('[data-test="my-closet"]') ||
             document.body.innerText.includes('Home') ||
             document.body.innerText.includes('Closet');
    });

    if (loggedIn) {
      console.log('✅ Logged in successfully\n');

      // Wait for user to interact or just explore the DOM
      console.log('💡 Script paused. You can now manually interact with Poshmark.');
      console.log('   Inspect network requests in the console above.');
      console.log('   Press Enter in the terminal to continue...\n');

      // Keep browser open for 2 minutes for manual inspection
      await new Promise(resolve => {
        setTimeout(resolve, 120000);
      });
    } else {
      console.log('❌ Failed to log in. Check credentials and 2FA.\n');
      console.log('Current page content (first 500 chars):');
      const content = await page.content();
      console.log(content.substring(0, 500));
    }

    // Save network log
    await fs.writeJson('./network-log-poshmark.json', networkLog, { spaces: 2 });
    console.log('\n📊 Network log saved to network-log-poshmark.json');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

researchPoshmark();
