const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Viewport for a standard phone (vertical)
    await page.setViewport({ width: 412, height: 915, isMobile: true });

    // 1. Login Screen
    console.log('Navigating to login...');
    await page.goto('http://localhost:3015', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'raw_shot_1.png' });

    // 2. Home Screen (Register flow to get in)
    const registerBtn = await page.$('button::-p-text(Regístrate aquí)');
    if (registerBtn) await registerBtn.click();
    await page.waitForSelector('input[placeholder="Ej: Tzinails"]');

    await page.type('input[placeholder="usuario"]', 'user_' + Date.now());
    await page.type('input[placeholder="••••••••"]', 'pass123');
    await page.type('input[placeholder="Ej: Tzinails"]', 'Mi Negocio');

    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();

    await page.waitForSelector('h2::-p-text(Nuevo Turno)', { timeout: 10000 });
    await page.screenshot({ path: 'raw_shot_2.png' });

    // 3. List Screen (Scroll down)
    await page.evaluate(() => window.scrollBy(0, 300));
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'raw_shot_3.png' });

    await browser.close();
})();
