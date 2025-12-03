const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set viewport to a safe 16:9 ratio (412x732) to satisfy "max dimension <= 2x min dimension" rule
    await page.setViewport({ width: 412, height: 732, isMobile: true, hasTouch: true });

    console.log('Navigating to login...');
    await page.goto('http://localhost:3015', { waitUntil: 'networkidle0' });

    // Screenshot Login
    console.log('Taking login screenshot...');
    await page.screenshot({ path: 'C:/Users/Facundo/Desktop/captura_login.png' });

    // Register a new user to ensure we get in
    console.log('Clicking Register...');
    // Find button with text "Regístrate aquí"
    const registerBtn = await page.waitForSelector('button::-p-text(Regístrate aquí)');
    if (registerBtn) await registerBtn.click();

    // Wait for form to update (check for "Nombre" label which appears only in register)
    await page.waitForSelector('input[placeholder="Ej: Tzinails"]');

    console.log('Filling registration form...');
    await page.type('input[placeholder="usuario"]', 'demo_screenshots_' + Date.now()); // Unique user
    await page.type('input[placeholder="••••••••"]', 'demo123');
    await page.type('input[placeholder="Ej: Tzinails"]', 'Salón Demo');

    console.log('Submitting...');
    // Click the submit button (it says "Registrarse")
    const submitBtn = await page.waitForSelector('button[type="submit"]');
    await submitBtn.click();

    // Wait for navigation to main page (check for "Nuevo Turno" text)
    console.log('Waiting for main page...');
    await page.waitForSelector('h2::-p-text(Nuevo Turno)', { timeout: 10000 });

    // Screenshot Main Page
    console.log('Taking main page screenshot...');
    await page.screenshot({ path: 'C:/Users/Facundo/Desktop/captura_principal.png' });

    // Scroll down a bit and take another one just in case
    await page.evaluate(() => window.scrollBy(0, 500));
    await new Promise(r => setTimeout(r, 500)); // Wait for scroll
    await page.screenshot({ path: 'C:/Users/Facundo/Desktop/captura_lista.png' });

    await browser.close();
    console.log('Done!');
})();
