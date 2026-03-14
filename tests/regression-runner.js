const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const dir = '/Users/lambogreny/oracles/smsok-clone/tests/screenshots';
  const results = [];

  async function dismissConsent(page) {
    const btn = page.locator('button:has-text("ยอมรับทั้งหมด")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);
    }
  }

  // === 1. LOGIN FLOW ===
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto('http://localhost:3000/login', { timeout: 15000, waitUntil: 'networkidle' });
    await dismissConsent(page);

    const hasEmail = await page.locator('input[type=email]').first().isVisible().catch(() => false);
    const hasPass = await page.locator('input[type=password]').first().isVisible().catch(() => false);

    await page.locator('input[type=email]').first().fill('test@invalid.com');
    await page.locator('input[type=password]').first().fill('wrongpassword123');
    await page.locator('button[type=submit]').first().click();
    await page.waitForTimeout(2500);

    const body = await page.textContent('body') || '';
    const hasError = body.includes('ไม่ถูกต้อง') || body.includes('invalid') || body.includes('ผิดพลาด');
    await page.screenshot({ path: dir + '/reg-login-error.png' });

    results.push({ test: 'Login: form elements', pass: hasEmail && hasPass, detail: 'email:' + hasEmail + ' pass:' + hasPass });
    results.push({ test: 'Login: invalid creds error', pass: hasError, detail: hasError ? 'Error shown' : 'No error' });
    results.push({ test: 'Login: JS errors', pass: errors.length === 0, detail: errors.length > 0 ? errors[0].substring(0, 80) : 'none' });
    await ctx.close();
  }

  // === 2. REGISTER FLOW ===
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto('http://localhost:3000/register', { timeout: 15000, waitUntil: 'networkidle' });
    await dismissConsent(page);
    await page.screenshot({ path: dir + '/reg-register.png' });

    const body = await page.textContent('body') || '';
    const hasForm = body.includes('สร้างบัญชีใหม่') || body.includes('Register');
    results.push({ test: 'Register: page renders', pass: hasForm && errors.length === 0, detail: 'form:' + hasForm + ' jsErrors:' + errors.length });
    await ctx.close();
  }

  // === 3. AUTH GUARDS ===
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const routes = ['/dashboard', '/dashboard/send', '/dashboard/messages', '/dashboard/settings', '/dashboard/contacts'];
    for (const r of routes) {
      const page = await ctx.newPage();
      await page.goto('http://localhost:3000' + r, { timeout: 10000, waitUntil: 'networkidle' });
      const ok = page.url().includes('/login');
      results.push({ test: 'Auth guard: ' + r, pass: ok, detail: ok ? 'Redirected' : 'NOT REDIRECTED' });
      await page.close();
    }
    await ctx.close();
  }

  // === 4. PUBLIC PAGES ===
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    for (const path of ['/pricing', '/help', '/status', '/terms', '/privacy', '/cookies']) {
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', err => errs.push(err.message));
      page.on('console', msg => { if (msg.type() === 'error') errs.push(msg.text()); });
      await page.goto('http://localhost:3000' + path, { timeout: 10000, waitUntil: 'networkidle' });
      const body = await page.textContent('body') || '';
      const hasAppError = body.includes('Something went wrong') || body.includes('Application error');
      results.push({ test: 'Public: ' + path, pass: errs.length === 0 && !hasAppError, detail: 'jsErrors:' + errs.length });
      await page.close();
    }
    await ctx.close();
  }

  // === 5. BACKOFFICE ===
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto('http://localhost:3001/admin', { timeout: 10000, waitUntil: 'networkidle' });
    results.push({ test: 'Backoffice: /admin auth guard', pass: page.url().includes('/login'), detail: page.url().includes('/login') ? 'Redirected' : 'NOT REDIRECTED' });

    await page.goto('http://localhost:3001/login', { timeout: 10000, waitUntil: 'networkidle' });
    const body = await page.textContent('body') || '';
    results.push({ test: 'Backoffice: login renders', pass: body.includes('SMSOK Admin'), detail: body.includes('SMSOK Admin') ? 'OK' : 'Missing branding' });
    results.push({ test: 'Backoffice: JS errors', pass: errors.length === 0, detail: errors.length + ' errors' });
    await page.screenshot({ path: dir + '/reg-backoffice.png' });
    await ctx.close();
  }

  // === 6. MOBILE ===
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('http://localhost:3000', { timeout: 15000, waitUntil: 'networkidle' });
    await dismissConsent(page);
    await page.screenshot({ path: dir + '/reg-mobile-home.png' });
    const hamburger = page.locator('button[aria-label*="เมนู"]').first();
    const hasHamburger = await hamburger.isVisible({ timeout: 3000 }).catch(() => false);
    results.push({ test: 'Mobile: homepage', pass: errors.length === 0, detail: 'hamburger:' + hasHamburger + ' jsErrors:' + errors.length });

    await page.goto('http://localhost:3000/login', { timeout: 10000, waitUntil: 'networkidle' });
    await dismissConsent(page);
    await page.screenshot({ path: dir + '/reg-mobile-login.png' });
    const mobileForm = await page.locator('input[type=email]').first().isVisible().catch(() => false);
    results.push({ test: 'Mobile: login form', pass: mobileForm, detail: mobileForm ? '375px OK' : 'BROKEN' });
    await ctx.close();
  }

  // === PRINT ===
  let passed = 0, failed = 0;
  for (const r of results) {
    const icon = r.pass ? 'PASS' : 'FAIL';
    if (r.pass) passed++; else failed++;
    console.log(icon + ' | ' + r.test + ' | ' + r.detail);
  }
  console.log('\n=== TOTAL: ' + passed + ' passed, ' + failed + ' failed out of ' + results.length + ' ===');

  await browser.close();
})();
