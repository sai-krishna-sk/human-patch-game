const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:5173');
  
  // Wait for the app to load
  await new Promise(r => setTimeout(r, 2000));
  
  // Find the LevelSelector and click Level 12
  console.log("Looking for Level 12 button...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const level12Btn = buttons.find(b => b.textContent.includes('Level 12') || b.textContent.includes('The Arrest'));
    if (level12Btn) level12Btn.click();
  });
  
  await new Promise(r => setTimeout(r, 4000)); // wait for ringing

  console.log("Pressing E...");
  await page.keyboard.press('e');
  
  await new Promise(r => setTimeout(r, 1000));
  
  console.log("Clicking Accept...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const acceptBtn = buttons.find(b => b.textContent.includes('Accept'));
    if (acceptBtn) acceptBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 3000));
  
  console.log("Done testing.");
  await browser.close();
})();
